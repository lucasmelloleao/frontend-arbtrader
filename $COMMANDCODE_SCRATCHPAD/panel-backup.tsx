"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ArrowDownToLine, Loader2, RefreshCw, Save, Wallet } from "lucide-react";

import {
  deployDepositWalletPolymarket,
  salvarCredenciaisPolymarket,
  sincronizarSaldoPolymarket,
  transferirPusdPolymarket,
} from "@/features/exchanges/polymarket.actions";

type PolymarketPanelProps = {
  /** Endereço da wallet EOA (apiKey da ExchangeKey polymarket). */
  eoa: string;
  /** Credenciais já salvas (mascaradas). */
  credenciais: {
    relayerApiKey?: string;
    depositWallet?: string;
    clobApiKey?: string;
    pusdBalance?: number;
  };
};

/** Extrai { eoa, dw } de um objeto desconhecido, com narrowing real (sem `as`). */
function extrairSaldo(dados: unknown): { eoa: number; dw: number } | null {
  if (dados === null || typeof dados !== "object") return null;
  const entradas = Object.entries(dados);
  const acha = (chave: string): number => {
    const par = entradas.find(([k]) => k === chave);
    const valor = par ? par[1] : 0;
    return typeof valor === "number" ? valor : Number(valor ?? 0);
  };
  if (!("eoaBalance" in dados)) return null;
  return { eoa: acha("eoaBalance"), dw: acha("depositWalletBalance") };
}

/**
 * Painel de gestão Polymarket: credenciais de automação, saldo pUSD e
 * transferência da wallet EOA para a deposit wallet.
 */
export function PolymarketPanel({ eoa, credenciais }: PolymarketPanelProps): React.ReactNode {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const [relayerApiKey, setRelayerApiKey] = useState(credenciais.relayerApiKey ?? "");
  const [depositWallet, setDepositWallet] = useState(credenciais.depositWallet ?? "");
  const [clobApiKey, setClobApiKey] = useState(credenciais.clobApiKey ?? "");
  const [clobSecret, setClobSecret] = useState("");
  const [clobPassphrase, setClobPassphrase] = useState("");
  const [amount, setAmount] = useState("");
  const [saldo, setSaldo] = useState<{ eoa?: number; dw?: number } | null>(null);

  const executar = (
    acao: () => Promise<{ ok: boolean; erro?: string; data?: unknown }>,
    sucesso: string,
  ): void => {
    setMensagem(null);
    startTransition(async () => {
      const res = await acao();
      if (res.ok) {
        setMensagem({ tipo: "ok", texto: sucesso });
        const saldoInfo = extrairSaldo(res.data);
        if (saldoInfo !== null) setSaldo(saldoInfo);
        router.refresh();
      } else {
        setMensagem({ tipo: "erro", texto: res.erro ?? "Erro desconhecido" });
      }
    });
  };

  const salvar = (): void => {
    executar(
      () =>
        salvarCredenciaisPolymarket({
          relayerApiKey,
          depositWallet,
          clobApiKey,
          clobSecret,
          clobPassphrase,
        }),
      "Credenciais salvas!",
    );
  };

  const transferir = (): void => {
    const valor = amount ? Number(amount) : undefined;
    if (
      !confirm("Transferir pUSD da wallet EOA para a deposit wallet? O gas é pago em MATIC da EOA.")
    )
      return;
    executar(() => transferirPusdPolymarket(valor), "Transferência enviada!");
  };

  return (
    <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Wallet className="h-4 w-4 text-indigo-400" aria-hidden="true" />
        <h5 className="text-sm font-bold text-white">Polymarket — Depósito e Credenciais</h5>
      </div>

      {mensagem !== null ? (
        <div
          className={`mb-3 rounded-lg p-2.5 text-xs font-semibold ${
            mensagem.tipo === "ok"
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-rose-500/15 text-rose-300"
          }`}
        >
          {mensagem.texto}
        </div>
      ) : null}

      <div className="mb-3 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Wallet EOA (signer)</span>
          <span className="font-mono text-slate-300">
            {eoa.slice(0, 8)}...{eoa.slice(-4)}
          </span>
        </div>
        {saldo !== null ? (
          <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
            <span className="text-slate-400">Saldo pUSD</span>
            <span className="font-mono font-bold text-emerald-400">
              EOA: ${saldo.eoa?.toFixed(2) ?? "—"} | Deposit: ${saldo.dw?.toFixed(2) ?? "—"}
            </span>
          </div>
        ) : credenciais.pusdBalance !== undefined ? (
          <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
            <span className="text-slate-400">Saldo pUSD (deposit wallet)</span>
            <span className="font-mono font-bold text-emerald-400">
              ${credenciais.pusdBalance.toFixed(2)}
            </span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => executar(() => sincronizarSaldoPolymarket(), "Saldo sincronizado!")}
          disabled={isPending}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
          )}
          Sincronizar saldo
        </button>
      </div>

      {/* Campos de credenciais */}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-bold uppercase text-slate-400">Relayer API Key</span>
          <input
            type="text"
            value={relayerApiKey}
            onChange={(e) => setRelayerApiKey(e.target.value)}
            placeholder="UUID da relayer key (Settings → API Keys)"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Deposit Wallet (0x...)
          </span>
          <input
            type="text"
            value={depositWallet}
            onChange={(e) => setDepositWallet(e.target.value)}
            placeholder="Endereço da deposit wallet"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase text-slate-400">CLOB API Key</span>
          <input
            type="text"
            value={clobApiKey}
            onChange={(e) => setClobApiKey(e.target.value)}
            placeholder="Credencial L2 do CLOB"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase text-slate-400">CLOB Secret</span>
          <input
            type="password"
            value={clobSecret}
            onChange={(e) => setClobSecret(e.target.value)}
            placeholder="Secret (criptografado no backend)"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase text-slate-400">CLOB Passphrase</span>
          <input
            type="password"
            value={clobPassphrase}
            onChange={(e) => setClobPassphrase(e.target.value)}
            placeholder="Passphrase (criptografado no backend)"
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" aria-hidden="true" /> Salvar Credenciais
        </button>
        <button
          type="button"
          onClick={() =>
            executar(() => deployDepositWalletPolymarket(), "Deploy da deposit wallet enviado!")
          }
          disabled={isPending}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-50"
          title="Cria a deposit wallet via relayer (se ainda não existir)"
        >
          Deploy Deposit Wallet
        </button>
      </div>

      {/* Transferência */}
      <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-indigo-500/20 pt-3">
        <label className="block">
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Valor (pUSD) — vazio = saldo total
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={0}
            placeholder="Ex: 10"
            className="mt-1 w-32 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-indigo-500"
          />
        </label>
        <button
          type="button"
          onClick={transferir}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Transferir para a Polymarket
        </button>
      </div>
    </div>
  );
}
