import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOOK_PATH = join(import.meta.dir, "verify-before-stop.ts");
const tempProjects: string[] = [];

afterEach(() => {
  for (const project of tempProjects) {
    rmSync(project, { recursive: true, force: true });
  }
  tempProjects.length = 0;
});

function createProject(exitCode: number) {
  const project = mkdtempSync(join(tmpdir(), "verify-before-stop-"));
  tempProjects.push(project);
  writeFileSync(
    join(project, "package.json"),
    JSON.stringify({ scripts: { "verify:fast": "bun verify-fast.ts" } }),
  );
  writeFileSync(
    join(project, "verify-fast.ts"),
    `await Bun.write("verify-ran", "yes");\nprocess.exit(${exitCode});\n`,
  );
  return project;
}

function runHook(project: string, input: Record<string, unknown>) {
  return Bun.spawnSync(["bun", HOOK_PATH], {
    cwd: project,
    stdin: Buffer.from(JSON.stringify(input)),
    stdout: "pipe",
    stderr: "pipe",
  });
}

describe("verify-before-stop", () => {
  test("skips verification while a Stop hook is already active", () => {
    const project = createProject(1);

    const result = runHook(project, { stop_hook_active: true });

    expect(result.exitCode).toBe(0);
    expect(existsSync(join(project, "verify-ran"))).toBeFalse();
  });

  test("allows Stop when fast verification succeeds", () => {
    const project = createProject(0);

    const result = runHook(project, { stop_hook_active: false });

    expect(result.exitCode).toBe(0);
    expect(existsSync(join(project, "verify-ran"))).toBeTrue();
  });

  test("blocks Stop with stderr feedback when fast verification fails", () => {
    const project = createProject(1);

    const result = runHook(project, { stop_hook_active: false });

    expect(result.exitCode).toBe(2);
    expect(result.stderr.toString()).toContain("bun run verify:fast failed");
  });

  test("reruns verification on a Cursor continuation", () => {
    const project = createProject(0);

    const result = runHook(project, { hook_event_name: "stop", loop_count: 1 });

    expect(result.exitCode).toBe(0);
    expect(existsSync(join(project, "verify-ran"))).toBeTrue();
  });
});
