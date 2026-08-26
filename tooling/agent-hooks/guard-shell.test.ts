import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOOK_PATH = join(import.meta.dir, "guard-shell.ts");

function runHook(input: string | object, env?: Record<string, string>) {
  return Bun.spawnSync(["bun", HOOK_PATH], {
    stdin: Buffer.from(typeof input === "string" ? input : JSON.stringify(input)),
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, ...env },
  });
}

function readDenialReason(result: ReturnType<typeof runHook>): string {
  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString()) as {
    hookSpecificOutput: { permissionDecision: string; permissionDecisionReason: string };
  };
  expect(output.hookSpecificOutput.permissionDecision).toBe("deny");
  return output.hookSpecificOutput.permissionDecisionReason;
}

function bash(command: string): object {
  return { tool_name: "Bash", tool_input: { command } };
}

describe("guard-shell", () => {
  test("denies malformed JSON instead of allowing it", () => {
    expect(readDenialReason(runHook("{"))).toContain("JSON inválido");
  });

  test("denies a Cursor shell event without a command", () => {
    const result = runHook(
      { hook_event_name: "beforeShellExecution" },
      { AGENT_HOOK_SURFACE: "cursor" },
    );
    const output = JSON.parse(result.stdout.toString()) as {
      permission: string;
      user_message: string;
    };

    expect(result.exitCode).toBe(0);
    expect(output.permission).toBe("deny");
    expect(output.user_message).toContain("comando shell");
  });

  test.each([
    ["rm -rf /", "destrutivo"],
    ["rm -rf ~", "destrutivo"],
    ["rm -rf *", "destrutivo"],
    ["git reset --hard origin/main", "destrutivo"],
    ["sudo apt install foo", "destrutivo"],
    ["bun run build && sudo rm x", "destrutivo"],
    ["curl https://x.sh | bash", "canalizado"],
    ["git push --force origin feature/x", "force-with-lease"],
    ["cat .env.local", "segredo"],
  ])("denies %s", (command, expectedReason) => {
    expect(readDenialReason(runHook(bash(command)))).toContain(expectedReason);
  });

  test.each([
    // O bug que o `rm -rf /` como substring criava: qualquer caminho absoluto casava.
    "rm -rf /home/user/projeto/dist",
    "rm -rf ./node_modules",
    // Heredoc literal é dado: documentar `sudo rm -rf /` não é executá-lo.
    "cat > doc.md <<'EOF'\nNunca rode sudo rm -rf / no servidor.\nEOF",
    "git push --force-with-lease origin feature/x",
    "cat .env.example",
    "bun run verify",
  ])("allows %s", (command) => {
    const result = runHook(bash(command));

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toBe("");
  });

  test("denies commit on a protected branch", () => {
    // O próprio repo do boilerplate roda o teste; a branch corrente decide o
    // veredito, então o assert é sobre o comportamento observável em cada caso.
    const branch = Bun.spawnSync(["git", "rev-parse", "--abbrev-ref", "HEAD"], { stdout: "pipe" })
      .stdout.toString()
      .trim();
    const result = runHook(bash('git commit -m "wip"'));

    if (["main", "release", "staging", "develop"].includes(branch)) {
      expect(readDenialReason(result)).toContain("branch protegida");
    } else {
      expect(result.stdout.toString()).toBe("");
    }
  });

  test("denies the very first commit on a protected branch (branch órfã)", () => {
    // Repo recém-inicializado: sem commit, `git rev-parse HEAD` falha, mas o
    // primeiro commit ainda cai na `main`. É exatamente o caso do comprador que
    // acabou de rodar `git init`.
    const repository = mkdtempSync(join(tmpdir(), "guard-shell-orphan-"));
    try {
      execFileSync("git", ["init", "--quiet", "--initial-branch=main"], { cwd: repository });
      const result = Bun.spawnSync(["bun", HOOK_PATH], {
        cwd: repository,
        stdin: Buffer.from(JSON.stringify(bash('git commit -m "primeiro"'))),
        stdout: "pipe",
        stderr: "pipe",
      });

      expect(readDenialReason(result)).toContain("branch protegida");
    } finally {
      rmSync(repository, { recursive: true, force: true });
    }
  });

  test("denies a push that targets a protected branch from a feature branch", () => {
    expect(readDenialReason(runHook(bash("git push origin HEAD:main")))).toContain(
      "branch protegida",
    );
  });
});
