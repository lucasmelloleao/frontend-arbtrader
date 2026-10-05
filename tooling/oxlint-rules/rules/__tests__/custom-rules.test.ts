/**
 * Integration tests for boilerplate custom oxlint rules: Bun-native, NO Node.
 *
 * Runs under `bun test` by spawning `bunx oxlint -f json` on temporary fixture
 * files. The project's .oxlintrc.json is passed explicitly so the custom plugin
 * is always loaded regardless of cwd.
 *
 * Each rule is validated with violating fixtures (expect the rule id in the
 * diagnostics) and valid fixtures (expect the rule id absent), including the
 * nuance/edge cases that distinguish a correct rule from a false-positive one.
 *
 * We deliberately do NOT use oxlint's RuleTester: it rejects Bun at runtime and
 * forces Node. This integration approach tests the real oxlint behavior under
 * Bun instead.
 */

import { describe, test, expect, afterEach } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSync, unlinkSync, mkdirSync } from "node:fs";

const PROJECT_ROOT = process.cwd();
const OXLINTRC = join(PROJECT_ROOT, ".oxlintrc.json");

const tempFiles: string[] = [];

afterEach(() => {
  for (const f of tempFiles) {
    try {
      unlinkSync(f);
    } catch {
      /* already gone */
    }
  }
  tempFiles.length = 0;
});

function writeTempFixture(subdir: string, name: string, code: string): string {
  const dir = join(tmpdir(), "boilerplate-oxlint-it", subdir);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, name);
  writeFileSync(filePath, code, "utf8");
  tempFiles.push(filePath);
  return filePath;
}

interface OxlintDiag {
  code?: string | { id?: string; [k: string]: unknown };
  message?: string;
  [k: string]: unknown;
}

