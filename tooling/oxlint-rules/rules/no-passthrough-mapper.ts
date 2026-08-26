/**
 * Rule: boilerplate/no-passthrough-mapper
 *
 * Proíbe o "mapper de passagem": uma função cujo corpo inteiro é
 *
 *   function toX(row) { return { a: row.a, password: row.senha }; }
 *   const toX = (row) => ({ a: row.a, b: row.b.c });
 *
 * — todo valor do objeto retornado é um acesso de campo no MESMO parâmetro (cópia ou
 * rename puro), com 2+ campos. Isso é cerimônia: no lugar, faça a projeção do domínio ser
 * um subconjunto ESTRUTURAL da linha de origem e devolva a linha direto (tipagem
 * estrutural), sem uma camada de remapeamento manual que só duplica nomes de campo.
 *
 * NÃO pega transformação real: spread (`...row`), valor computado (`row.plan?.isTrial ??
 * false`), chamada de função, condicional, literal, ou valores vindos de fontes
 * diferentes. Qualquer statement além do único `return` também desqualifica (aí há lógica).
 */

const MIN_FIELDS = 2;

/** Raiz identificadora de um encadeamento de acesso a membro (row.a.b → "row"); senão null. */
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
    if (current.type === "Identifier") return current.name;
    return null;
  }
  return null;
}

/** Coleta os nomes de parâmetros simples (Identifier) da função. */
function simpleParamNames(fn) {
  const names = new Set<string>();
  for (const param of fn.params ?? []) {
    if (param?.type === "Identifier") names.add(param.name);
  }
  return names;
}

/** O ObjectExpression retornado direto pela função, ou null se não for um corpo "só return". */
function soleReturnedObject(fn) {
  const body = fn.body;
  if (!body) return null;
  if (body.type === "ObjectExpression") return body; // arrow com corpo-expressão: () => ({...})
  if (body.type !== "BlockStatement") return null;
  const statements = body.body ?? [];
  if (statements.length !== 1) return null;
  const only = statements[0];
  if (only?.type !== "ReturnStatement") return null;
  return only.argument?.type === "ObjectExpression" ? only.argument : null;
}

/**
 * Coleta a raiz identificadora de cada valor-FOLHA do objeto, descendo em objetos aninhados
 * (ex.: `{ authorities: { a: row.a } }`). Retorna null se algum valor não for acesso de
 * membro nem objeto de acessos (call, literal, spread, computed) — aí não é cópia pura.
 */
function collectLeafRoots(object): string[] | null {
  const roots: string[] = [];
  for (const property of object.properties ?? []) {
    if (property.type !== "Property" || property.computed) return null;
    const value = property.value;
    if (value?.type === "ObjectExpression") {
      const nested = collectLeafRoots(value);
      if (nested === null) return null;
      for (const root of nested) roots.push(root);
      continue;
    }
    const rootName = memberRootName(value);
    if (rootName == null) return null;
    roots.push(rootName);
  }
  return roots;
}

/** Verdadeiro se TODA folha do objeto é acesso de campo no MESMO parâmetro (≥ MIN_FIELDS). */
function isPurePassthrough(object, params) {
  const roots = collectLeafRoots(object);
  if (roots === null || roots.length < MIN_FIELDS) return false;
  const first = roots[0];
  return params.has(first) && roots.every((root) => root === first);
}

function checkFunction(context, fn) {
  const object = soleReturnedObject(fn);
  if (!object) return;
  const params = simpleParamNames(fn);
  if (params.size === 0) return;
  if (isPurePassthrough(object, params)) {
    context.report({ node: fn, messageId: "passthrough" });
  }
}

const noPassthroughMapper = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow pass-through mapper functions (1:1 field copy/rename of a single param).",
    },
    messages: {
      passthrough:
        "Mapper de passagem proibido: essa função só copia campos de um parâmetro. Faça a projeção ser um subconjunto estrutural da origem e devolva a linha direto, sem remapeamento manual.",
    },
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
      },
    };
  },
};

export default noPassthroughMapper;
