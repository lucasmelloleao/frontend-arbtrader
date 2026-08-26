/**
 * Guardrail: o projeto é Bun ponta a ponta: `node` é PROIBIDO.
 *
 * Por que isto é um teste (e não uma regra oxlint): oxlint não lê os scripts do
 * package.json. Este bun:test é o portão que impede um agente de reintroduzir o
 * runtime Node (ex.: `node --experimental-strip-types`, harness RuleTester) que
 * caiu aqui na primeira tentativa.
 *
 * Nota: importar `node:fs`/`node:os` NÃO é "usar Node": é a implementação Bun
 * desses módulos (e o `node:` é exigido por unicorn/prefer-node-protocol).
 */

import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

/** Casa o executável `node` como comando (início, ou após && | ; ou espaço). */
const NODE_CMD = /(^|[\s&|;])node(\s|$)/;

describe("guardrail: sem runtime Node", () => {
  test("nenhum script de QUALQUER package.json invoca node", () => {
    // Varre todos os package.json do repo (não só a raiz): exclui node_modules.
    const pkgFiles = [...new Bun.Glob("**/package.json").scanSync({ cwd: ROOT })].filter(
      (p) => !p.includes("node_modules"),
    );
    const offenders: string[] = [];
    for (const file of pkgFiles) {
      const pkg = JSON.parse(readFileSync(join(ROOT, file), "utf8")) as {
        scripts?: Record<string, string>;
      };
      for (const [name, cmd] of Object.entries(pkg.scripts ?? {})) {
        if (NODE_CMD.test(cmd) || cmd.includes("--experimental-strip-types")) {
          offenders.push(`${file} → ${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  test("nenhum artefato de runner Node no tooling (.nodetest / .mjs / .cjs)", () => {
    const dir = join(ROOT, "tooling/oxlint-rules/rules/__tests__");
    const offenders = readdirSync(dir).filter(
      (f) => f.includes(".nodetest.") || f.endsWith(".mjs") || f.endsWith(".cjs"),
    );
    expect(offenders).toEqual([]);
  });
});
