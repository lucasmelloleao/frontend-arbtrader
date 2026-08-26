import type { Route } from "next";

import { Zap } from "lucide-react";

import { LoginForm } from "@/features/auth/login-form";

/** Destino padrão pós-login. Rota canônica: o dashboard autenticado. */
const DESTINO_POS_LOGIN: Route = "/dashboard";

/**
 * Login. O `proxy.ts` manda pra cá quem não tem cookie de sessão.
 *
 * A rota é um Server Component fino: só compõe o card com o formulário. Toda a
 * interação (e a chamada browser-direct que faz o cookie do backend pousar)
 * vive no client component.
 */
export default function LoginPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Zap className="h-7 w-7 text-indigo-500" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-white">ArbTrade</h1>
          </div>
          <p className="text-slate-400">Bem-vindo de volta ao seu painel</p>
        </div>

        <LoginForm destino={DESTINO_POS_LOGIN} />
      </div>
    </main>
  );
}
