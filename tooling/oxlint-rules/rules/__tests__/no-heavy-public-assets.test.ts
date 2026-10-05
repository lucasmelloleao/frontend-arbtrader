// Guard de comportamento para tooling/no-heavy-public-assets.ts.
// NAO usa o RuleTester do oxlint (aquele linta AST de UM arquivo); este guard
// varre o filesystem de public/, entao o teste cria um blob em public/, roda o
// script e checa o exit code.
import { afterEach, expect, test } from "bun:test";

const PROBE = "public/_probe-heavy.bin";

afterEach(async () => {
  await Bun.$`rm -f ${PROBE}`.quiet();
});

test("no-heavy-public-assets: falha com asset acima do budget", async () => {
  await Bun.write(PROBE, new Uint8Array(300 * 1024)); // 300 KB > 200 KB
  const res = Bun.spawnSync(["bun", "tooling/no-heavy-public-assets.ts"]);
  expect(res.exitCode).toBe(1);
  expect(res.stderr.toString()).toContain(PROBE);
});

test("no-heavy-public-assets: passa com asset dentro do budget", async () => {
  await Bun.write(PROBE, new Uint8Array(50 * 1024)); // 50 KB < 200 KB
  const res = Bun.spawnSync(["bun", "tooling/no-heavy-public-assets.ts"]);
  expect(res.exitCode).toBe(0);
});
