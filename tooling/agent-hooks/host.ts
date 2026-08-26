/**
 * I/O multi-host para agent hooks (Claude Code · Cursor · Codex).
 * Scripts vivem em tooling/agent-hooks/; cada host só aponta via seu JSON.
 */

export type AgentHost = "claude" | "cursor" | "commandcode";

export function detectHost(raw: Record<string, unknown>): AgentHost {
  if (process.env.COMMANDCODE_PROJECT_DIR || process.env.COMMANDCODE_SESSION_ID) {
    return "commandcode";
  }
  if (process.env.CURSOR_VERSION || process.env.CURSOR_PROJECT_DIR) {
    return "cursor";
  }
  if (process.env.AGENT_HOOK_SURFACE === "cursor") {
    return "cursor";
  }
  const event = raw.hook_event_name;
  if (typeof event === "string" && event.length > 0 && event[0] === event[0]?.toLowerCase()) {
    return "cursor";
  }
  // Claude Code e Codex compartilham o contrato hookSpecificOutput.
  return "claude";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function readHookInput(): Promise<{
  host: AgentHost;
  raw: Record<string, unknown>;
}> {
  const text = await Bun.stdin.text();
  let parsed: unknown = {};
  if (text.trim()) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { __invalid_json: true };
    }
  }
  const raw = isRecord(parsed) ? parsed : { __invalid_json: true };
  return { host: detectHost(raw), raw };
}

/**
 * Remove o corpo dos heredocs com delimitador entre aspas (`<<'EOF' … EOF`),
 * que o shell trata como dado literal, não como comando.
 *
 * Sem isso, escrever um arquivo cujo conteúdo MENCIONA um comando faz os guards
 * dispararem: um doc que explica `gh pr create` travaria a própria escrita do
 * doc. Só o delimitador entre aspas é removido — heredoc sem aspas expande
 * variáveis e substituição de comando, então ali ainda pode haver execução real.
 */
function stripQuotedHeredocBodies(command: string): string {
  return command.replace(
    /<<-?\s*(['"])([A-Za-z_][A-Za-z0-9_]*)\1[\s\S]*?^\s*\2\s*$/gm,
    "<<HEREDOC",
  );
}

/**
 * Shell: Cursor manda `command` no topo; Claude/Codex em tool_input.command.
 * O corpo de heredoc literal é removido — ver `stripQuotedHeredocBodies`.
 */
export function readShellCommand(raw: Record<string, unknown>): string | undefined {
  if (typeof raw.command === "string") {
    return stripQuotedHeredocBodies(raw.command);
  }
  const toolInput = isRecord(raw.tool_input) ? raw.tool_input : {};
  if (typeof toolInput.command === "string") {
    return stripQuotedHeredocBodies(toolInput.command);
  }
  return undefined;
}

export function isShellEvent(raw: Record<string, unknown>): boolean {
  const toolName = typeof raw.tool_name === "string" ? raw.tool_name : "";
  if (
    toolName === "Bash" ||
    toolName === "Shell" ||
    toolName === "shell_command" ||
    toolName === "monitor_command"
  ) {
    return true;
  }
  // Cursor beforeShellExecution: sem tool_name, só command.
  return typeof raw.command === "string";
}

export function readEditedFilePath(raw: Record<string, unknown>): string {
  if (typeof raw.file_path === "string") {
    return raw.file_path;
  }
  const toolInput = isRecord(raw.tool_input) ? raw.tool_input : {};
  if (typeof toolInput.file_path === "string") {
    return toolInput.file_path;
  }
  if (typeof toolInput.path === "string") {
    return toolInput.path;
  }
  const command = typeof toolInput.command === "string" ? toolInput.command : "";
  const updateMatch = command.match(/\*\*\*\s+(?:Update|Add)\s+File:\s+(.+)/);
  if (updateMatch?.[1]) {
    return updateMatch[1].trim();
  }
  const plusMatch = command.match(/^\+\+\+\s+[ab]\/(.+)$/m);
  if (plusMatch?.[1]) {
    return plusMatch[1].trim();
  }
  return "";
}

export function isWriteEvent(raw: Record<string, unknown>): boolean {
  const toolName = typeof raw.tool_name === "string" ? raw.tool_name : "";
  if (
    toolName === "Edit" ||
    toolName === "Write" ||
    toolName === "apply_patch" ||
    toolName === "TabWrite" ||
    toolName === "edit_file" ||
    toolName === "write_file"
  ) {
    return true;
  }
  // Cursor afterFileEdit: file_path no topo, sem tool_name.
  return typeof raw.file_path === "string";
}

export function isStopHookActive(raw: Record<string, unknown>): boolean {
  return raw.stop_hook_active === true;
}

export function emitAdditionalContext(
  host: AgentHost,
  eventName: string,
  additionalContext: string,
  extra?: Record<string, unknown>,
): never {
  if (host === "cursor") {
    process.stdout.write(
      JSON.stringify({ additional_context: additionalContext, ...extra }) + "\n",
    );
    process.exit(0);
  }
  // Claude, Codex e Command Code compartilham o contrato hookSpecificOutput.
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext,
      },
      ...extra,
    }) + "\n",
  );
  process.exit(0);
}

export function emitDeny(host: AgentHost, reason: string): never {
  if (host === "cursor") {
    process.stdout.write(
      JSON.stringify({
        permission: "deny",
        user_message: reason,
        agent_message: reason,
      }) + "\n",
    );
    process.exit(0);
  }
  // Claude, Codex e Command Code compartilham o contrato hookSpecificOutput.
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }) + "\n",
  );
  process.exit(0);
}

export function emitAllow(host: AgentHost): never {
  if (host === "cursor") {
    process.stdout.write(JSON.stringify({ permission: "allow" }) + "\n");
  }
  process.exit(0);
}

export function emitStopOk(): never {
  process.stdout.write("{}\n");
  process.exit(0);
}

export function emitStopContinue(host: AgentHost, reason: string): never {
  if (host === "cursor") {
    process.stdout.write(JSON.stringify({ followup_message: reason }) + "\n");
    process.exit(0);
  }
  // Claude, Codex e Command Code: exit 2 + stderr bloqueia o turno (Stop).
  process.stderr.write("Stop blocked: bun run verify:fast failed.\n");
  process.exit(2);
}
