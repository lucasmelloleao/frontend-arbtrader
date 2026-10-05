// tooling/oxlint-rules/rules/_context-utils.ts
function getFilename(context) {
  const fn = context.getFilename?.() ?? context.filename;
  if (typeof fn !== "string" || fn.length === 0) {
    throw new Error("[boilerplate oxlint] não foi possível determinar o filename: a API do plugin oxlint mudou? (pinned 1.77.0)");
  }
  return fn;
}

// tooling/oxlint-rules/rules/enforce-boundaries.ts
var LAYER_RANK = {
  app: 4,
  features: 3,
  lib: 2,
  shared: 1
};
var FILE_LAYER_RE = /[/\\]src[/\\](app|features|lib|shared)[/\\]/;
var IMPORT_LAYER_RE = /^@\/(app|features|lib|shared)(\/|$)/;
function layerOf(filename) {
  const m = FILE_LAYER_RE.exec(filename);
  return m ? m[1] : undefined;
}
function importLayer(spec) {
  const m = IMPORT_LAYER_RE.exec(spec);
  return m ? m[1] : undefined;
}
var FEATURE_FROM_FILE_RE = /[/\\]src[/\\]features[/\\]([^/\\]+)/;
function featureOf(filename) {
  const m = FEATURE_FROM_FILE_RE.exec(filename);
  return m ? m[1] : undefined;
}
var FEATURE_FROM_SPEC_RE = /^@\/features\/([^/]+)/;
function featureOfSpec(spec) {
  const m = FEATURE_FROM_SPEC_RE.exec(spec);
  return m ? m[1] : undefined;
}
var enforceBoundaries = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce unidirectional layer imports (app→features→lib→shared) and disallow cross-feature imports."
    },
    messages: {
      reversedDirection: "Import direction violation: '{{from}}' cannot import from '{{to}}'. Layers must flow app → features → lib → shared.",
      crossFeature: "Cross-feature import: a feature must not import from a sibling feature. Move shared code to shared/ instead."
    }
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source;
        const spec = typeof source?.value === "string" ? source.value : "";
        const toLayer = importLayer(spec);
        if (!toLayer)
          return;
        const filename = getFilename(context);
        const fromLayer = layerOf(filename);
        if (!fromLayer)
          return;
        const fromRank = LAYER_RANK[fromLayer];
        const toRank = LAYER_RANK[toLayer];
        if (toRank > fromRank) {
          context.report({
            node,
            messageId: "reversedDirection",
            data: { from: fromLayer, to: toLayer }
          });
          return;
        }
        if (fromLayer === "features" && toLayer === "features") {
          const fromFeature = featureOf(filename);
          const toFeature = featureOfSpec(spec);
          if (fromFeature !== undefined && toFeature !== undefined && fromFeature !== toFeature) {
            context.report({
              node,
              messageId: "crossFeature"
            });
          }
        }
      }
    };
  }
};
var enforce_boundaries_default = enforceBoundaries;

// tooling/oxlint-rules/rules/no-index-barrel.ts
import { basename } from "node:path";
var INDEX_BASENAMES = new Set(["index.ts", "index.tsx", "index.js", "index.jsx"]);
var MESSAGE = "index.* nao pode ser barrel de re-export; importe direto do modulo (cobre o gap do oxc/no-barrel-file que so pega export *)";
var noIndexBarrel = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow barrel re-exports in index.* files (named re-exports and export-all)"
    },
    messages: {
      noBarrel: MESSAGE
    }
  },
  create(context) {
    const filename = getFilename(context);
    const base = basename(filename);
    if (!INDEX_BASENAMES.has(base)) {
      return {};
    }
    return {
      ExportNamedDeclaration(node) {
        if (node.source != null) {
          context.report({ node, messageId: "noBarrel" });
        }
      },
      ExportAllDeclaration(node) {
        context.report({ node, messageId: "noBarrel" });
      }
    };
  }
};
var no_index_barrel_default = noIndexBarrel;

