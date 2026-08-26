/**
 * PreToolUse Bash / beforeShellExecution — guarda única de shell.
 *
 * Duas famílias, na ordem: comando destrutivo/perigoso (irreversível ou vazando
 * segredo) e commit/push em branch protegida. Um hook só porque é o mesmo evento
 * e o mesmo parsing; separar em dois seria duplicar leitura de stdin por comando.
 */

import { execFileSync } from "node:child_process";
import { emitAllow, emitDeny, isShellEvent, readHookInput, readShellCommand } from "./host.ts";

const PROTECTED = ["main", "release", "staging", "develop"];

/**
 * Padrões irreversíveis ou que escalam privilégio. O objetivo é barrar o caminho
 * óbvio, não construir um sandbox — quem quer burlar consegue, mas o agente não
 * erra por descuido.
 *
 * `rm -rf` é ancorado no ALVO, não em substring: `rm -rf /` casaria dentro de
 * `rm -rf /home/user/projeto/dist`, bloqueando um comando legítimo. Só alvo raiz
 * (`/`), home (`~`) e o coringa (`*`) — sozinhos ou com barra final — entram.
 */
const DESTRUCTIVE: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  {
    pattern: /\brm\s+(?:-[a-zA-Z]+\s+)*(?:\/|~|\*)\/?(?:\s|$)/,
    label: "rm no diretório raiz/home",
  },
  { pattern: /\bgit\s+reset\s+--hard\b/, label: "git reset --hard" },
  { pattern: /\bgit\s+clean\s+-[a-zA-Z]*f/, label: "git clean -f" },
  { pattern: /(?:^|[|;&]\s*)sudo\s/, label: "sudo" },
  { pattern: /\bchmod\s+(?:-[a-zA-Z]+\s+)*777\b/, label: "chmod 777" },
];

/** Leitura de env real (`.env`, `.env.local`); `.env.example` é template versionado. */
const READS_REAL_ENV = /\b(?:cat|less|more|head|tail|bat)\s+[^|;&]*\.env(?!\.example)\b/;

/** `git push --force` / `-f` sem `--force-with-lease` / `--force-if-includes`. */
const UNSAFE_FORCE_PUSH = /\bgit\s+push\b[^|;&]*(?:--force(?:\s|$)|\s-f(?:\s|$))/;
const SAFE_FORCE_FLAGS = /--force-with-lease|--force-if-includes/;

/** Download canalizado direto pra shell (`curl … | bash`). */
const PIPE_TO_SHELL = /\b(?:curl|wget)\b[^|]*\|[^|]*\b(?:bash|sh|zsh)\b/;

const { host, raw } = await readHookInput();

if (raw.__invalid_json === true) {
  emitDeny(
    host,
    "Comando bloqueado: o shell guard recebeu JSON inválido. Reexecute o comando; se persistir, verifique a configuração de hooks do host.",
  );
}

if (!isShellEvent(raw)) {
  if (raw.hook_event_name === "beforeShellExecution") {
    emitDeny(
      host,
      "Comando bloqueado: a entrada do hook precisa conter o comando shell como string.",
    );
  }
  emitAllow(host);
}

const command = readShellCommand(raw);
if (typeof command !== "string") {
  emitDeny(
    host,
    "Comando bloqueado: a entrada do hook precisa conter o comando shell como string.",
  );
}

// ── 1. Destrutivo / vazamento ──────────────────────────────────────────────
const destructive = DESTRUCTIVE.find(({ pattern }) => pattern.test(command));
if (destructive) {
  emitDeny(host, `Comando bloqueado: casa padrão destrutivo \`${destructive.label}\`.`);
}

if (READS_REAL_ENV.test(command)) {
  emitDeny(
    host,
    "Comando bloqueado: leitura de arquivo `.env` real (segredo). Use `.env.example` pra ver as chaves esperadas.",
  );
}

if (UNSAFE_FORCE_PUSH.test(command) && !SAFE_FORCE_FLAGS.test(command)) {
  emitDeny(host, "Comando bloqueado: `git push --force`. Use `--force-with-lease`.");
}

if (PIPE_TO_SHELL.test(command)) {
  emitDeny(
    host,
    "Comando bloqueado: download canalizado pra shell (`curl … | bash`). Baixe, leia e só então execute.",
  );
}

// ── 2. Branch protegida ────────────────────────────────────────────────────
const isCommit = /\bgit\s+commit\b/.test(command);
const isPush = /\bgit\s+push\b/.test(command);

if (!isCommit && !isPush) {
  emitAllow(host);
}

/**
 * Fora de um repositório git não existe branch a proteger — `git commit`/`push`
 * já falhariam sozinhos. Deixa passar em vez de estourar (o comprador roda o
 * agente antes do `git init`).
 */
function currentBranch(): string {
  try {
    // `branch --show-current` (não `rev-parse --abbrev-ref HEAD`) porque funciona
    // em branch órfã: no repo recém-inicializado, o PRIMEIRO commit ainda cai na
    // `main` e precisa ser barrado — e ali o `rev-parse` falha.
    return execFileSync("git", ["branch", "--show-current"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

const pushArgs = isPush ? command.replace(/\bgit\s+push\b/, "") : "";
const pushTargetsProtected =
  isPush &&
  PROTECTED.some((protectedBranch) => new RegExp(`\\b${protectedBranch}\\b`).test(pushArgs));
const branch = currentBranch();

if (pushTargetsProtected || PROTECTED.includes(branch)) {
  emitDeny(
    host,
    `Proibido commitar/pushar direto em branch protegida (${PROTECTED.join("/")}) ` +
      `— ver AGENTS.md e a seção "Branch base" do CLAUDE.md. Branch atual: \`${branch || "desconhecida"}\`. ` +
      `Features entram via PR: crie/use uma branch de feature e abra PR com base na \`main\`.`,
  );
}

emitAllow(host);
