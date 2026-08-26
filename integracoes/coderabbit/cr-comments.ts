/**
 * Fetch + normaliza os comentários do CodeRabbit num PR, pra o comando
 * `/pr-review` (skill `pr-review-response`) consumir dados determinísticos: o
 * LLM gasta token julgando, não paginando o GitHub nem limpando markdown.
 *
 * Fonte da verdade = GraphQL `reviewThreads`. É o único lugar que dá, por thread,
 * `isResolved`/`isOutdated` + o node id (pra resolver depois via
 * `resolveReviewThread`) + o `databaseId` do comentário (pra responder via REST
 * `in_reply_to`). As REST `/pulls/{n}/comments` não trazem o estado de resolução
 * da thread, então não servem como fonte única.
 *
 * Escopo "tudo": além das threads inline, traz os reviews-resumo do CodeRabbit
 * (os nitpicks colapsados no corpo do review), que não são thread respondível mas
 * entram como contexto no triage.
 *
 * Uso: `bun integracoes/coderabbit/cr-comments.ts [<pr-number>]`. Sem argumento,
 * resolve o PR da branch atual. Saída: JSON no stdout (não imprime nada sensível;
 * só dados do PR).
 */
import { $ } from "bun";

/** Login do bot do CodeRabbit no GitHub (sem o sufixo `[bot]` que a API REST usa). */
const CODERABBIT_LOGIN = "coderabbitai";

/** Caps do GraphQL nesta query. PRs reais ficam bem abaixo; avisa se estourar. */
const THREADS_CAP = 100;
const COMMENTS_PER_THREAD_CAP = 50;

type GraphQLComment = {
  databaseId: number;
  author: { login: string } | null;
  body: string;
  path: string;
  line: number | null;
  url: string;
  createdAt: string;
};

type GraphQLThread = {
  id: string;
  isResolved: boolean;
  isOutdated: boolean;
  comments: { nodes: GraphQLComment[] };
};

type GraphQLReview = {
  author: { login: string } | null;
  body: string;
  submittedAt: string | null;
  url: string;
};

/**
 * Remove o ruído estrutural do corpo de um comentário do CodeRabbit: blocos
 * colapsáveis (o "🤖 Prompt for AI Agents", "🧰 Tools", "📝 Committable
 * suggestion") e os marcadores HTML de controle (cr-comment, fingerprinting).
 * Mantém o conteúdo de julgamento (título, descrição, diff sugerido em texto).
 */
function stripNoise(body: string): string {
  return body
    .replace(/<details>[\s\S]*?<\/details>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Primeiro `**negrito**` do corpo: o CodeRabbit usa como título da observação. */
function extractTitle(body: string): string {
  return body.match(/\*\*([\s\S]+?)\*\*/)?.[1]?.trim() ?? "";
}

/**
 * Linha de severidade do CodeRabbit, que vem antes do título em negrito, no
 * formato `_🎯 Functional Correctness_ | _🟠 Major_ | _⚡ Quick win_`. Pega tudo
 * antes do primeiro `**` e tira os `_`/`|` decorativos. Dica de priorização; o
 * agente lê o corpo de qualquer forma.
 */
function extractSeverity(body: string): string {
  return (body.split("**")[0] ?? "").replace(/[_|]/g, " ").replace(/\s+/g, " ").trim();
}

async function resolvePrNumber(): Promise<number> {
  const arg = process.argv[2];
  if (arg) {
    const n = Number(arg);
    if (!Number.isInteger(n)) {
      process.stderr.write(`PR inválido: "${arg}"\n`);
      process.exit(1);
    }
    return n;
  }
  // `.nothrow()` porque `gh pr view` sai com erro quando não há PR pra branch, e
  // o `$` lançaria o ShellError antes da mensagem amigável abaixo aparecer.
  const view = await $`gh pr view --json number -q .number`.nothrow().quiet();
  const n = Number(view.stdout.toString().trim());
  if (view.exitCode !== 0 || !Number.isInteger(n)) {
    process.stderr.write(
      "Nenhum PR encontrado pra branch atual. Passe o número: bun integracoes/coderabbit/cr-comments.ts <pr>\n",
    );
    process.exit(1);
  }
  return n;
}

const pr = await resolvePrNumber();
const repo: { owner: { login: string }; name: string } =
  await $`gh repo view --json owner,name`.json();

const query = `
query($owner:String!,$repo:String!,$pr:Int!){
  repository(owner:$owner,name:$repo){
    pullRequest(number:$pr){
      reviewThreads(first:${THREADS_CAP}){
        nodes{
          id isResolved isOutdated
          comments(first:${COMMENTS_PER_THREAD_CAP}){
            nodes{ databaseId author{login} body path line url createdAt }
          }
        }
      }
      reviews(first:50){ nodes{ author{login} body submittedAt url } }
    }
  }
}`;

const raw: {
  data: {
    repository: {
      pullRequest: {
        reviewThreads: { nodes: GraphQLThread[] };
        reviews: { nodes: GraphQLReview[] };
      };
    };
  };
} =
  await $`gh api graphql -f query=${query} -F owner=${repo.owner.login} -F repo=${repo.name} -F pr=${pr}`.json();

const pull = raw.data.repository.pullRequest;

if (pull.reviewThreads.nodes.length === THREADS_CAP) {
  process.stderr.write(
    `Aviso: ${THREADS_CAP} threads (cap atingido); pode haver mais não listadas.\n`,
  );
}

/**
 * Threads cujo PRIMEIRO comentário é do CodeRabbit. `commentId` (databaseId) é o
 * alvo do `in_reply_to` REST; `threadId` (node id) é o alvo do
 * `resolveReviewThread` GraphQL. `replies` (qualquer comentário após o primeiro)
 * é o que a fase de resolver lê pra ver se o CodeRabbit já respondeu nossa réplica.
 */
const threads = pull.reviewThreads.nodes.flatMap((thread) => {
  const comments = thread.comments.nodes;
  const first = comments.at(0);
  // Só threads abertas pelo CodeRabbit. `flatMap` + `[]`/`[obj]` evita o
  // filter+non-null assertion (banido pelo lint) e mantém o tipo estreitado.
  if (!first || first.author?.login !== CODERABBIT_LOGIN) {
    return [];
  }
  const last = comments.at(-1) ?? first;
  return [
    {
      threadId: thread.id,
      commentId: first.databaseId,
      path: first.path,
      line: first.line,
      isResolved: thread.isResolved,
      isOutdated: thread.isOutdated,
      severity: extractSeverity(first.body),
      title: extractTitle(first.body),
      body: stripNoise(first.body),
      url: first.url,
      lastAuthor: last.author?.login ?? null,
      replies: comments.slice(1).map((comment) => ({
        author: comment.author?.login ?? null,
        body: stripNoise(comment.body),
        createdAt: comment.createdAt,
      })),
    },
  ];
});

/** Reviews-resumo do CodeRabbit (corpo com nitpicks colapsados). Contexto, não thread. */
const reviewSummaries = pull.reviews.nodes
  .filter((review) => review.author?.login === CODERABBIT_LOGIN && review.body.trim() !== "")
  .map((review) => ({
    body: stripNoise(review.body),
    submittedAt: review.submittedAt,
    url: review.url,
  }));

process.stdout.write(`${JSON.stringify({ pr, threads, reviewSummaries }, null, 2)}\n`);
