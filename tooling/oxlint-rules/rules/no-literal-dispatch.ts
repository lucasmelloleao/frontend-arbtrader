/**
 * Rule: boilerplate/no-literal-dispatch (EXPERIMENTAL)
 *
 * Sinaliza função exportada cujo corpo inteiro é um "dispatch de literais": só
 * `if (x === "a") return "b";` e um `return "c";` de fallback, sem chamada, objeto,
 * loop ou acesso computado. É um ternário disfarçado
 * de função, que a diretriz manda deixar inline no call site em vez de virar módulo
 * + teste próprios.
 *
 * LIMITE CONHECIDO: a regra vê só a AST do arquivo, não quantos callers a função
 * tem. Um mapper de literais de verdade (usado em 3+ lugares) é DRY legítimo e cairia
 * aqui como falso-positivo. Por isso é advisory: use pra revisar, não como veredito.
 * O "uso único → inline" continua sendo julgamento humano; isto só levanta candidatos.
 */

function hasCall(node): boolean {
  let found = false;
  const visit = (n) => {
    if (found || !n || typeof n !== "object") return;
    if (n.type === "CallExpression") found = true;
    for (const key in n) {
      if (key === "parent") continue;
      const value = n[key];
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    }
  };
  visit(node);
  return found;
}

/** Literal simples (string/número/boolean), o que um dispatch trivial devolve. */
function isSimpleLiteral(node): boolean {
  return node?.type === "Literal" && ["string", "number", "boolean"].includes(typeof node.value);
}

/** Statement é `return <literal>`. */
function isLiteralReturn(stmt): boolean {
  return stmt?.type === "ReturnStatement" && isSimpleLiteral(stmt.argument);
}

/** Consequente do if devolve literal (direto ou num bloco de um único return). */
function consequentReturnsLiteral(node): boolean {
  if (isLiteralReturn(node)) return true;
  return (
    node?.type === "BlockStatement" && node.body?.length === 1 && isLiteralReturn(node.body[0])
  );
}

/** `if (comparação sem chamada) return <literal>` — o alternate, se houver, também qualifica. */
function isLiteralIf(stmt): boolean {
  if (stmt?.type !== "IfStatement") return false;
  if (hasCall(stmt.test)) return false;
  if (!consequentReturnsLiteral(stmt.consequent)) return false;
  if (stmt.alternate == null) return true;
  return isLiteralIf(stmt.alternate) || consequentReturnsLiteral(stmt.alternate);
}

function isLiteralDispatchBody(body): boolean {
  if (body?.type !== "BlockStatement") return false;
  const statements = body.body ?? [];
  if (statements.length === 0) return false;

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
    return false; // qualquer outro statement = lógica real, não é dispatch trivial
  }
  return hasIf && hasFallbackReturn;
}

const noLiteralDispatch = {
  meta: {
    type: "suggestion",
    docs: { description: "Sinaliza função-dispatch de literais que caberia inline no call site" },
    messages: {
      literalDispatch:
        "Função é só um dispatch de literais (um ternário disfarçado). Se tiver caller único, deixe inline no call site em vez de módulo + teste próprios.",
    },
  },

  create(context) {
    return {
      FunctionDeclaration(node) {
        if (isLiteralDispatchBody(node.body)) {
          context.report({ node: node.id ?? node, messageId: "literalDispatch" });
        }
      },
      // const f = (x) => { if (...) return "a"; return "b"; }
      VariableDeclarator(node) {
        const init = node.init;
        if (
          (init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression") &&
          isLiteralDispatchBody(init.body)
        ) {
          context.report({ node: node.id ?? node, messageId: "literalDispatch" });
        }
      },
    };
  },
};

export default noLiteralDispatch;
