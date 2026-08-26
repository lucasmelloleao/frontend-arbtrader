/**
 * Stop / stop — roda `bun run verify:fast` antes de encerrar o turno.
 */

import { emitStopContinue, emitStopOk, isStopHookActive, readHookInput } from "./host.ts";

const { host, raw } = await readHookInput();

if (isStopHookActive(raw) || raw.status === "aborted") {
  emitStopOk();
}

const verification = Bun.spawnSync(["bun", "run", "verify:fast"], {
  cwd: process.cwd(),
  stdout: "inherit",
  stderr: "inherit",
});

if (verification.exitCode !== 0) {
  emitStopContinue(
    host,
    "Stop bloqueado: `bun run verify:fast` falhou. Corrija os erros do gate e só então encerre o turno.",
  );
}

emitStopOk();
