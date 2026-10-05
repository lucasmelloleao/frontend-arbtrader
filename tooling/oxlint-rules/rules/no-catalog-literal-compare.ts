/**
 * Rule: boilerplate/no-catalog-literal-compare
 *
 * Quando o arquivo define um registry de ids (`{ id: "…" }` em array const cujo
 * nome casa PERIODS|CATALOG|PRESETS), proíbe comparar contra o mesmo id como
 * string literal solta (`if (id === "ultimos-7-dias")`). O literal deve viver só no
 * registry; o resto referencia `preset.id` / binding derivado do registry.
 *
 * Escopo: só o arquivo que define o catálogo (AST local). Testes e callers em
 * outros arquivos podem continuar passando string crua (URL, fixture).
 */

const CATALOG_NAME_RE = /(PERIODS|CATALOG|PRESETS)$/i;

function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node);
  for (const key in node) {
    if (key === "parent") continue;
    const value = node[key];
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value === "object" && typeof value.type === "string") {
      walk(value, visit);
    }
  }
}

/** Coleta ids string de elementos `{ id: "…" }` num ArrayExpression. */
function collectIdsFromArray(elements): Set<string> {
  const ids = new Set<string>();
  for (const el of elements ?? []) {
    if (el?.type !== "ObjectExpression") continue;
    for (const prop of el.properties ?? []) {
      if (prop?.type !== "Property" || prop.computed) continue;
      const key = prop.key;
      const isId =
        (key?.type === "Identifier" && key.name === "id") ||
        (key?.type === "Literal" && key.value === "id");
      if (!isId) continue;
      if (prop.value?.type === "Literal" && typeof prop.value.value === "string") {
        ids.add(prop.value.value);
      }
    }
  }
  return ids;
}

/** Literal é o valor de `id:` numa property (definição do registry) — isento. */
function isCatalogIdDefinition(literalNode): boolean {
  const parent = literalNode.parent;
  if (parent?.type !== "Property" || parent.value !== literalNode || parent.computed) {
    return false;
  }
  const key = parent.key;
  return (
    (key?.type === "Identifier" && key.name === "id") ||
    (key?.type === "Literal" && key.value === "id")
  );
}

const noCatalogLiteralCompare = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Proíbe comparar ids de catálogo com string literal quando o registry existe no arquivo",
    },
    messages: {
      catalogLiteral:
        'Id de catálogo como literal solto. Referencie o registry (ex.: binding.id / PERIOD_PRESETS) em vez de "{{id}}".',
    },
  },

  create(context) {
    return {
      Program(program) {
        const catalogIds = new Set<string>();

        walk(program, (node) => {
          if (node.type !== "VariableDeclarator") return;
          const id = node.id;
          const init = node.init;
          if (id?.type !== "Identifier" || !CATALOG_NAME_RE.test(id.name)) return;
          if (init?.type !== "ArrayExpression") return;
          for (const collected of collectIdsFromArray(init.elements)) {
            catalogIds.add(collected);
          }
        });

        if (catalogIds.size === 0) return;

        const reportIfCatalogLiteral = (node) => {
          if (node?.type !== "Literal" || typeof node.value !== "string") return;
          if (!catalogIds.has(node.value)) return;
          if (isCatalogIdDefinition(node)) return;
          context.report({ node, messageId: "catalogLiteral", data: { id: node.value } });
        };

        walk(program, (node) => {
          if (
            node.type === "BinaryExpression" &&
            (node.operator === "===" ||
              node.operator === "!==" ||
              node.operator === "==" ||
              node.operator === "!=")
          ) {
            reportIfCatalogLiteral(node.left);
            reportIfCatalogLiteral(node.right);
          }
          if (node.type === "SwitchCase" && node.test) {
            reportIfCatalogLiteral(node.test);
          }
        });
      },
    };
  },
};

export default noCatalogLiteralCompare;
