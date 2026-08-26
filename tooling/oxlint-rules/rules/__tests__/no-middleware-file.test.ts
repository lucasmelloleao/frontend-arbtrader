/**
 * Guardrail: Next 16 renomeou `middleware.ts` → `proxy.ts`.
 *
 * Um agente, por hábito de treino, tende a criar `middleware.ts`. Este gate
 * falha se esse arquivo existir, apontando para `proxy.ts` (convenção atual do
 * Next 16). oxlint não checa "arquivo que não deveria existir", por isso é um
 * bun:test.
 */

import { describe, test, expect } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("guardrail: Next 16 usa proxy.ts (não middleware.ts)", () => {
  test("não existe arquivo middleware.* (use proxy.ts)", () => {
    const candidates = [
      "src/middleware.ts",
      "src/middleware.tsx",
      "src/middleware.js",
      "src/middleware.jsx",
      "middleware.ts",
      "middleware.tsx",
      "middleware.js",
      "middleware.jsx",
    ];
    const found = candidates.filter((p) => existsSync(join(ROOT, p)));
    expect(found).toEqual([]);
  });
});