// tooling/oxlint-rules/rules/no-use-cache.ts
var noUseCache = {
  meta: {
    type: "problem",
    docs: {
      description: 'Disallow "use cache" directive, unstable_cache import, force-cache property, and stale fetch revalidate'
    },
    messages: {
      useCache: 'The "use cache" directive is not allowed. Remove it to prevent unintended caching.',
      unstableCache: 'Importing "unstable_cache" from "next/cache" is not allowed.',
      forceCache: 'Setting cache to "force-cache" is not allowed. Use a different caching strategy.',
      staleRevalidate: "`fetch(..., { next: { revalidate } })` com valor diferente de 0 cria cache/staleness. Use 0 ou remova."
    }
  },
  create(context) {
    return {
      ExpressionStatement(node) {
        const directive = node.directive;
        if (typeof directive === "string" && directive.startsWith("use cache")) {
          context.report({ node, messageId: "useCache" });
        }
      },
      ImportDeclaration(node) {
        if (node.source.value !== "next/cache")
          return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier")
            continue;
          const imported = specifier.imported;
          const importedName = imported.type === "Identifier" ? imported.name : imported.type === "Literal" ? imported.value : null;
          if (importedName === "unstable_cache") {
            context.report({ node: specifier, messageId: "unstableCache" });
          }
        }
      },
      Property(node) {
        if (node.type !== "Property")
          return;
        const objProp = node;
        if (objProp.computed)
          return;
        const key = objProp.key;
        let keyName = null;
        if (key.type === "Identifier") {
          keyName = key.name ?? null;
        } else if (key.type === "Literal") {
          keyName = typeof key.value === "string" ? key.value : null;
        }
        if (keyName !== "cache" && keyName !== "revalidate")
          return;
        const val = objProp.value;
        if (keyName === "cache" && val.type === "Literal" && val.value === "force-cache") {
          context.report({ node, messageId: "forceCache" });
        }
        if (keyName === "revalidate" && val.type === "Literal" && (val.value === false || typeof val.value === "number" && val.value > 0) && isInlineFetchNextRevalidateProperty(node)) {
          context.report({ node, messageId: "staleRevalidate" });
        }
      }
    };
  }
};
var no_use_cache_default = noUseCache;
function isStaticPropertyNamed(node, name) {
  if (!node || node.type !== "Property" || node.computed)
    return false;
  const key = node.key;
  return key.type === "Identifier" && key.name === name || key.type === "Literal" && key.value === name;
}
function isInlineFetchNextRevalidateProperty(node) {
  const nextOptions = node.parent;
  if (!nextOptions || nextOptions.type !== "ObjectExpression")
    return false;
  const nextProperty = nextOptions.parent;
  if (!isStaticPropertyNamed(nextProperty, "next") || nextProperty.value !== nextOptions) {
    return false;
  }
  const fetchOptions = nextProperty.parent;
  if (!fetchOptions || fetchOptions.type !== "ObjectExpression")
    return false;
  const call = fetchOptions.parent;
  if (!call || call.type !== "CallExpression")
    return false;
  return call.callee?.type === "Identifier" && call.callee.name === "fetch" && call.arguments?.[1] === fetchOptions;
}

// tooling/oxlint-rules/rules/no-force-static.ts
var noForceStatic = {
  meta: {
    type: "problem",
    docs: {
      description: 'Disallow `dynamic = "force-static"` and positive `revalidate` values in route segments'
    },
    messages: {
      forceStatic: 'Setting `dynamic` to "force-static" forces static rendering. Use "force-dynamic" or remove the export.',
      staleRevalidate: "`revalidate` diferente de 0 força cache/staleness (número > 0 = ISR; false = never-revalidate/estático permanente). Use 0 (sempre fresco)."
    }
  },
  create(context) {
    if (!/(^|\/)src\/app\//.test(getFilename(context).replace(/\\/g, "/"))) {
      return {};
    }
    return {
      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (!decl || decl.type !== "VariableDeclaration")
          return;
        for (const declarator of decl.declarations) {
          if (declarator.id.type !== "Identifier")
            continue;
          const name = declarator.id.name;
          const init = declarator.init;
          if (!init)
            continue;
          if (name === "dynamic" && init.type === "Literal" && init.value === "force-static") {
            context.report({ node: declarator, messageId: "forceStatic" });
          }
          if (name === "revalidate" && init.type === "Literal" && (init.value === false || typeof init.value === "number" && init.value > 0)) {
            context.report({ node: declarator, messageId: "staleRevalidate" });
          }
        }
      }
    };
  }
};
var no_force_static_default = noForceStatic;

