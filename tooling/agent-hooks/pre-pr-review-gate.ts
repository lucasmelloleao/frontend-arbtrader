/**
 * PreToolUse Bash / beforeShellExecution — portão de pré-review antes de `gh pr create`.
 * Selo: `.agents/tmp/pre-review-<HEAD>.ok`.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { emitAllow, emitDeny, isShellEvent, readHookInput, readShellCommand } from "./host.ts";

const MAX_PR_LOC = 3000;

/** Base default de PR. Alinhada à seção "Branch base" do CLAUDE.md. */
const BASE_BRANCH = "main";

const { host, raw } = await readHookInput();

if (raw.__invalid_json === true) {
  emitDeny(
    host,
    "PR travada: o hook recebeu JSON inválido. Reexecute o comando; se persistir, verifique a configuração de hooks do host.",
  );
}

if (!isShellEvent(raw)) {
  emitAllow(host);
}

const command = readShellCommand(raw);
if (typeof command !== "string") {
  emitDeny(host, "PR travada: a entrada do hook precisa conter o comando shell como string.");
}

if (!/\bgh\s+pr\s+create\b/.test(command)) {
  emitAllow(host);
}

const hasExplicitBase = /(?:^|\s)(?:--base(?==|\s|$)|-B)/.test(command);
const baseMatch = command.match(
  /(?:^|\s)(?:--base(?:=|\s+)|-B(?:=|\s+)?)(?:"([^"]+)"|'([^']+)'|([^\s]+))/,
);

if (hasExplicitBase && !baseMatch) {
  emitDeny(
    host,
    `PR travada: informe a base como \`--base ${BASE_BRANCH}\` ou \`-B ${BASE_BRANCH}\` (ou \`--base feature/<nome>\` pra empilhar numa feature).`,
  );
}

const base = baseMatch?.[1] ?? baseMatch?.[2] ?? baseMatch?.[3] ?? BASE_BRANCH;

if (base !== BASE_BRANCH && !base.startsWith("feature/")) {
  emitDeny(
    host,
    `PR travada: a base informada foi \`${base}\`, mas PR deste repositório entra em \`${BASE_BRANCH}\` ou empilha numa \`feature/*\`. Reexecute com \`--base ${BASE_BRANCH}\` ou \`--base feature/<nome>\`.`,
  );
}

let head: string;

try {
  head = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
} catch {
  emitDeny(
    host,
    "PR travada: não foi possível identificar o HEAD com `git rev-parse HEAD`. Confirme que o comando roda dentro do repositório e tente novamente.",
  );
}

if (!existsSync(`.agents/tmp/pre-review-${head}.ok`)) {
  emitDeny(
    host,
    `PR travada: a pré-review de guardrails não rodou pro commit atual (${head.slice(0, 8)}).\n` +
      `Rode a skill \`pre-review\` (\`/pre-review\`) primeiro. Ela grava o selo que libera o gh pr create. ` +
      `Qualquer commit novo depois disso exige nova pré-review.`,
  );
}

const sizeAck = `.agents/tmp/pr-size-ack-${head}.ok`;

if (!existsSync(sizeAck)) {
  let numstat: string;

  try {
    numstat = execFileSync("git", ["diff", "--numstat", `origin/${base}...HEAD`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    emitDeny(
      host,
      `PR travada: não foi possível comparar o HEAD com \`origin/${base}\`. Rode \`git fetch origin ${base}\` e tente novamente.`,
    );
  }

  const loc = numstat
    .split("\n")
    .filter(Boolean)
    .reduce((sum, line) => {
      const [added, deleted] = line.split("\t");
      return sum + (added === "-" ? 0 : Number(added) + Number(deleted));
    }, 0);

  if (loc > MAX_PR_LOC) {
    emitDeny(
      host,
      `PR grande: ${loc} linhas (add+del) vs \`${base}\`, acima do teto de ${MAX_PR_LOC}. ` +
        `Antes de abrir, pergunte ao usuário: dividir em PRs menores (recomendado) vs seguir. ` +
        `Se mandar seguir, grave o ack e reexecute:\n` +
        `  git rev-parse HEAD > ${sizeAck}\n` +
        `O ack vale só pra este commit.`,
    );
  }
}

emitAllow(host);
