import "server-only";

import { parseServerEnv, type ServerEnv } from "@/lib/env.schema";

/**
 * Env do servidor, validada uma vez por processo.
 *
 * `server-only` garante que importar isto de um Client Component quebra o build,
 * não o runtime: env de servidor nunca deve entrar no bundle do browser.
 */
export const serverEnv: ServerEnv = parseServerEnv(process.env);