// tooling/oxlint-rules/rules/api-through-lib.ts
var BACKEND_DOMAINS = ["example.com"];
var API_ENV_VARS = ["NEXT_PUBLIC_API_URL", "INTERNAL_API_URL"];
var MESSAGE2 = "nao chame o backend com fetch cru; use apiClient/ky de lib/api";
var apiThroughLib = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow raw fetch() calls to Boilerplate backend URLs; use apiClient/ky from lib/api."
    },
    messages: {
      useApiClient: MESSAGE2
    }
  },
  create(context) {
    const filename = getFilename(context).replace(/\\/g, "/");
    if (filename.includes("src/lib/api/")) {
      return {};
    }
    const needles = [...BACKEND_DOMAINS, ...API_ENV_VARS];
    return {
      CallExpression(node) {
        const { callee, arguments: args } = node;
        if (callee.type !== "Identifier" || callee.name !== "fetch") {
          return;
        }
        if (args.length === 0)
          return;
        const src = context.getSourceCode().getText(args[0]);
        if (needles.some((n) => src.includes(n))) {
          context.report({ node, messageId: "useApiClient" });
        }
      }
    };
  }
};
var api_through_lib_default = apiThroughLib;

// tooling/oxlint-rules/rules/_effect-utils.ts
var EFFECT_HOOKS = new Set(["useEffect", "useLayoutEffect"]);
function isEffectCallee(callee) {
  if (!callee)
    return false;
  if (callee.type === "Identifier")
    return EFFECT_HOOKS.has(callee.name);
  if (callee.type === "MemberExpression") {
    return callee.object?.type === "Identifier" && callee.object.name === "React" && callee.property?.type === "Identifier" && EFFECT_HOOKS.has(callee.property.name);
  }
  return false;
}
function insideEffect(node) {
  let cur = node.parent;
  while (cur) {
    if (cur.type === "CallExpression" && isEffectCallee(cur.callee))
      return true;
    cur = cur.parent;
  }
  return false;
}

// tooling/oxlint-rules/rules/no-fetch-in-effect.ts
var FETCH_NAMES = new Set(["fetch", "apiClient"]);
var KY_OBJECTS = new Set(["ky", "kyClient", "kyServer"]);
function isFetchCall(callee) {
  if (!callee)
    return false;
  if (callee.type === "Identifier")
    return FETCH_NAMES.has(callee.name);
  if (callee.type === "MemberExpression") {
    return callee.object?.type === "Identifier" && KY_OBJECTS.has(callee.object.name);
  }
  return false;
}
var noFetchInEffect = {
  meta: {
    type: "problem",
    docs: { description: "Disallow data fetching inside useEffect; use RSC or Server Actions." },
    messages: {
      fetchInEffect: "Não busque dados em useEffect. Leitura de dados é em Server Component (RSC); mutação é Server Action."
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isFetchCall(node.callee))
          return;
        if (insideEffect(node))
          context.report({ node, messageId: "fetchInEffect" });
      }
    };
  }
};
var no_fetch_in_effect_default = noFetchInEffect;

// tooling/oxlint-rules/rules/no-watch-in-effect.ts
function isWatchCallee(callee) {
  if (!callee)
    return false;
  if (callee.type === "Identifier")
    return callee.name === "watch";
  if (callee.type === "MemberExpression") {
    return !callee.computed && callee.property?.type === "Identifier" && callee.property.name === "watch";
  }
  return false;
}
var noWatchInEffect = {
  meta: {
    type: "problem",
    docs: { description: "Disallow react-hook-form watch() inside useEffect." },
    messages: {
      watchInEffect: "Não use watch() em useEffect. Use useWatch/Controller, ou derive durante o render."
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isWatchCallee(node.callee))
          return;
        if (insideEffect(node))
          context.report({ node, messageId: "watchInEffect" });
      }
    };
  }
};
var no_watch_in_effect_default = noWatchInEffect;

// tooling/oxlint-rules/rules/no-derived-state-in-effect.ts
function isSetterCall(expr) {
  return expr?.type === "CallExpression" && expr.callee?.type === "Identifier" && /^set[A-Z]/.test(expr.callee.name);
}
function isSetterStatement(stmt) {
  return stmt?.type === "ExpressionStatement" && isSetterCall(stmt.expression);
}
var noDerivedStateInEffect = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow useEffect whose only body is a setState derived from its deps."
    },
    messages: {
      derivedState: "useEffect que só faz setState derivado das deps é anti-pattern. Derive durante o render."
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isEffectCallee(node.callee))
          return;
        const args = node.arguments;
        const callback = args[0];
        const deps = args[1];
        if (!callback || callback.type !== "ArrowFunctionExpression" && callback.type !== "FunctionExpression") {
          return;
        }
        if (!deps || deps.type !== "ArrayExpression" || (deps.elements?.length ?? 0) === 0) {
          return;
        }
        const body = callback.body;
        if (!body)
          return;
        if (isSetterCall(body)) {
          context.report({ node, messageId: "derivedState" });
          return;
        }
        if (body.type === "BlockStatement") {
          const statements = body.body;
          if (statements.length === 1 && isSetterStatement(statements[0])) {
            context.report({ node, messageId: "derivedState" });
          }
        }
      }
    };
  }
};
var no_derived_state_in_effect_default = noDerivedStateInEffect;