function runOxlint(fixturePath: string): OxlintDiag[] {
  const result = Bun.spawnSync(
    ["bunx", "oxlint@1.77.0", "-f", "json", "-c", OXLINTRC, fixturePath],
    { cwd: PROJECT_ROOT, env: { ...process.env }, stdout: "pipe", stderr: "pipe" },
  );
  const raw = result.stdout.toString().trim();
  // Sem saída = oxlint crashou (ex.: plugin não carregou). Falhar ALTO: senão os
  // testes "allows" passariam em falso (hasRule retornaria false num crash).
  if (!raw) {
    throw new Error(
      `oxlint não produziu saída JSON (crash?). stderr:\n${result.stderr.toString()}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `oxlint produziu saída não-JSON:\n${raw}\nstderr:\n${result.stderr.toString()}`,
    );
  }
  if (parsed && typeof parsed === "object" && "diagnostics" in parsed) {
    return (parsed as { diagnostics: OxlintDiag[] }).diagnostics;
  }
  if (Array.isArray(parsed)) return parsed as OxlintDiag[];
  // JSON válido mas em formato inesperado (schema do oxlint mudou?) → falhar alto,
  // senão os testes "allows" passariam em falso.
  throw new Error(`oxlint: formato de saída inesperado: ${raw.slice(0, 200)}`);
}

/** oxlint formats JS-plugin rule codes as "boilerplate(<rule-id>)". */
function hasRule(diags: OxlintDiag[], ruleId: string): boolean {
  const needle = `boilerplate(${ruleId})`;
  return diags.some((d) => typeof d.code === "string" && (d.code === needle || d.code === ruleId));
}

function fires(subdir: string, name: string, code: string, ruleId: string): boolean {
  return hasRule(runOxlint(writeTempFixture(subdir, name, code)), ruleId);
}

// ---------------------------------------------------------------------------
// enforce-boundaries
// ---------------------------------------------------------------------------
describe("boilerplate/enforce-boundaries", () => {
  test("fires: shared imports from app (reversed direction)", () => {
    expect(
      fires(
        "src/shared",
        "a.ts",
        `import { x } from "@/app/home";\nexport const y = 1;\n`,
        "enforce-boundaries",
      ),
    ).toBe(true);
  });
  test("fires: cross-feature import", () => {
    expect(
      fires(
        "src/features/cart",
        "b.ts",
        `import { x } from "@/features/checkout/api";\nexport const y = 1;\n`,
        "enforce-boundaries",
      ),
    ).toBe(true);
  });
  test("allows: correct direction (app -> features)", () => {
    expect(
      fires(
        "src/app",
        "c.ts",
        `import { useCart } from "@/features/cart/hooks";\nexport const y = 1;\n`,
        "enforce-boundaries",
      ),
    ).toBe(false);
  });
  test("allows: same-feature internal import", () => {
    expect(
      fires(
        "src/features/cart",
        "d.ts",
        `import { x } from "@/features/cart/util";\nexport const y = 1;\n`,
        "enforce-boundaries",
      ),
    ).toBe(false);
  });
  test("allows: external package import in shared", () => {
    expect(
      fires(
        "src/shared",
        "e.ts",
        `import clsx from "clsx";\nexport const y = 1;\n`,
        "enforce-boundaries",
      ),
    ).toBe(false);
  });
  test("fires: import de @/app sem barra final (bypass corrigido)", () => {
    expect(
      fires(
        "src/lib",
        "f.ts",
        `import { a } from "@/app";\nexport const y = a;\n`,
        "enforce-boundaries",
      ),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// no-index-barrel
// ---------------------------------------------------------------------------
describe("boilerplate/no-index-barrel", () => {
  test("fires: named re-export in index.ts", () => {
    expect(
      fires("barrel-named", "index.ts", `export { foo } from "./foo";\n`, "no-index-barrel"),
    ).toBe(true);
  });
  test("fires: export * in index.ts", () => {
    expect(fires("barrel-star", "index.ts", `export * from "./foo";\n`, "no-index-barrel")).toBe(
      true,
    );
  });
  test("allows: local export in index.ts", () => {
    expect(
      fires("barrel-local", "index.ts", `export const answer = 42;\n`, "no-index-barrel"),
    ).toBe(false);
  });
  test("allows: re-export in a non-index file", () => {
    expect(
      fires("barrel-nonindex", "foo.ts", `export { foo } from "./foo";\n`, "no-index-barrel"),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// no-use-cache
// ---------------------------------------------------------------------------
describe("boilerplate/no-use-cache", () => {
  test("fires: 'use cache' directive", () => {
    expect(fires("cache-dir", "a.ts", `"use cache";\nexport const x = 1;\n`, "no-use-cache")).toBe(
      true,
    );
  });
  test("fires: 'use cache: remote' variant", () => {
    expect(
      fires("cache-remote", "a.ts", `"use cache: remote";\nexport const x = 1;\n`, "no-use-cache"),
    ).toBe(true);
  });
  test("fires: import unstable_cache from next/cache", () => {
    expect(
      fires(
        "cache-unstable",
        "b.ts",
        `import { unstable_cache } from "next/cache";\nexport const x = unstable_cache;\n`,
        "no-use-cache",
      ),
    ).toBe(true);
  });
  test("fires: cache: 'force-cache' option", () => {
    expect(
      fires(
        "cache-force",
        "c.ts",
        `export const x = fetch("https://x.dev", { cache: "force-cache" });\n`,
        "no-use-cache",
      ),
    ).toBe(true);
  });
  test("allows: React.cache (request dedup, not staleness)", () => {
    expect(
      fires(
        "cache-react",
        "d.ts",
        `import { cache } from "react";\nexport const get = cache(() => 1);\n`,
        "no-use-cache",
      ),
    ).toBe(false);
  });
  test("fires: fetch next.revalidate > 0", () => {
    expect(
      fires(
        "cache-reval",
        "e.ts",
        `export const x = fetch("https://x.dev", { next: { revalidate: 60 } });\n`,
        "no-use-cache",
      ),
    ).toBe(true);
  });
  test("fires: fetch next.revalidate = false", () => {
    expect(
      fires(
        "cache-reval-false",
        "e.ts",
        `export const x = fetch("https://x.dev", { next: { revalidate: false } });\n`,
        "no-use-cache",
      ),
    ).toBe(true);
  });
  test("allows: fetch next.revalidate = 0", () => {
    expect(
      fires(
        "cache-reval-zero",
        "e.ts",
        `export const x = fetch("https://x.dev", { next: { revalidate: 0 } });\n`,
        "no-use-cache",
      ),
    ).toBe(false);
  });
  test("allows: revalidate in unrelated domain object", () => {
    expect(
      fires(
        "cache-reval-domain",
        "e.ts",
        `export const cfg = { next: { revalidate: 60 } };\n`,
        "no-use-cache",
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// no-force-static
// ---------------------------------------------------------------------------
describe("boilerplate/no-force-static", () => {
  test("fires: dynamic = 'force-static' (route segment)", () => {
    expect(
      fires(
        "src/app/fs1",
        "route.ts",
        `export const dynamic = "force-static";\n`,
        "no-force-static",
      ),
    ).toBe(true);
  });
  test("fires: revalidate > 0 (route segment)", () => {
    expect(
      fires("src/app/fs2", "route.ts", `export const revalidate = 60;\n`, "no-force-static"),
    ).toBe(true);
  });
  test("allows: dynamic = 'force-dynamic'", () => {
    expect(
      fires(
        "src/app/fs3",
        "route.ts",
        `export const dynamic = "force-dynamic";\n`,
        "no-force-static",
      ),
    ).toBe(false);
  });
  test("allows: revalidate = 0", () => {
    expect(
      fires("src/app/fs4", "route.ts", `export const revalidate = 0;\n`, "no-force-static"),
    ).toBe(false);
  });
  test("fires: revalidate = false (never-revalidate = estático)", () => {
    expect(
      fires("src/app/fs5", "route.ts", `export const revalidate = false;\n`, "no-force-static"),
    ).toBe(true);
  });
  // Nota: writeTempFixture usa path absoluto (tmpdir), então estes testes cobrem
  // só o caminho absoluto. A guarda `(^|/)src/app/` também trata path relativo
  // (que o oxlint reporta em runs normais), mas isso não é exercitado aqui.
  test("allows: force-static FORA de src/app (não é route segment)", () => {
    expect(
      fires(
        "src/features/x",
        "config.ts",
        `export const dynamic = "force-static";\n`,
        "no-force-static",
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// api-through-lib
// ---------------------------------------------------------------------------
describe("boilerplate/api-through-lib", () => {
  test("fires: raw fetch() to backend domain", () => {
    expect(
      fires(
        "api-domain",
        "c.ts",
        `fetch("https://api.example.com/v1/users");\n`,
        "api-through-lib",
      ),
    ).toBe(true);
  });
  test("fires: fetch() referencing INTERNAL_API_URL", () => {
    expect(
      fires(
        "api-env",
        "c.ts",
        `fetch(\`\${process.env.INTERNAL_API_URL}/users\`);\n`,
        "api-through-lib",
      ),
    ).toBe(true);
  });
  test("allows: fetch() to third-party", () => {
    expect(
      fires("api-3p", "c.ts", `fetch("https://api.stripe.com/v1/charges");\n`, "api-through-lib"),
    ).toBe(false);
  });
  test("fires: template literal com domínio backend (gap corrigido)", () => {
    expect(
      fires(
        "api-tpl",
        "c.ts",
        `const id = "1"; fetch(\`https://api.example.com/v1/users/\${id}\`);\n`,
        "api-through-lib",
      ),
    ).toBe(true);
  });
  test("allows: raw fetch() inside src/lib/api (the gateway itself)", () => {
    expect(
      fires(
        "src/lib/api",
        "ky.ts",
        `fetch("https://api.example.com/v1/users");\n`,
        "api-through-lib",
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// no-fetch-in-effect
// ---------------------------------------------------------------------------
describe("boilerplate/no-fetch-in-effect", () => {
  test("fires: fetch() inside useEffect", () => {
    expect(
      fires(
        "eff",
        "a.ts",
        `import { useEffect } from "react";\nexport function C(){ useEffect(() => { fetch("https://x.dev"); }, []); }\n`,
        "no-fetch-in-effect",
      ),
    ).toBe(true);
  });
  test("allows: non-fetch effect", () => {
    expect(
      fires(
        "eff",
        "b.ts",
        `import { useEffect } from "react";\nexport function C(){ useEffect(() => { document.title = "x"; }, []); }\n`,
        "no-fetch-in-effect",
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// no-watch-in-effect
// ---------------------------------------------------------------------------
describe("boilerplate/no-watch-in-effect", () => {
  test("fires: watch() inside useEffect", () => {
    expect(
      fires(
        "eff",
        "c.ts",
        `import { useEffect } from "react";\nexport function C(){ useEffect(() => { watch("name"); }, []); }\n`,
        "no-watch-in-effect",
      ),
    ).toBe(true);
  });
  test("fires: form.watch() (MemberExpression) inside useEffect", () => {
    expect(
      fires(
        "eff",
        "c2.ts",
        `import { useEffect } from "react";\nexport function C(){ useEffect(() => { const v = form.watch("email"); }, [form]); }\n`,
        "no-watch-in-effect",
      ),
    ).toBe(true);
  });
  test("allows: useWatch (no watch in effect)", () => {
    expect(
      fires(
        "eff",
        "d.ts",
        `const name = useWatch({ name: "x" });\nexport const z = name;\n`,
        "no-watch-in-effect",
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// no-derived-state-in-effect
// ---------------------------------------------------------------------------
describe("boilerplate/no-derived-state-in-effect", () => {
  test("fires: single setState derived from deps", () => {
    expect(
      fires(
        "eff",
        "e.ts",
        `import { useEffect } from "react";\nexport function C(){ useEffect(() => { setFullName(first + last); }, [first, last]); }\n`,
        "no-derived-state-in-effect",
      ),
    ).toBe(true);
  });
  test("fires: arrow concisa () => setX(...) (gap corrigido)", () => {
    expect(
      fires(
        "eff",
        "g.ts",
        `import { useEffect } from "react";\nexport function C(){ useEffect(() => setCount(n + 1), [n]); }\n`,
        "no-derived-state-in-effect",
      ),
    ).toBe(true);
  });
  test("allows: subscription effect (not a bare setState)", () => {
    expect(
      fires(
        "eff",
        "f.ts",
        `import { useEffect } from "react";\nexport function C(){ useEffect(() => { const s = store.subscribe(); return () => s(); }, [store]); }\n`,
        "no-derived-state-in-effect",
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// no-manual-memo
// React Compiler ligado -> useMemo/useCallback/React.memo manual é redundante.
// ---------------------------------------------------------------------------
describe("boilerplate/no-manual-memo", () => {
  test("fires: useMemo()", () => {
    expect(
      fires(
        "memo",
        "a.ts",
        `import { useMemo } from "react";\nexport function C(){ const x = useMemo(() => 1, []); return x; }\n`,
        "no-manual-memo",
      ),
    ).toBe(true);
  });
  test("fires: useCallback()", () => {
    expect(
      fires(
        "memo",
        "b.ts",
        `import { useCallback } from "react";\nexport function C(){ const x = useCallback(() => 1, []); return x; }\n`,
        "no-manual-memo",
      ),
    ).toBe(true);
  });
  test("fires: bare memo()", () => {
    expect(
      fires(
        "memo",
        "c.ts",
        `import { memo } from "react";\nexport const C = memo(() => null);\n`,
        "no-manual-memo",
      ),
    ).toBe(true);
  });
  test("fires: React.memo() (MemberExpression)", () => {
    expect(
      fires(
        "memo",
        "d.ts",
        `import React from "react";\nexport const C = React.memo(() => null);\n`,
        "no-manual-memo",
      ),
    ).toBe(true);
  });
  test("allows: useState (not a memo API)", () => {
    expect(
      fires(
        "memo",
        "e.ts",
        `import { useState } from "react";\nexport function C(){ const [s] = useState(0); return s; }\n`,
        "no-manual-memo",
      ),
    ).toBe(false);
  });
  test("allows: React.cache (request dedup, not memo)", () => {
    expect(
      fires(
        "memo",
        "f.ts",
        `import { cache } from "react";\nexport const get = cache(() => 1);\n`,
        "no-manual-memo",
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// no-forbidden-imports
// Fecha o gap de subpath do no-restricted-imports (match exato só pega o
// specifier exato; `swr/mutation`, `zod/v4-mini`, etc. escapam).
// ---------------------------------------------------------------------------
describe("boilerplate/no-forbidden-imports", () => {
  test("fires: SWR subpath import", () => {
    expect(
      fires(
        "imports",
        "a.ts",
        `import useSWRMutation from "swr/mutation";\nexport const y = useSWRMutation;\n`,
        "no-forbidden-imports",
      ),
    ).toBe(true);
  });
  test("fires: React Query package import", () => {
    expect(
      fires(
        "imports",
        "b.ts",
        `import { QueryClient } from "@tanstack/react-query";\nexport const y = QueryClient;\n`,
        "no-forbidden-imports",
      ),
    ).toBe(true);
  });
  test("fires: react-query (legacy) import", () => {
    expect(
      fires(
        "imports",
        "c.ts",
        `import { useQuery } from "react-query";\nexport const y = useQuery;\n`,
        "no-forbidden-imports",
      ),
    ).toBe(true);
  });
  test("fires: axios import", () => {
    expect(
      fires(
        "imports",
        "d.ts",
        `import axios from "axios";\nexport const y = axios;\n`,
        "no-forbidden-imports",
      ),
    ).toBe(true);
  });
  test("fires: zod subpath import (usamos valibot)", () => {
    expect(
      fires(
        "imports",
        "e.ts",
        `import { z } from "zod/v4-mini";\nexport const y = z;\n`,
        "no-forbidden-imports",
      ),
    ).toBe(true);
  });
  test("fires: valibot outside schema file", () => {
    expect(
      fires(
        "src/features/auth",
        "form.ts",
        `import { object } from "valibot";\nexport const y = object;\n`,
        "no-forbidden-imports",
      ),
    ).toBe(true);
  });
  test("allows: valibot inside schema file", () => {
    expect(
      fires(
        "src/features/auth",
        "login.schema.ts",
        `import { object } from "valibot";\nexport const y = object;\n`,
        "no-forbidden-imports",
      ),
    ).toBe(false);
  });
  test("fires: ky outside API gateway", () => {
    expect(
      fires(
        "src/features/auth",
        "api.ts",
        `import ky from "ky";\nexport const y = ky;\n`,
        "no-forbidden-imports",
      ),
    ).toBe(true);
  });
  test("allows: ky inside API gateway", () => {
    expect(
      fires(
        "src/lib/api",
        "ky.server.ts",
        `import ky from "ky";\nexport const y = ky;\n`,
        "no-forbidden-imports",
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// no-lint-suppression NAO e regra deste plugin: uma regra de lint pode ser
// desligada pela propria diretiva que ela proibe. O gate vive em
// tooling/no-lint-suppression.ts (git grep, dentro do verify) e tem teste la.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// no-focused-tests
// Import-agnóstico: o plugin jest do oxlint deixa test.only/describe.only de
// "bun:test" passarem, então os fixtures abaixo blindam exatamente esse caso.
// ---------------------------------------------------------------------------
describe("boilerplate/no-focused-tests", () => {
  test("fires: test.only de bun:test", () => {
    expect(
      fires(
        "focus",
        "a.test.ts",
        `import { test, expect } from "bun:test";\ntest.only("x", () => {\n  expect(1).toBe(1);\n});\n`,
        "no-focused-tests",
      ),
    ).toBe(true);
  });
  test("fires: describe.only de bun:test", () => {
    expect(
      fires(
        "focus",
        "b.test.ts",
        `import { describe } from "bun:test";\ndescribe.only("x", () => {});\n`,
        "no-focused-tests",
      ),
    ).toBe(true);
  });
  test("fires: it.only de bun:test", () => {
    expect(
      fires(
        "focus",
        "c.test.ts",
        `import { it } from "bun:test";\nit.only("x", () => {});\n`,
        "no-focused-tests",
      ),
    ).toBe(true);
  });
  test("allows: test/describe normais", () => {
    expect(
      fires(
        "focus",
        "d.test.ts",
        `import { describe, test, expect } from "bun:test";\ndescribe("g", () => {\n  test("x", () => {\n    expect(1).toBe(1);\n  });\n});\n`,
        "no-focused-tests",
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// typescript/consistent-type-assertions (built-in, assertionStyle: never)
// Protege a escolha de config: proíbe `x as T`, libera `as const`.
// ---------------------------------------------------------------------------
function hasCode(diags: OxlintDiag[], substr: string): boolean {
  return diags.some((d) => typeof d.code === "string" && d.code.includes(substr));
}

describe("typescript/consistent-type-assertions", () => {
  test("fires: type assertion `x as T`", () => {
    const diags = runOxlint(
      writeTempFixture("cta", "a.ts", `const x: unknown = 1;\nexport const y = x as string;\n`),
    );
    expect(hasCode(diags, "consistent-type-assertions")).toBe(true);
  });
  test("allows: `as const`", () => {
    const diags = runOxlint(writeTempFixture("cta", "b.ts", `export const y = [1, 2] as const;\n`));
    expect(hasCode(diags, "consistent-type-assertions")).toBe(false);
  });
});
