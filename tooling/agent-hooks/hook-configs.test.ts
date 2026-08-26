import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../..");
const CONFIG_PATHS = [
  ".claude/settings.json",
  ".codex/hooks.json",
  ".cursor/hooks.json",
  ".commandcode/settings.json",
];

/**
 * Resolução de caminho compartilhada pelos 3 hosts. O `|| pwd` importa: o
 * comprador extrai o zip e abre o agente ANTES de `git init`, e sem o fallback
 * todo hook morreria no `git rev-parse`.
 */
const SHARED_PREFIX = "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/tooling/agent-hooks/";

function collectCommands(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectCommands);
  }
  if (typeof value !== "object" || value === null) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const ownCommand = typeof record.command === "string" ? [record.command] : [];
  return ownCommand.concat(Object.values(record).flatMap(collectCommands));
}

describe("agent hook configs", () => {
  test.each(CONFIG_PATHS)("%s aponta para os scripts compartilhados", (configPath) => {
    const config = JSON.parse(readFileSync(join(ROOT, configPath), "utf8")) as unknown;
    const commands = collectCommands(config);

    expect(commands.length).toBeGreaterThan(0);
    for (const command of commands) {
      expect(command).toContain(SHARED_PREFIX);
      // Caminho relativo quebra quando o agente roda a partir de um subdiretório.
      expect(command).not.toContain("bun tooling/agent-hooks/");
    }
  });

  test.each(CONFIG_PATHS)("%s só referencia hooks que existem e rodam", (configPath) => {
    const config = JSON.parse(readFileSync(join(ROOT, configPath), "utf8")) as unknown;
    const scripts = new Set(
      collectCommands(config).flatMap((command) => {
        const match = command.match(/tooling\/agent-hooks\/(\S+?\.ts)/);
        return match?.[1] ? [match[1]] : [];
      }),
    );

    expect(scripts.size).toBeGreaterThan(0);
    for (const script of scripts) {
      const scriptPath = join(ROOT, "tooling/agent-hooks", script);
      expect(existsSync(scriptPath)).toBeTrue();

      // Entrada mínima é o pior caso do host: nenhum hook pode estourar por isso.
      // `stop_hook_active` faz o verify-before-stop sair cedo — rodar o gate
      // inteiro aqui seria testar o `verify`, não o wiring (ele tem teste próprio).
      const result = Bun.spawnSync(["bun", scriptPath], {
        cwd: join(ROOT, "src"),
        stdin: Buffer.from(JSON.stringify({ stop_hook_active: true })),
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          ...(configPath === ".cursor/hooks.json" ? { AGENT_HOOK_SURFACE: "cursor" } : {}),
        },
      });
      expect(result.exitCode).toBe(0);
    }
  });

  test("a skill pre-review é descobrível no diretório compartilhado de skills", () => {
    expect(existsSync(join(ROOT, ".agents/skills/pre-review/SKILL.md"))).toBeTrue();
  });

  test("toda superfície de enforcement dos agentes tem dono no CODEOWNERS", () => {
    const codeowners = readFileSync(join(ROOT, ".github/CODEOWNERS"), "utf8");

    for (const path of [
      "/.agents/**",
      "/.claude/**",
      "/.codex/**",
      "/.cursor/**",
      "/.commandcode/**",
      "/tooling/**",
    ]) {
      // Owner é placeholder trocável; o que o gate exige é que exista algum.
      expect(codeowners).toMatch(new RegExp(`^${path.replace(/[*/]/g, "\\$&")}\\s+@\\S+`, "m"));
    }
  });
});