// tooling/oxlint-rules/rules/no-manual-memo.ts
var MEMO_NAMES = new Set(["useMemo", "useCallback", "memo"]);
function memoName(callee) {
  if (!callee)
    return null;
  if (callee.type === "Identifier" && MEMO_NAMES.has(callee.name)) {
    return callee.name;
  }
  if (callee.type === "MemberExpression" && callee.object?.type === "Identifier" && callee.object.name === "React" && callee.property?.type === "Identifier" && MEMO_NAMES.has(callee.property.name)) {
    return callee.property.name;
  }
  return null;
}
var noManualMemo = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow manual useMemo/useCallback/React.memo; React Compiler memoizes automatically."
    },
    messages: {
      manualMemo: "React Compiler memoiza sozinho — useMemo/useCallback/memo manual é redundante. Remova a memoização manual."
    }
  },
  create(context) {
    return {
      CallExpression(node) {
        if (memoName(node.callee)) {
          context.report({ node, messageId: "manualMemo" });
        }
      }
    };
  }
};
var no_manual_memo_default = noManualMemo;

// tooling/oxlint-rules/rules/no-forbidden-imports.ts
var ALWAYS_FORBIDDEN = [
  "swr",
  "@tanstack/react-query",
  "@tanstack/react-query-devtools",
  "@tanstack/query-core",
  "react-query",
  "axios",
  "zod",
  "jsonwebtoken",
  "jose"
];
function matchesPackage(source, pkg) {
  return source === pkg || source.startsWith(`${pkg}/`);
}
var noForbiddenImports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow forbidden data/http libraries and enforce valibot/ky zones, including package subpaths."
    },
    messages: {
      forbidden: "Import proibido neste repo. Leitura é RSC/Server Actions/apiClient, validação é valibot em *.schema.ts, e authz é sempre no backend.",
      valibotZone: "valibot só pode ser importado em arquivos *.schema.ts.",
      kyZone: "ky só pode ser importado dentro de src/lib/api."
    }
  },
  create(context) {
    const filename = getFilename(context).replace(/\\/g, "/");
    function checkSource(node, source) {
      if (ALWAYS_FORBIDDEN.some((pkg) => matchesPackage(source, pkg))) {
        context.report({ node, messageId: "forbidden" });
        return;
      }
      if (matchesPackage(source, "valibot") && !filename.endsWith(".schema.ts")) {
        context.report({ node, messageId: "valibotZone" });
        return;
      }
      if (matchesPackage(source, "ky") && !filename.includes("src/lib/api/")) {
        context.report({ node, messageId: "kyZone" });
      }
    }
    function checkDeclaration(node) {
      const source = node.source;
      if (typeof source?.value === "string") {
        checkSource(node, source.value);
      }
    }
    return {
      ImportDeclaration: checkDeclaration,
      ExportNamedDeclaration: checkDeclaration,
      ExportAllDeclaration: checkDeclaration
    };
  }
};
var no_forbidden_imports_default = noForbiddenImports;

// tooling/oxlint-rules/rules/no-focused-tests.ts
var FOCUS_OBJECTS = new Set(["test", "it", "describe"]);
var noFocusedTests = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow focused tests (test.only / it.only / describe.only)"
    },
    messages: {
      focused: "Teste focado (.only) é proibido: a suíte passa verde pulando o resto. Remova o .only antes de commitar."
    }
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (node.computed)
          return;
        const property = node.property;
        if (property?.type !== "Identifier" || property.name !== "only")
          return;
        const object = node.object;
        if (object?.type === "Identifier" && FOCUS_OBJECTS.has(object.name)) {
          context.report({ node, messageId: "focused" });
        }
      }
    };
  }
};
var no_focused_tests_default = noFocusedTests;

