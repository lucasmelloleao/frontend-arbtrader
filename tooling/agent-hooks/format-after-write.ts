/**
 * PostToolUse Edit|Write|apply_patch / afterFileEdit — formata com oxfmt.
 * Nunca bloqueia (exit 0).
 */

import { isWriteEvent, readEditedFilePath, readHookInput } from "./host.ts";

const FORMATTABLE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

const { raw } = await readHookInput();

if (raw.__invalid_json === true || !isWriteEvent(raw)) {
  process.exit(0);
}

const filePath = readEditedFilePath(raw);
if (!filePath || !FORMATTABLE.test(filePath)) {
  process.exit(0);
}

Bun.spawnSync(["bunx", "oxfmt", filePath], { stdout: "ignore", stderr: "ignore" });
process.exit(0);
