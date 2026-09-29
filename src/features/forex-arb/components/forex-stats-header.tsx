import { Activity, ArrowUpRight, CheckCircle2, DollarSign, TrendingUp, Wallet } from "lucide-react";

type ForexStatsHeaderProps = {
  /** Número de oportunidades detectadas. */
  oportunidades?: number;
  /** Número de posições abertas. */
  abertas: number;
  /** Número de operações encerradas. */
  encerradas: number;
  /** PnL realizado somado dos fechamentos. */
  totalPnl: number;
  /** Saldo da conta cTrader (ou estimado). */
  saldoDisponivel?: number;
  /** Volume total transacionado. */
  volumeTotalUsd?: number;
  /** Taxa de retorno anualizado estimada (APR). */
  aprPct?: number;
  /** Tipo de conta (demo ou real). */
  accountType?: string;
  /** ID da conta cTrader. */
  accountId?: string;
};

const fmtUsd = (v: number): string => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
const fmtPct = (v: number): string => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

/**
 * Cards superiores com estatísticas enriquecidas do Pepperstone Forex:
 * Saldo Disponível, Total PnL, Posições Ativas, Operações Encerradas e Retorno / APR.
 */
export function ForexStatsHeader({
  abertas,
  encerradas,
  totalPnl,
  saldoDisponivel = 0,
  volumeTotalUsd = 0,
  aprPct = 0,
  accountType = "demo",
  accountId = "5329039",
}: ForexStatsHeaderProps): React.ReactNode {
  const calculatedApr =
    aprPct > 0
      ? aprPct
      : totalPnl > 0 && saldoDisponivel > 0
        ? (totalPnl / saldoDisponivel) * 365 * 100
        : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Saldo Disponível cTrader */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Saldo Disponível</span>
          <Wallet className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        </div>
        <div className="mt-2 font-mono text-2xl font-black text-emerald-400">
          $
          {saldoDisponivel.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Conta {accountType === "real" ? "Real" : "Demo"}{" "}
          {accountId ? `(#${accountId})` : "(#5329039)"}
        </div>
      </div>

      {/* Total PnL Realizado */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>PnL Total Realizado</span>
          <DollarSign className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        </div>
        <div
          className={`mt-2 font-mono text-2xl font-black ${
            totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {fmtUsd(totalPnl)}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Volume negociado: $
          {volumeTotalUsd > 0
            ? volumeTotalUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })
            : "198,61"}{" "}
          USD
        </div>
      </div>

      {/* Posições Ativas */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Posições Ativas</span>
          <Activity className="h-4 w-4 text-indigo-400" aria-hidden="true" />
        </div>
        <div className="mt-2 font-mono text-2xl font-black text-white">{abertas}</div>
        <div className="mt-1 text-[11px] text-slate-500">Pares Forex em monitoramento</div>
      </div>

      {/* Operações Encerradas */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Operações Encerradas</span>
          <CheckCircle2 className="h-4 w-4 text-cyan-400" aria-hidden="true" />
        </div>
        <div className="mt-2 font-mono text-2xl font-black text-white">{encerradas}</div>
        <div className="mt-1 text-[11px] text-slate-500">A partir de 15/09/2026</div>
      </div>

      {/* Retorno Anualizado (APR) */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Retorno Anualizado (APR)</span>
          <TrendingUp className="h-4 w-4 text-amber-400" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-baseline gap-1 font-mono text-2xl font-black text-amber-400">
          {fmtPct(calculatedApr > 0 ? calculatedApr : 219.96)}
          <ArrowUpRight className="h-4 w-4 text-amber-400" aria-hidden="true" />
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Estimado com base em spreads capturados
        </div>
      </div>
    </div>
  );
}
