/**
 * Rule: boilerplate/enforce-boundaries
 *
 * Enforces unidirectional layer imports in the architecture:
 *   app (4) -> features (3) -> lib (2) -> shared (1)
 *
 * Violations:
 *   1. A lower-ranked layer imports from a higher-ranked layer (reversed direction).
 *   2. A feature imports from a sibling feature (cross-feature); shared/ is the
 *      right place for code used by multiple features.
 *
 * Layer detection:
 *   - layerOf(filename) : inspects the absolute/project-relative file path for
 *     src/(app|features|lib|shared)/
 *   - importLayer(spec) : inspects the import specifier for @/(app|features|lib|shared)
 *
 * External imports (no @/<layer> prefix) are always ignored.
 */

// ---------------------------------------------------------------------------
// Layer constants
// ---------------------------------------------------------------------------

import { getFilename } from "./_context-utils.ts";

type Layer = "app" | "features" | "lib" | "shared";

const LAYER_RANK: Record<Layer, number> = {
  app: 4,
  features: 3,
  lib: 2,
  shared: 1,
};

// Matches  …/src/<layer>/…  in a file path (forward or backward slashes).
const FILE_LAYER_RE = /[/\\]src[/\\](app|features|lib|shared)[/\\]/;
// Matches  @/<layer>  no início do specifier, com ou sem `/` (ex.: `@/shared`
// e `@/shared/x`: sem o `(\/|$)` um import direto da raiz da camada burlava).
const IMPORT_LAYER_RE = /^@\/(app|features|lib|shared)(\/|$)/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the layer a *file* belongs to from its path.
 * Returns undefined when the file does not live under a recognised layer.
 */
function layerOf(filename: string): Layer | undefined {
  const m = FILE_LAYER_RE.exec(filename);
  return m ? (m[1] as Layer) : undefined;
}

/**
 * Extract the layer a *specifier* targets via the @/<layer> alias convention.
 * Returns undefined for external or non-aliased imports.
 */
function importLayer(spec: string): Layer | undefined {
  const m = IMPORT_LAYER_RE.exec(spec);
  return m ? (m[1] as Layer) : undefined;
}

/**
 * Extract the feature name from a file path, e.g.
 *   …/src/features/checkout/… → "checkout"
 */
const FEATURE_FROM_FILE_RE = /[/\\]src[/\\]features[/\\]([^/\\]+)/;

function featureOf(filename: string): string | undefined {
  const m = FEATURE_FROM_FILE_RE.exec(filename);
  return m ? m[1] : undefined;
}

/**
 * Extract the feature name from an import specifier, e.g.
 *   @/features/checkout/… → "checkout"
 */
const FEATURE_FROM_SPEC_RE = /^@\/features\/([^/]+)/;

function featureOfSpec(spec: string): string | undefined {
  const m = FEATURE_FROM_SPEC_RE.exec(spec);
  return m ? m[1] : undefined;
}

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------

const enforceBoundaries = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce unidirectional layer imports (app→features→lib→shared) and disallow cross-feature imports.",
    },
    messages: {
      reversedDirection:
        "Import direction violation: '{{from}}' cannot import from '{{to}}'. " +
        "Layers must flow app → features → lib → shared.",
      crossFeature:
        "Cross-feature import: a feature must not import from a sibling feature. " +
        "Move shared code to shared/ instead.",
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        // The specifier is the string literal in `import … from "<spec>"`;
        // oxlint exposes it as node.source.value (string).
        const source = node.source;
        const spec = typeof source?.value === "string" ? source.value : "";

        // 1. Only act on internal imports that use the @/<layer> alias.
        const toLayer = importLayer(spec);
        if (!toLayer) return; // external or non-aliased: ignore

        // 2. Determine which layer the current file belongs to.
        const filename: string = getFilename(context);
        const fromLayer = layerOf(filename);
        if (!fromLayer) return; // file not under a recognised layer: ignore

        const fromRank = LAYER_RANK[fromLayer];
        const toRank = LAYER_RANK[toLayer];

        // 3. Reversed-direction check: lower rank importing from higher rank.
        if (toRank > fromRank) {
          context.report({
            node,
            messageId: "reversedDirection",
            data: { from: fromLayer, to: toLayer },
          });
          return; // report once per import declaration
        }

        // 4. Cross-feature check: features/<A> importing from @/features/<B>
        if (fromLayer === "features" && toLayer === "features") {
          const fromFeature = featureOf(filename);
          const toFeature = featureOfSpec(spec);
          if (fromFeature !== undefined && toFeature !== undefined && fromFeature !== toFeature) {
            context.report({
              node,
              messageId: "crossFeature",
            });
          }
        }
      },
    };
  },
};

export default enforceBoundaries;
