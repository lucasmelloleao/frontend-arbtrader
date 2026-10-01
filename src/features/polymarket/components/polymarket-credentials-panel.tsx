"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  CheckCircle2,
  Key,
  Loader2,
  Lock,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";

import {
  deployDepositWalletPolymarket,
  salvarCredenciaisPolymarket,
  sincronizarHistoricoPolymarket,
  sincronizarSaldoPolymarket,
  transferirPusdPolymarket,
} from "../polymarket.actions";

export type PolymarketKeyInfo = {
  eoa?: string;
  apiKey?: string;
  relayerApiKey?: string;
  depositWallet?: string;
  clobApiKey?: string;
  pusdBalance?: number;
  connected?: boolean;
};

type PolymarketCredentialsPanelProps = {
  initialData?: PolymarketKeyInfo;
  onRefresh?: () => void;
};

function extrairSaldo(dados: unknown): { eoa: number; dw: number } | null {
  if (dados === null || typeof dados !== "object") return null;
  const entradas = Object.entries(dados);
  const acha = (chave: string): number => {
    const par = entradas.find(([k]) => k === chave);
    const valor = par ? par[1] : 0;
    return typeof valor === "number" ? valor : Number(valor ?? 0);
  };
  if (!("eoaBalance" in dados) && !("depositWalletBalance" in dados)) return null;
  return { eoa: acha("eoaBalance"), dw: acha("depositWalletBalance") };
}