// tooling/oxlint-rules/rules/no-assert.ts
var ASSERT_PACKAGES = ["assert", "node:assert"];
function matchesAssertPackage(source) {
  return ASSERT_PACKAGES.some((pkg) => source === pkg || source.startsWith(`${pkg}/`));
}
function isAssertCallee(node) {
  if (node?.type === "Identifier" && node.name === "assert")
    return true;
  return node?.type === "MemberExpression" && !node.computed && node.object?.type === "Identifier" && node.object.name === "assert";
}
var noAssert = {
  meta: {
    type: "problem",
    docs: {
      description: "Proíbe assert/node:assert — corrija o tipo na borda, sem forçar invariante em runtime"
    },
    messages: {
      assertForbidden: "assert é proibido. Corrija o tipo na borda (schema/narrowing/binding tipado) — sem assert, !, nem fallback cerimonial."
    }
  },
  create(context) {
    function checkImportSource(node) {
      const source = node.source;
      if (typeof source?.value === "string" && matchesAssertPackage(source.value)) {
        context.report({ node, messageId: "assertForbidden" });
      }
    }
    return {
      ImportDeclaration: checkImportSource,
      ExportNamedDeclaration: checkImportSource,
      ExportAllDeclaration: checkImportSource,
      CallExpression(node) {
        if (isAssertCallee(node.callee)) {
          context.report({ node, messageId: "assertForbidden" });
        }
      }
    };
  }
};
var no_assert_default = noAssert;

// tooling/oxlint-rules/rules/no-defensive-parse.ts
var PARSE_CALLEES = new Set(["decodeURIComponent", "decodeURI"]);
function callsBoundaryParse(block) {
  let found = false;
  const visit = (node) => {
    if (found || !node || typeof node !== "object")
      return;
    if (node.type === "CallExpression") {
      const callee = node.callee;
      if (callee?.type === "Identifier" && PARSE_CALLEES.has(callee.name))
        found = true;
      else if (callee?.type === "MemberExpression" && callee.property?.name === "parse") {
        found = true;
      }
    }
    for (const key in node) {
      if (key === "parent")
        continue;
      const value = node[key];
      if (Array.isArray(value))
        value.forEach(visit);
      else if (value && typeof value === "object")
        visit(value);
    }
  };
  visit(block);
  return found;
}
function swallows(handlerBody) {
  const statements = handlerBody?.body ?? [];
  if (statements.length === 0)
    return true;
  if (statements.length !== 1)
    return false;
  const only = statements[0];
  if (only.type !== "ReturnStatement")
    return false;
  const arg = only.argument;
  return !arg || arg.type === "Literal" || arg.type === "ArrayExpression" || arg.type === "ObjectExpression" || arg.type === "Identifier" && arg.name === "undefined";
}
var noDefensiveParse = {
  meta: {
    type: "problem",
    docs: { description: "Proíbe try/catch que engole erro de parse de borda" },
    messages: {
      defensiveParse: "Parse de borda com catch que só devolve default engole erro e trata caso fora do contrato. Confie no tipo e deixe falhar, ou trate o erro de verdade (log/feedback)."
    }
  },
  create(context) {
    return {
      TryStatement(node) {
        if (node.handler && callsBoundaryParse(node.block) && swallows(node.handler.body)) {
          context.report({ node: node.handler, messageId: "defensiveParse" });
        }
      }
    };
  }
};
var no_defensive_parse_default = noDefensiveParse;

