/**
 * Rule: boilerplate/no-index-barrel
 *
 * In files named index.ts / index.tsx / index.js / index.jsx, this rule
 * disallows re-export statements that reference an external module (a "barrel"):
 *
 *   export { foo } from "./foo";   // ExportNamedDeclaration with source → ERROR
 *   export * from "./bar";         // ExportAllDeclaration               → ERROR
 *
 * Local (non-source) named exports are allowed:
 *
 *   export const x = 1;           // ExportNamedDeclaration without source → OK
 *   export { y };                  // ExportNamedDeclaration without source → OK
 *
 * Only files whose basename (ignoring directory) matches one of the four
 * index.* patterns are checked; all other files are silently skipped.
 */

import { basename } from "node:path";

import { getFilename } from "./_context-utils.ts";

const INDEX_BASENAMES = new Set(["index.ts", "index.tsx", "index.js", "index.jsx"]);

const MESSAGE =
  "index.* nao pode ser barrel de re-export; importe direto do modulo (cobre o gap do oxc/no-barrel-file que so pega export *)";

const noIndexBarrel = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow barrel re-exports in index.* files (named re-exports and export-all)",
    },
    messages: {
      noBarrel: MESSAGE,
    },
  },
  create(context) {
    // Determine whether this file is an index.* file.
    const filename = getFilename(context);
    const base = basename(filename);

    if (!INDEX_BASENAMES.has(base)) {
      // Not an index file: nothing to check.
      return {};
    }

    return {
      // export { foo } from "./foo"  OR  export { foo as bar } from "./foo"
      ExportNamedDeclaration(node) {
        // `source` is present when the export references an external module.
        if (node.source != null) {
          context.report({ node, messageId: "noBarrel" });
        }
      },

      // export * from "./foo"  OR  export * as ns from "./foo"
      ExportAllDeclaration(node) {
        context.report({ node, messageId: "noBarrel" });
      },
    };
  },
};

export default noIndexBarrel;
