import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GUARD_PATH = join(import.meta.dir, "no-lint-suppression.ts");
const ESLINT_DIRECTIVE = ["eslint", "disable"].join("-");
const OXLINT_DIRECTIVE = ["oxlint", "disable"].join("-");
const tempRepos: string[] = [];

afterEach(() => {
  for (const repo of tempRepos) {
    rmSync(repo, { recursive: true, force: true });
  }
  tempRepos.length = 0;
});

function runGuard(filename: string, source: string, corruptIndex = false) {
  const repo = mkdtempSync(join(tmpdir(), "no-lint-suppression-"));
  tempRepos.push(repo);
  writeFileSync(join(repo, filename), source, "utf8");

  const init = Bun.spawnSync(["git", "init", "--quiet"], { cwd: repo });
  expect(init.exitCode).toBe(0);
  const add = Bun.spawnSync(["git", "add", filename], { cwd: repo });
  expect(add.exitCode).toBe(0);
  if (corruptIndex) {
    writeFileSync(join(repo, ".git", "index"), "corrupt", "utf8");
  }

  return Bun.spawnSync(["bun", GUARD_PATH], {
    cwd: repo,
    stdout: "pipe",
    stderr: "pipe",
  });
}

describe("no-lint-suppression", () => {
  test("rejects the ESLint directive family", () => {
    const result = runGuard(
      "fixture.ts",
      `// ${ESLINT_DIRECTIVE}-next-line no-console\nconsole.log("x");\n`,
    );

    expect(result.exitCode).toBe(1);
  });

  test("rejects the oxlint directive family", () => {
    const result = runGuard(
      "fixture.ts",
      `// ${OXLINT_DIRECTIVE}-next-line no-console\nconsole.log("x");\n`,
    );

    expect(result.exitCode).toBe(1);
  });

  test("rejects suppressions in an mjs module", () => {
    const result = runGuard(
      "fixture.mjs",
      `// ${OXLINT_DIRECTIVE}-next-line no-console\nconsole.log("x");\n`,
    );

    expect(result.exitCode).toBe(1);
  });

  test("fails closed when git grep has an operational error", () => {
    const result = runGuard("fixture.ts", `export const answer = 42;\n`, true);

    expect(result.exitCode).toBe(1);
    expect(result.stderr.toString()).toContain("a busca por supressões falhou");
  });

  test("allows ordinary tracked source", () => {
    const result = runGuard("fixture.ts", `export const answer = 42;\n`);

    expect(result.exitCode).toBe(0);
  });
});