// tooling/oxlint-rules/rules/no-passthrough-mapper.ts
var MIN_FIELDS = 2;
function memberRootName(node) {
  let current = node;
  while (current) {
    if (current.type === "ChainExpression") {
      current = current.expression;
      continue;
    }
    if (current.type === "MemberExpression") {
      current = current.object;
      continue;
    }
    if (current.type === "Identifier")
      return current.name;
    return null;
  }
  return null;
}
function simpleParamNames(fn) {
  const names = new Set;
  for (const param of fn.params ?? []) {
    if (param?.type === "Identifier")
      names.add(param.name);
  }
  return names;
}
function soleReturnedObject(fn) {
  const body = fn.body;
  if (!body)
    return null;
  if (body.type === "ObjectExpression")
    return body;
  if (body.type !== "BlockStatement")
    return null;
  const statements = body.body ?? [];
  if (statements.length !== 1)
    return null;
  const only = statements[0];
  if (only?.type !== "ReturnStatement")
    return null;
  return only.argument?.type === "ObjectExpression" ? only.argument : null;
}
function collectLeafRoots(object) {
  const roots = [];
  for (const property of object.properties ?? []) {
    if (property.type !== "Property" || property.computed)
      return null;
    const value = property.value;
    if (value?.type === "ObjectExpression") {
      const nested = collectLeafRoots(value);
      if (nested === null)
        return null;
      for (const root of nested)
        roots.push(root);
      continue;
    }
    const rootName = memberRootName(value);
    if (rootName == null)
      return null;
    roots.push(rootName);
  }
  return roots;
}
function isPurePassthrough(object, params) {
  const roots = collectLeafRoots(object);
  if (roots === null || roots.length < MIN_FIELDS)
    return false;
  const first = roots[0];
  return params.has(first) && roots.every((root) => root === first);
}
function checkFunction(context, fn) {
  const object = soleReturnedObject(fn);
  if (!object)
    return;
  const params = simpleParamNames(fn);
  if (params.size === 0)
    return;
  if (isPurePassthrough(object, params)) {
    context.report({ node: fn, messageId: "passthrough" });
  }
}
var noPassthroughMapper = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow pass-through mapper functions (1:1 field copy/rename of a single param)."
    },
    messages: {
      passthrough: "Mapper de passagem proibido: essa função só copia campos de um parâmetro. Faça a projeção ser um subconjunto estrutural da origem e devolva a linha direto, sem remapeamento manual."
    }
  },
  create(context) {
    return {
      FunctionDeclaration(node) {
        checkFunction(context, node);
      },
      FunctionExpression(node) {
        checkFunction(context, node);
      },
      ArrowFunctionExpression(node) {
        checkFunction(context, node);
      }
    };
  }
};
var no_passthrough_mapper_default = noPassthroughMapper;

// tooling/oxlint-rules/rules/no-schema-output-converter.ts
function isSchemaSource(source) {
  return source.endsWith(".schema") || /(^|\/)schemas\//.test(source);
}
function collectImportedTypeOrigins(program) {
  const origins = new Map;
  for (const statement of program.body ?? []) {
    if (statement.type !== "ImportDeclaration")
      continue;
    const fromSchema = isSchemaSource(String(statement.source?.value ?? ""));
    for (const specifier of statement.specifiers ?? []) {
      if (specifier.type === "ImportSpecifier" && specifier.local?.name) {
        origins.set(specifier.local.name, fromSchema);
      }
    }
  }
  return origins;
}
function paramTypeName(param) {
  const annotation = param?.typeAnnotation?.typeAnnotation;
  if (annotation?.type !== "TSTypeReference")
    return null;
  return annotation.typeName?.type === "Identifier" ? annotation.typeName.name : null;
}
function collectTypeReferenceNames(node, names) {
  if (node == null || typeof node !== "object")
    return;
  if (Array.isArray(node)) {
    for (const item of node)
      collectTypeReferenceNames(item, names);
    return;
  }
  if (node.type === "TSTypeReference" && node.typeName?.type === "Identifier") {
    names.push(node.typeName.name);
  }
  for (const key of Object.keys(node)) {
    if (key === "parent")
      continue;
    collectTypeReferenceNames(node[key], names);
  }
}
function soleReturnedObject2(fn) {
  const body = fn.body;
  if (!body)
    return null;
  if (body.type === "ObjectExpression")
    return body;
  if (body.type !== "BlockStatement")
    return null;
  const statements = body.body ?? [];
  const returns = statements.filter((s) => s.type === "ReturnStatement");
  if (statements.length > 2 || returns.length !== 1)
    return null;
  if (statements.some((s) => s.type !== "ReturnStatement" && s.type !== "VariableDeclaration")) {
    return null;
  }
  const only = returns[0];
  return only.argument?.type === "ObjectExpression" ? only.argument : null;
}
function checkFunction2(context, fn, typeOrigins) {
  if ((fn.params ?? []).length !== 1)
    return;
  const inputType = paramTypeName(fn.params[0]);
  if (inputType == null || typeOrigins.get(inputType) !== true)
    return;
  if (!soleReturnedObject2(fn))
    return;
  const returnAnnotation = fn.returnType?.typeAnnotation;
  if (!returnAnnotation)
    return;
  const referenced = [];
  collectTypeReferenceNames(returnAnnotation, referenced);
  const targetsExternalShape = referenced.some((name) => typeOrigins.get(name) === false);
  if (targetsExternalShape) {
    context.report({ node: fn, messageId: "schemaOutputConverter" });
  }
}
var noSchemaOutputConverter = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow pure reshape converters over a schema output targeting an imported contract shape; use a valibot transform in the schema instead."
    },
    messages: {
      schemaOutputConverter: "Conversor de output de schema proibido: essa função só re-molda o output validado pro shape de um contrato importado, ou seja, a conversão é trabalho da borda de validação. Como corrigir: (1) mova este reshape pra um transform() no final do próprio *.schema.ts — pipe(object({...campos}), transform(...)); (2) exporte os dois tipos: InferInput pro form (campos crus que o react-hook-form gerencia) e InferOutput pro payload pronto; (3) nos hooks, use useForm<Fields, unknown, Payload> e o onSubmit já recebe o payload — delete este arquivo e o teste dele (os asserts migram pro teste do schema). Exceção: se o tipo de retorno for um shape de domínio declarado no próprio arquivo (ex.: unificar dois schemas de origens diferentes), o conversor é legítimo. Contexto e porquês: AGENTS.md e CODE-PATTERN.md."
    }
  },
  create(context) {
    let typeOrigins = new Map;
    return {
      Program(node) {
        typeOrigins = collectImportedTypeOrigins(node);
      },
      FunctionDeclaration(node) {
        checkFunction2(context, node, typeOrigins);
      },
      FunctionExpression(node) {
        checkFunction2(context, node, typeOrigins);
      },
      ArrowFunctionExpression(node) {
        checkFunction2(context, node, typeOrigins);
      }
    };
  }
};
var no_schema_output_converter_default = noSchemaOutputConverter;

