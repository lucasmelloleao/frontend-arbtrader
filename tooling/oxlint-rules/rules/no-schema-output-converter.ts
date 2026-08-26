/**
 * Rule: boilerplate/no-schema-output-converter
 *
 * Proíbe o módulo-conversor de output de schema: uma função cujo único parâmetro
 * é o output de um `*.schema.ts` (ex.: `PerfilFormInput`), cujo corpo inteiro é
 * um único `return { ... }` (reshape puro, sem lógica de controle) e cujo tipo de
 * retorno referencia tipos IMPORTADOS de outro módulo (o shape de destino pertence
 * a um contrato externo ao arquivo).
 *
 * Nesse desenho a conversão é trabalho de borda que o valibot já faz: mova-a pra
 * um `transform(...)` no próprio schema, e o `onSubmit`/caller recebe o payload
 * pronto — uma camada e um arquivo a menos.
 *
 * NÃO pega o caso legítimo de shape de domínio próprio: se o tipo de retorno é
 * declarado no MESMO arquivo (ex.: um shape próprio que unifica dois schemas de
 * origens diferentes), a função é dona do shape e a conversão
 * não cabe em um schema só. Corpo com statements além do return (branch, loop,
 * validação) também desqualifica — aí há lógica de domínio, não só reshape.
 */

/** Fontes que caracterizam módulo de schema (borda de validação valibot). */
function isSchemaSource(source: string): boolean {
  return source.endsWith(".schema") || /(^|\/)schemas\//.test(source);
}

/**
 * Mapeia nome local importado -> se veio de um módulo de schema. Cobre
 * `import type { X }` e `import { type X }`.
 */
function collectImportedTypeOrigins(program): Map<string, boolean> {
  const origins = new Map<string, boolean>();
  for (const statement of program.body ?? []) {
    if (statement.type !== "ImportDeclaration") continue;
    const fromSchema = isSchemaSource(String(statement.source?.value ?? ""));
    for (const specifier of statement.specifiers ?? []) {
      if (specifier.type === "ImportSpecifier" && specifier.local?.name) {
        origins.set(specifier.local.name, fromSchema);
      }
    }
  }
  return origins;
}

/** Nome do TSTypeReference simples da anotação do parâmetro, ou null. */
function paramTypeName(param): string | null {
  const annotation = param?.typeAnnotation?.typeAnnotation;
  if (annotation?.type !== "TSTypeReference") return null;
  return annotation.typeName?.type === "Identifier" ? annotation.typeName.name : null;
}

/** Coleta todo nome de TSTypeReference no subtree da anotação de retorno. */
function collectTypeReferenceNames(node, names: string[]): void {
  if (node == null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectTypeReferenceNames(item, names);
    return;
  }
  if (node.type === "TSTypeReference" && node.typeName?.type === "Identifier") {
    names.push(node.typeName.name);
  }
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    collectTypeReferenceNames(node[key], names);
  }
}

/** Corpo é exatamente um `return { ... }` (arrow-expressão conta), senão null. */
function soleReturnedObject(fn) {
  const body = fn.body;
  if (!body) return null;
  if (body.type === "ObjectExpression") return body;
  if (body.type !== "BlockStatement") return null;
  const statements = body.body ?? [];
  const returns = statements.filter((s) => s.type === "ReturnStatement");
  if (statements.length > 2 || returns.length !== 1) return null;
  // Tolera 1 statement de preparação (ex.: destructuring) antes do return:
  // continua sendo reshape puro, sem controle de fluxo.
  if (statements.some((s) => s.type !== "ReturnStatement" && s.type !== "VariableDeclaration")) {
    return null;
  }
  const only = returns[0];
  return only.argument?.type === "ObjectExpression" ? only.argument : null;
}

function checkFunction(context, fn, typeOrigins) {
  if ((fn.params ?? []).length !== 1) return;
  const inputType = paramTypeName(fn.params[0]);
  if (inputType == null || typeOrigins.get(inputType) !== true) return;
  if (!soleReturnedObject(fn)) return;

  const returnAnnotation = fn.returnType?.typeAnnotation;
  if (!returnAnnotation) return;
  const referenced: string[] = [];
  collectTypeReferenceNames(returnAnnotation, referenced);
  // Só acusa se o shape de destino pertence a OUTRO módulo (tipo importado
  // não-schema). Tipo declarado localmente = shape de domínio próprio, permitido.
  const targetsExternalShape = referenced.some((name) => typeOrigins.get(name) === false);
  if (targetsExternalShape) {
    context.report({ node: fn, messageId: "schemaOutputConverter" });
  }
}

const noSchemaOutputConverter = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow pure reshape converters over a schema output targeting an imported contract shape; use a valibot transform in the schema instead.",
    },
    messages: {
      schemaOutputConverter:
        "Conversor de output de schema proibido: essa função só re-molda o output validado pro shape de um contrato importado, ou seja, a conversão é trabalho da borda de validação. Como corrigir: (1) mova este reshape pra um transform() no final do próprio *.schema.ts — pipe(object({...campos}), transform(...)); (2) exporte os dois tipos: InferInput pro form (campos crus que o react-hook-form gerencia) e InferOutput pro payload pronto; (3) nos hooks, use useForm<Fields, unknown, Payload> e o onSubmit já recebe o payload — delete este arquivo e o teste dele (os asserts migram pro teste do schema). Exceção: se o tipo de retorno for um shape de domínio declarado no próprio arquivo (ex.: unificar dois schemas de origens diferentes), o conversor é legítimo. Contexto e porquês: AGENTS.md e CODE-PATTERN.md.",
    },
  },

  create(context) {
    let typeOrigins: Map<string, boolean> = new Map();
    return {
      Program(node) {
        typeOrigins = collectImportedTypeOrigins(node);
      },
      FunctionDeclaration(node) {
        checkFunction(context, node, typeOrigins);
      },
      FunctionExpression(node) {
        checkFunction(context, node, typeOrigins);
      },
      ArrowFunctionExpression(node) {
        checkFunction(context, node, typeOrigins);
      },
    };
  },
};

export default noSchemaOutputConverter;
