/**
 * Rule: boilerplate/no-focused-tests
 *
 * Proíbe teste focado: `test.only`, `it.only`, `describe.only`: que faz a suíte
 * passar verde rodando só o foco e pulando todo o resto. É o bypass clássico do
 * gate de teste, e fica ainda pior com o coverage exigido no pré-push: um `.only`
 * esquecido reduz o universo medido e mascara o que está sem cobertura.
 *
 * Por que regra custom e não o plugin jest do oxlint: o `jest/no-focused-tests`
 * não reconhece `test`/`describe` importados de "bun:test" (deixa `test.only` e
 * `describe.only` passarem; só pega `it.only`). Como o projeto usa `bun:test`, a
 * checagem aqui é estrutural e import-agnóstica: qualquer `<id>.only` cujo objeto
 * seja test/it/describe é reportado, venha de onde vier o identificador.
 */

const FOCUS_OBJECTS = new Set(["test", "it", "describe"]);

const noFocusedTests = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow focused tests (test.only / it.only / describe.only)",
    },
    messages: {
      focused:
        "Teste focado (.only) é proibido: a suíte passa verde pulando o resto. Remova o .only antes de commitar.",
    },
  },

  create(context) {
    return {
      MemberExpression(node) {
        if (node.computed) return;

        const property = node.property;
        if (property?.type !== "Identifier" || property.name !== "only") return;

        const object = node.object;
        if (object?.type === "Identifier" && FOCUS_OBJECTS.has(object.name)) {
          context.report({ node, messageId: "focused" });
        }
      },
    };
  },
};

export default noFocusedTests;