// tooling/oxlint-rules/rules/no-catalog-literal-compare.ts
var CATALOG_NAME_RE = /(PERIODS|CATALOG|PRESETS)$/i;
function walk(node, visit) {
  if (!node || typeof node !== "object")
    return;
  visit(node);
  for (const key in node) {
    if (key === "parent")
      continue;
    const value = node[key];
    if (Array.isArray(value))
      value.forEach((child) => walk(child, visit));
    else if (value && typeof value === "object" && typeof value.type === "string") {
      walk(value, visit);
    }
  }
}
function collectIdsFromArray(elements) {
  const ids = new Set;
  for (const el of elements ?? []) {
    if (el?.type !== "ObjectExpression")
      continue;
    for (const prop of el.properties ?? []) {
      if (prop?.type !== "Property" || prop.computed)
        continue;
      const key = prop.key;
      const isId = key?.type === "Identifier" && key.name === "id" || key?.type === "Literal" && key.value === "id";
      if (!isId)
        continue;
      if (prop.value?.type === "Literal" && typeof prop.value.value === "string") {
        ids.add(prop.value.value);
      }
    }
  }
  return ids;
}
function isCatalogIdDefinition(literalNode) {
  const parent = literalNode.parent;
  if (parent?.type !== "Property" || parent.value !== literalNode || parent.computed) {
    return false;
  }
  const key = parent.key;
  return key?.type === "Identifier" && key.name === "id" || key?.type === "Literal" && key.value === "id";
}
var noCatalogLiteralCompare = {
  meta: {
    type: "problem",
    docs: {
      description: "Proíbe comparar ids de catálogo com string literal quando o registry existe no arquivo"
    },
    messages: {
      catalogLiteral: 'Id de catálogo como literal solto. Referencie o registry (ex.: binding.id / PERIOD_PRESETS) em vez de "{{id}}".'
    }
  },
  create(context) {
    return {
      Program(program) {
        const catalogIds = new Set;
        walk(program, (node) => {
          if (node.type !== "VariableDeclarator")
            return;
          const id = node.id;
          const init = node.init;
          if (id?.type !== "Identifier" || !CATALOG_NAME_RE.test(id.name))
            return;
          if (init?.type !== "ArrayExpression")
            return;
          for (const collected of collectIdsFromArray(init.elements)) {
            catalogIds.add(collected);
          }
        });
        if (catalogIds.size === 0)
          return;
        const reportIfCatalogLiteral = (node) => {
          if (node?.type !== "Literal" || typeof node.value !== "string")
            return;
          if (!catalogIds.has(node.value))
            return;
          if (isCatalogIdDefinition(node))
            return;
          context.report({ node, messageId: "catalogLiteral", data: { id: node.value } });
        };
        walk(program, (node) => {
          if (node.type === "BinaryExpression" && (node.operator === "===" || node.operator === "!==" || node.operator === "==" || node.operator === "!=")) {
            reportIfCatalogLiteral(node.left);
            reportIfCatalogLiteral(node.right);
          }
          if (node.type === "SwitchCase" && node.test) {
            reportIfCatalogLiteral(node.test);
          }
        });
      }
    };
  }
};
var no_catalog_literal_compare_default = noCatalogLiteralCompare;

