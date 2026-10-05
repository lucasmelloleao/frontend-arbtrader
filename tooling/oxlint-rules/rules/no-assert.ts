/**
 * Rule: boilerplate/no-assert
 *
 * Proíbe `assert` / `node:assert` (import e chamada). Forçar invariante em runtime
 * (`assert(x)`, `assert.ok(x)`, `!`, `as`) mascara contrato errado; o tipo tem que
 * estar certo na borda.
 */

const ASSERT_PACKAGES = ["assert", "node:assert"];

function matchesAssertPackage(source: string): boolean {
  return ASSERT_PACKAGES.some((pkg) => source === pkg || source.startsWith(`${pkg}/`));
}

function isAssertCallee(node): boolean {
  if (node?.type === "Identifier" && node.name === "assert") return true;
  return (
    node?.type === "MemberExpression" &&
    !node.computed &&
    node.object?.type === "Identifier" &&
    node.object.name === "assert"
  );
}

const noAssert = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Proíbe assert/node:assert — corrija o tipo na borda, sem forçar invariante em runtime",
    },
    messages: {
      assertForbidden:
        "assert é proibido. Corrija o tipo na borda (schema/narrowing/binding tipado) — sem assert, !, nem fallback cerimonial.",
    },
  },

  create(context) {
    function checkImportSource(node): void {
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
      },
    };
  },
};

export default noAssert;