export function PolymarketCredentialsPanel({
  initialData,
  onRefresh,
}: PolymarketCredentialsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(!initialData);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const [eoa, setEoa] = useState(initialData?.eoa || initialData?.apiKey || "");
  const [relayerApiKey, setRelayerApiKey] = useState(initialData?.relayerApiKey ?? "");
  const [depositWallet, setDepositWallet] = useState(initialData?.depositWallet ?? "");
  const [clobApiKey, setClobApiKey] = useState(initialData?.clobApiKey ?? "");
  const [clobSecret, setClobSecret] = useState("");
  const [clobPassphrase, setClobPassphrase] = useState("");
  const [eoaPrivateKey, setEoaPrivateKey] = useState("");
  const [editEoa, setEditEoa] = useState(false);
  const [amount, setAmount] = useState("");
  const [saldo, setSaldo] = useState<{ eoa?: number; dw?: number } | null>(
    initialData?.pusdBalance !== undefined ? { dw: initialData.pusdBalance } : null,
  );

  useEffect(() => {
    if (!initialData) {
      fetch("/api/v1/polymarket/key-info")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setEoa(data.eoa || data.apiKey || "");
            setRelayerApiKey(data.relayerApiKey || "");
            setDepositWallet(data.depositWallet || "");
            setClobApiKey(data.clobApiKey || "");
            if (data.pusdBalance !== undefined) {
              setSaldo({ dw: Number(data.pusdBalance) });
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [initialData]);

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
        if (onRefresh) onRefresh();
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
          apiKey: eoa || undefined,
          apiSecret: eoaPrivateKey || undefined,
          relayerApiKey,
          depositWallet,
          clobApiKey,
          clobSecret,
          clobPassphrase,
        }),
      "Credenciais salvas com sucesso!",
    );
  };

  const transferir = (): void => {
    const valor = amount ? Number(amount) : undefined;
    if (
      !confirm(
        `Confirma a transferência de ${
          valor ? `${valor} pUSD` : "todo o saldo pUSD"
        } da wallet EOA para a deposit wallet? O gas é pago em POL/MATIC da EOA.`,
      )
    ) {
      return;
    }
    executar(() => transferirPusdPolymarket(valor), "Transferência enviada com sucesso!");
  };

  const displayEoa = eoa && eoa.length >= 12 ? `${eoa.slice(0, 8)}...${eoa.slice(-4)}` : eoa || "0xNãoConfigurada";

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-md">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black tracking-tight text-white">Polymarket</h3>
            <span className="rounded-md border border-purple-500/30 bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-purple-400">
              POLYMARKET
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditEoa(!editEoa)}
              className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:border-purple-500/40 hover:text-white transition-all"
              title="Editar Chave EOA"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between font-mono text-xs">
          <p className="text-slate-400">
            Chave: <span className="text-slate-200">{displayEoa}</span>
          </p>
        </div>

        {editEoa && (
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 text-xs space-y-2 animate-in fade-in slide-in-from-top-2">
            <p className="font-bold text-purple-300">Configurar Carteira Signer (EOA):</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Endereço EOA (0x...)</label>
                <input
                  type="text"
                  value={eoa}
                  onChange={(e) => setEoa(e.target.value)}
                  placeholder="0x..."
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Chave Privada EOA</label>
                <input
                  type="password"
                  value={eoaPrivateKey}
                  onChange={(e) => setEoaPrivateKey(e.target.value)}
                  placeholder="Private Key (armazenada com criptografia AES-256-GCM)"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="flex items-center gap-1.5 font-medium text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Conectada
          </span>
          <span className="flex items-center gap-1 font-mono text-emerald-400">
            <Lock className="h-3 w-3" />
            Segredo Criptografado
          </span>
        </div>
      </div>

      {/* Inner Depósito e Credenciais Box */}
      <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-indigo-400" aria-hidden="true" />
          <h5 className="text-sm font-bold text-white tracking-wide">Polymarket — Depósito e Credenciais</h5>
        </div>

        {mensagem !== null && (
          <div
            className={`mb-3 flex items-center gap-2 rounded-lg p-2.5 text-xs font-semibold ${
              mensagem.tipo === "ok"
                ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                : "border border-rose-500/30 bg-rose-500/15 text-rose-300"
            }`}
          >
            {mensagem.tipo === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {mensagem.texto}
          </div>
        )}

        {/* Saldo and Signer info */}
        <div className="mb-3 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Wallet EOA (signer)</span>
            <span className="font-mono text-slate-300">{displayEoa}</span>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
            <span className="text-slate-400">Saldo pUSD (deposit wallet)</span>
            <span className="font-mono text-sm font-bold text-emerald-400">
              {saldo?.dw !== undefined ? `$${saldo.dw.toFixed(2)}` : "$0.00"}
            </span>
          </div>

          {saldo?.eoa !== undefined && (
            <div className="mt-1 flex items-center justify-between text-slate-400">
              <span>Saldo pUSD (na carteira EOA)</span>
              <span className="font-mono text-xs text-slate-300">${saldo.eoa.toFixed(2)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => executar(() => sincronizarSaldoPolymarket(), "Saldo sincronizado on-chain!")}
            disabled={isPending}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Sincronizar saldo
          </button>
        </div>

        {/* Campos de credenciais */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              RELAYER API KEY
            </span>
            <input
              type="text"
              value={relayerApiKey}
              onChange={(e) => setRelayerApiKey(e.target.value)}
              placeholder="01a058a2-b7fa-747a-8de8-..."
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              DEPOSIT WALLET (0X...)
            </span>
            <input
              type="text"
              value={depositWallet}
              onChange={(e) => setDepositWallet(e.target.value)}
              placeholder="0x82d51169a7af..."
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CLOB API KEY
            </span>
            <input
              type="text"
              value={clobApiKey}
              onChange={(e) => setClobApiKey(e.target.value)}
              placeholder="Credencial L2 do CLOB"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CLOB SECRET
            </span>
            <input
              type="password"
              value={clobSecret}
              onChange={(e) => setClobSecret(e.target.value)}
              placeholder="Secret (criptografado no backend)"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CLOB PASSPHRASE
            </span>
            <input
              type="password"
              value={clobPassphrase}
              onChange={(e) => setClobPassphrase(e.target.value)}
              placeholder="Passphrase (criptografado no backend)"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={salvar}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/20 transition-all hover:bg-purple-500 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            Salvar Credenciais
          </button>
          <button
            type="button"
            onClick={() =>
              executar(() => deployDepositWalletPolymarket(), "Deploy da deposit wallet enviado!")
            }
            disabled={isPending}
            className="rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50"
            title="Cria a deposit wallet via relayer (se ainda não existir)"
          >
            Deploy Deposit Wallet
          </button>
          <button
            type="button"
            onClick={() =>
              executar(() => sincronizarHistoricoPolymarket(), "Histórico sincronizado com sucesso!")
            }
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-50"
            title="Importa as operações reais da Polymarket para o painel"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Sincronizar Histórico
          </button>
        </div>

        {/* Transferência para a Polymarket */}
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-indigo-500/20 pt-4">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              VALOR (PUSD) — VAZIO = SALDO TOTAL
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0}
              placeholder="Ex: 10"
              className="mt-1 w-36 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white placeholder-slate-600 outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </label>
          <button
            type="button"
            onClick={transferir}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
            )}
            Transferir para a Polymarket
          </button>
        </div>
      </div>
    </div>
  );
}