// tooling/oxlint-rules/rules/no-literal-dispatch.ts
function hasCall(node) {
  let found = false;
  const visit = (n) => {
    if (found || !n || typeof n !== "object")
      return;
    if (n.type === "CallExpression")
      found = true;
    for (const key in n) {
      if (key === "parent")
        continue;
      const value = n[key];
      if (Array.isArray(value))
        value.forEach(visit);
      else if (value && typeof value === "object")
        visit(value);
    }
  };
  visit(node);
  return found;
}
function isSimpleLiteral(node) {
  return node?.type === "Literal" && ["string", "number", "boolean"].includes(typeof node.value);
}
function isLiteralReturn(stmt) {
  return stmt?.type === "ReturnStatement" && isSimpleLiteral(stmt.argument);
}
function consequentReturnsLiteral(node) {
  if (isLiteralReturn(node))
    return true;
  return node?.type === "BlockStatement" && node.body?.length === 1 && isLiteralReturn(node.body[0]);
}
function isLiteralIf(stmt) {
  if (stmt?.type !== "IfStatement")
    return false;
  if (hasCall(stmt.test))
    return false;
  if (!consequentReturnsLiteral(stmt.consequent))
    return false;
  if (stmt.alternate == null)
    return true;
  return isLiteralIf(stmt.alternate) || consequentReturnsLiteral(stmt.alternate);
}
function isLiteralDispatchBody(body) {
  if (body?.type !== "BlockStatement")
    return false;
  const statements = body.body ?? [];
  if (statements.length === 0)
    return false;
  let hasIf = false;
  let hasFallbackReturn = false;
  for (const stmt of statements) {
    if (isLiteralIf(stmt)) {
      hasIf = true;
      continue;
    }
    if (isLiteralReturn(stmt)) {
      hasFallbackReturn = true;
      continue;
    }
    return false;
  }
  return hasIf && hasFallbackReturn;
}
var noLiteralDispatch = {
  meta: {
    type: "suggestion",
    docs: { description: "Sinaliza função-dispatch de literais que caberia inline no call site" },
    messages: {
      literalDispatch: "Função é só um dispatch de literais (um ternário disfarçado). Se tiver caller único, deixe inline no call site em vez de módulo + teste próprios."
    }
  },
  create(context) {
    return {
      FunctionDeclaration(node) {
        if (isLiteralDispatchBody(node.body)) {
          context.report({ node: node.id ?? node, messageId: "literalDispatch" });
        }
      },
      VariableDeclarator(node) {
        const init = node.init;
        if ((init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression") && isLiteralDispatchBody(init.body)) {
          context.report({ node: node.id ?? node, messageId: "literalDispatch" });
        }
      }
    };
  }
};
var no_literal_dispatch_default = noLiteralDispatch;

// tooling/oxlint-rules/index.ts
var plugin = {
  meta: {
    name: "boilerplate"
  },
  rules: {
    "enforce-boundaries": enforce_boundaries_default,
    "no-index-barrel": no_index_barrel_default,
    "no-use-cache": no_use_cache_default,
    "no-force-static": no_force_static_default,
    "api-through-lib": api_through_lib_default,
    "no-fetch-in-effect": no_fetch_in_effect_default,
    "no-watch-in-effect": no_watch_in_effect_default,
    "no-derived-state-in-effect": no_derived_state_in_effect_default,
    "no-manual-memo": no_manual_memo_default,
    "no-forbidden-imports": no_forbidden_imports_default,
    "no-focused-tests": no_focused_tests_default,
    "no-assert": no_assert_default,
    "no-defensive-parse": no_defensive_parse_default,
    "no-passthrough-mapper": no_passthrough_mapper_default,
    "no-schema-output-converter": no_schema_output_converter_default,
    "no-catalog-literal-compare": no_catalog_literal_compare_default,
    "no-literal-dispatch": no_literal_dispatch_default
  }
};
var oxlint_rules_default = plugin;
export {
  oxlint_rules_default as default
};
