import { afterEach, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOOK_PATH = join(import.meta.dir, "pre-pr-review-gate.ts");
const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories) {
    rmSync(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
  tempDirectories.length = 0;
});

function createTempDirectory() {
  const directory = mkdtempSync(join(tmpdir(), "pre-pr-review-gate-"));
  tempDirectories.push(directory);
  return directory;
}

function runGit(directory: string, args: string[]) {
  return execFileSync("git", args, {
    cwd: directory,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function createGitRepository() {
  const repository = createTempDirectory();
  runGit(repository, ["init", "--quiet"]);
  runGit(repository, [
    "-c",
    "user.name=Hook Test",
    "-c",
    "user.email=hook-test@example.com",
    "commit",
    "--allow-empty",
    "--quiet",
    "-m",
    "initial",
  ]);
  return repository;
}

function runHook(directory: string, input: string | object) {
  return Bun.spawnSync(["bun", HOOK_PATH], {
    cwd: directory,
    stdin: Buffer.from(typeof input === "string" ? input : JSON.stringify(input)),
    stdout: "pipe",
    stderr: "pipe",
  });
}

function readDenial(result: ReturnType<typeof runHook>) {
  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString()) as {
    hookSpecificOutput: {
      permissionDecision: string;
      permissionDecisionReason: string;
    };
  };
  expect(output.hookSpecificOutput.permissionDecision).toBe("deny");
  return output.hookSpecificOutput.permissionDecisionReason;
}

describe("pre-pr-review-gate", () => {
  test("allows unrelated Bash commands", () => {
    const result = runHook(createGitRepository(), {
      tool_name: "Bash",
      tool_input: { command: "git status" },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toBe("");
  });

  test("denies malformed JSON with exit zero", () => {
    expect(readDenial(runHook(createTempDirectory(), "{"))).toContain("JSON inválido");
  });

  test("denies a base that is neither main nor a feature branch, before Git checks", () => {
    const reason = readDenial(
      runHook(createTempDirectory(), {
        tool_name: "Bash",
        tool_input: { command: "gh pr create --base develop" },
      }),
    );

    expect(reason).toContain("base informada foi `develop`");
    expect(reason).toContain("`main`");
  });

  test("checks the HEAD-bound seal for a quoted main base", () => {
    const repository = createGitRepository();
    const head = runGit(repository, ["rev-parse", "HEAD"]);
    const reason = readDenial(
      runHook(repository, {
        tool_name: "Bash",
        tool_input: { command: 'gh pr create --base "main"' },
      }),
    );

    expect(reason).toContain(head.slice(0, 8));
    expect(reason).toContain("pré-review");
  });

  test("accepts the shared Agent Skills seal for the current HEAD", () => {
    const repository = createGitRepository();
    const head = runGit(repository, ["rev-parse", "HEAD"]);
    const sealDirectory = join(repository, ".agents/tmp");
    mkdirSync(sealDirectory, { recursive: true });
    writeFileSync(join(sealDirectory, `pre-review-${head}.ok`), head);
    writeFileSync(join(sealDirectory, `pr-size-ack-${head}.ok`), head);

    const result = runHook(repository, {
      tool_name: "Bash",
      tool_input: { command: "gh pr create --base main" },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toBe("");
  });

  test("ignora o comando citado dentro de um heredoc literal", () => {
    // Escrever um doc que EXPLICA `gh pr create` não é abrir uma PR. Sem isto,
    // documentar o próprio fluxo travava na escrita do documento.
    const result = runHook(createGitRepository(), {
      tool_name: "Bash",
      tool_input: {
        command: "cat >> MEMORY.md <<'DOC'\nO hook bloqueia `gh pr create` sem o selo.\nDOC",
      },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toBe("");
  });

  test("denies safely outside a Git repository", () => {
    const result = runHook(createTempDirectory(), {
      tool_name: "Bash",
      tool_input: { command: "gh pr create" },
    });
    const reason = readDenial(result);

    expect(reason).toContain("HEAD");
    expect(reason).toContain("repositório");
    expect(result.stderr.toString()).toBe("");
  });
});
