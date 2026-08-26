/**
 * Boilerplate custom oxlint JS-plugin.
 *
 * Shape required by oxlint 1.77 jsPlugins:
 *   - Default export object with:
 *       meta.name : plugin name used as the prefix in rule IDs (e.g. "boilerplate")
 *       rules     : record mapping rule-name to Rule object
 *
 * Registration in .oxlintrc.json:
 *   "jsPlugins": ["./tooling/oxlint-rules/index.ts"]
 *   "rules":     { "boilerplate/enforce-boundaries": "error", ... }
 *
 * Each rule uses the CreateRule interface:
 *   { meta?: RuleMeta, create(context: Context): VisitorObject }
 *
 * context.report({ node, message }) or context.report({ node, messageId })
 * to emit a diagnostic.
 *
 * Nota: `no-lint-suppression` NÃO é uma regra deste plugin — uma regra de lint
 * pode ser desligada pela própria diretiva que ela proíbe. Ela vive em
 * `tooling/no-lint-suppression.ts` e roda como `git grep` dentro do `verify`.
 */

import enforceBoundaries from "./rules/enforce-boundaries.ts";
import noIndexBarrel from "./rules/no-index-barrel.ts";
import noUseCache from "./rules/no-use-cache.ts";
import noForceStatic from "./rules/no-force-static.ts";
import apiThroughLib from "./rules/api-through-lib.ts";
import noFetchInEffect from "./rules/no-fetch-in-effect.ts";
import noWatchInEffect from "./rules/no-watch-in-effect.ts";
import noDerivedStateInEffect from "./rules/no-derived-state-in-effect.ts";
import noManualMemo from "./rules/no-manual-memo.ts";
import noForbiddenImports from "./rules/no-forbidden-imports.ts";
import noFocusedTests from "./rules/no-focused-tests.ts";
import noAssert from "./rules/no-assert.ts";
import noDefensiveParse from "./rules/no-defensive-parse.ts";
import noPassthroughMapper from "./rules/no-passthrough-mapper.ts";
import noSchemaOutputConverter from "./rules/no-schema-output-converter.ts";
import noCatalogLiteralCompare from "./rules/no-catalog-literal-compare.ts";
import noLiteralDispatch from "./rules/no-literal-dispatch.ts";

const plugin = {
  meta: {
    name: "boilerplate",
  },
  rules: {
    "enforce-boundaries": enforceBoundaries,
    "no-index-barrel": noIndexBarrel,
    "no-use-cache": noUseCache,
    "no-force-static": noForceStatic,
    "api-through-lib": apiThroughLib,
    "no-fetch-in-effect": noFetchInEffect,
    "no-watch-in-effect": noWatchInEffect,
    "no-derived-state-in-effect": noDerivedStateInEffect,
    "no-manual-memo": noManualMemo,
    "no-forbidden-imports": noForbiddenImports,
    "no-focused-tests": noFocusedTests,
    "no-assert": noAssert,
    "no-defensive-parse": noDefensiveParse,
    "no-passthrough-mapper": noPassthroughMapper,
    "no-schema-output-converter": noSchemaOutputConverter,
    "no-catalog-literal-compare": noCatalogLiteralCompare,
    "no-literal-dispatch": noLiteralDispatch,
  },
};

export default plugin;
