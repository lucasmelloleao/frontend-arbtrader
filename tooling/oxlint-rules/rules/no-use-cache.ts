/**
 * Rule: boilerplate/no-use-cache
 *
 * Reports four patterns that opt into Next.js "always-fresh" caching behaviour:
 *   1. The "use cache" directive at the top of a module or function body.
 *   2. `import { unstable_cache } from "next/cache"`.
 *   3. An object property `cache: "force-cache"`.
 *   4. `fetch(url, { next: { revalidate: <number > 0 | false> } })`.
 *
 * NOT reported (React request-dedup, which is allowed):
 *   - `import { cache } from "react"`
 *   - `cache()` or `React.cache()` call expressions
 */

const noUseCache = {
  meta: {
    type: "problem",
    docs: {
      description:
        'Disallow "use cache" directive, unstable_cache import, force-cache property, and stale fetch revalidate',
    },
    messages: {
      useCache:
        'The "use cache" directive is not allowed. Remove it to prevent unintended caching.',
      unstableCache: 'Importing "unstable_cache" from "next/cache" is not allowed.',
      forceCache:
        'Setting cache to "force-cache" is not allowed. Use a different caching strategy.',
      staleRevalidate:
        "`fetch(..., { next: { revalidate } })` com valor diferente de 0 cria cache/staleness. Use 0 ou remova.",
    },
  },

  create(context) {
    return {
      // Case 1: "use cache" directive: inclui variantes "use cache: remote" / "use cache: private"
      ExpressionStatement(node) {
        // oxlint sets `directive` on ExpressionStatement when it is a prologue directive
        const directive = (node as { directive?: string | null }).directive;
        if (typeof directive === "string" && directive.startsWith("use cache")) {
          context.report({ node, messageId: "useCache" });
        }
      },

      // Case 2: import { unstable_cache } from "next/cache"
      ImportDeclaration(node) {
        if (node.source.value !== "next/cache") return;

        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;

          const imported = specifier.imported;
          // imported is IdentifierName | IdentifierReference | StringLiteral
          const importedName =
            imported.type === "Identifier"
              ? (imported as { name: string }).name
              : imported.type === "Literal"
                ? (imported as { value: string }).value
                : null;

          if (importedName === "unstable_cache") {
            context.report({ node: specifier, messageId: "unstableCache" });
          }
        }
      },

      // Case 3: { cache: "force-cache" }
      Property(node) {
        // Only handle ObjectProperty (has key + value)
        if (node.type !== "Property") return;

        const objProp = node as {
          type: "Property";
          key: { type: string; name?: string; value?: unknown };
          value: { type: string; value?: unknown };
          computed: boolean;
        };

        // Resolve key name: only static keys
        if (objProp.computed) return;

        const key = objProp.key;
        let keyName: string | null = null;

        if (key.type === "Identifier") {
          keyName = key.name ?? null;
        } else if (key.type === "Literal") {
          keyName = typeof key.value === "string" ? key.value : null;
        }

        if (keyName !== "cache" && keyName !== "revalidate") return;
        const val = objProp.value;

        // Check that value is the string literal "force-cache".
        if (keyName === "cache" && val.type === "Literal" && val.value === "force-cache") {
          context.report({ node, messageId: "forceCache" });
        }

        // Check only inline fetch options:
        //   fetch(url, { next: { revalidate: 60 } })
        // This avoids false positives in unrelated domain objects.
        if (
          keyName === "revalidate" &&
          val.type === "Literal" &&
          (val.value === false || (typeof val.value === "number" && val.value > 0)) &&
          isInlineFetchNextRevalidateProperty(node)
        ) {
          context.report({ node, messageId: "staleRevalidate" });
        }
      },
    };
  },
};

export default noUseCache;

function isStaticPropertyNamed(node, name: string): boolean {
  if (!node || node.type !== "Property" || node.computed) return false;
  const key = node.key;
  return (
    (key.type === "Identifier" && key.name === name) ||
    (key.type === "Literal" && key.value === name)
  );
}

function isInlineFetchNextRevalidateProperty(node): boolean {
  const nextOptions = node.parent;
  if (!nextOptions || nextOptions.type !== "ObjectExpression") return false;

  const nextProperty = nextOptions.parent;
  if (!isStaticPropertyNamed(nextProperty, "next") || nextProperty.value !== nextOptions) {
    return false;
  }

  const fetchOptions = nextProperty.parent;
  if (!fetchOptions || fetchOptions.type !== "ObjectExpression") return false;

  const call = fetchOptions.parent;
  if (!call || call.type !== "CallExpression") return false;

  return (
    call.callee?.type === "Identifier" &&
    call.callee.name === "fetch" &&
    call.arguments?.[1] === fetchOptions
  );
}
