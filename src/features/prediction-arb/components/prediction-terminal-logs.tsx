"use client";

import { useEffect, useRef, useState } from "react";

import { Download, RefreshCw, Terminal } from "lucide-react";

import { buscarLogsPrediction } from "@/features/prediction-arb/prediction-arb.actions";

/** Regex de escape ANSI. */
const ANSI_ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[mK]`, "g");

/**
 * Terminal de logs do robô Polymarket (prediction-arb).
 * Liga/desliga, auto-refresh a cada 7s, seleção de linhas e download.
 */
export function PredictionTerminalLogs(): React.ReactNode {
  const [showLogs, setShowLogs] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState("TODOS");
  const [selectedCategory, setSelectedCategory] = useState("TODOS");
  const [logs, setLogs] = useState<{ id: number; texto: string }[]>([]);
  const nextLogId = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logLines, setLogLines] = useState(300);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MOEDAS = [
    { id: "TODOS", label: "🌐 Todos os Ativos" },
    { id: "btc", label: "₿ Bitcoin (BTC)" },
    { id: "eth", label: "Ξ Ethereum (ETH)" },
    { id: "sol", label: "◎ Solana (SOL)" },
    { id: "doge", label: "Ð Dogecoin (DOGE)" },
    { id: "xrp", label: "✕ XRP" },
  ];

  const CATEGORIAS = [
    { id: "TODOS", label: "📋 Todas as Etapas" },
    { id: "ORDEM", label: "🚀 Disparos & Ordens (Taker/Stop)" },
    { id: "RADAR", label: "⏳ Radar, Timing & Certeza" },
    { id: "SCAN", label: "🔍 Scan & Varredura" },
    { id: "RECONCILE", label: "🔁 Reconciliação & Sync" },
    { id: "ERRO", label: "🚨 Erros & Alertas" },
  ];

  const normalizar = (linhas: readonly string[]): { id: number; texto: string }[] =>
    linhas.map((linha) => ({ id: nextLogId.current++, texto: linha.replace(ANSI_ESCAPE, "") }));

  useEffect(() => {
    if (!showLogs) {
      return undefined;
    }
    let ativo = true;
    const buscar = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await buscarLogsPrediction(logLines, "prediction-arb");
        if (!ativo) return;
        setLoading(false);
        if (!resultado.ok) {
          setError(resultado.erro);
          return;
        }
        setLogs(normalizar(resultado.logs));
        setLastUpdate(new Date().toLocaleTimeString());
      } catch {
        if (!ativo) return;
        setLoading(false);
        setError("Não foi possível buscar os logs. O backend pode estar indisponível.");
      }
    };
    void buscar();
    return () => {
      ativo = false;
    };
  }, [logLines, showLogs]);

  useEffect(() => {
    if (!autoRefresh || !showLogs) {
      return undefined;
    }
    const buscar = async (): Promise<void> => {
      setLoading(true);
      try {
        const resultado = await buscarLogsPrediction(logLines, "prediction-arb");
        setLoading(false);
        if (!resultado.ok) {
          setError(resultado.erro);
          return;
        }
        setError(null);
        setLogs(normalizar(resultado.logs));
        setLastUpdate(new Date().toLocaleTimeString());
      } catch {
        setLoading(false);
        setError("Reconectando aos logs do backend...");
      }
    };
    const interval = setInterval(() => void buscar(), 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, logLines, showLogs]);

  // Aplica filtros de moeda e categoria de etapas
  const logsFiltrados = logs.filter((log) => {
    const txtLower = log.texto.toLowerCase();

    // Filtro por Ativo/Moeda
    if (selectedCoin !== "TODOS") {
      const coinLower = selectedCoin.toLowerCase();
      if (!txtLower.includes(coinLower)) return false;
    }

    // Filtro por Categoria/Etapa Operacional
    if (selectedCategory === "ORDEM") {
      return /🚀|Enviando Ordem|Cotações|Filled Size|EMERGENCY STOP|placeOrder/i.test(log.texto);
    }
    if (selectedCategory === "RADAR") {
      return /⏳|👀|RADAR DE TEMPO|RADAR ATIVO|BLOQUEIO DE PONTO DE CORTE|CORTE FINAL/i.test(
        log.texto,
      );
    }
    if (selectedCategory === "SCAN") {
      return /🔍|PREDICTION SCAN|Mercados avaliados/i.test(log.texto);
    }
    if (selectedCategory === "RECONCILE") {
      return /🔁|SYNC|Reconciliada|Batch Redeem|Mercado venceu/i.test(log.texto);
    }
    if (selectedCategory === "ERRO") {
      return /🚨|⚠️|🔒|ERROR|ERR|FATAL/i.test(log.texto);
    }

    return true;
  });

  useEffect(() => {
    if (containerRef.current !== null && showLogs) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, showLogs]);

  const download = (): void => {
    const blob = new Blob([logs.map((l) => l.texto).join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-polymarket-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-slate-950/70 p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Terminal className="h-5 w-5 text-indigo-400" aria-hidden="true" /> Logs do Robô
            Polymarket (Terminal)
          </h2>
          <button
            type="button"
            onClick={() => setShowLogs((v) => !v)}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all shadow ${
              showLogs
                ? "border border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                : "bg-emerald-500 font-extrabold text-slate-950 hover:bg-emerald-400"
            }`}
          >
            {showLogs ? "⏹️ Desligar Logs" : "⚡ Ligar Logs"}
          </button>
        </div>
      </div>

      {showLogs ? (
        <div className="flex h-[450px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filtro Moeda */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-400">Ativo:</span>
                <select
                  value={selectedCoin}
                  onChange={(e) => setSelectedCoin(e.target.value)}
                  className="rounded border border-indigo-500/30 bg-slate-950 px-2 py-1 font-mono text-xs font-bold text-indigo-300 outline-none focus:border-indigo-500"
                >
                  {MOEDAS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Etapa Operacional */}
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-400">Etapa:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded border border-indigo-500/30 bg-slate-950 px-2 py-1 font-mono text-xs font-bold text-indigo-300 outline-none focus:border-indigo-500"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setAutoRefresh((v) => !v)}
                className={`rounded border px-2 py-1 text-[10px] font-bold ${
                  autoRefresh
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700 bg-slate-800 text-slate-400"
                }`}
              >
                {autoRefresh ? "AUTO-REFRESH ON" : "PAUSADO"}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Linhas:</span>
                <select
                  value={logLines}
                  onChange={(e) => setLogLines(Number(e.target.value))}
                  className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-300 outline-none"
                >
                  {[150, 300, 500, 1000].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={download}
                disabled={logsFiltrados.length === 0}
                className="rounded border border-slate-700 bg-slate-800 p-1 text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
                title="Baixar arquivo de log"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              {lastUpdate !== null ? <span>Atualizado: {lastUpdate}</span> : null}
            </div>
          </div>

          <div
            ref={containerRef}
            className="flex-1 space-y-1 overflow-y-auto bg-black/85 p-4 font-mono text-xs text-slate-300"
          >
            {loading && logsFiltrados.length === 0 ? (
              <div className="flex items-center gap-2 p-4 text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" aria-hidden="true" />{" "}
                Buscando logs...
              </div>
            ) : error !== null ? (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-rose-400">
                ⚠️ {error}
              </div>
            ) : logsFiltrados.length === 0 ? (
              <div className="p-4 text-center italic text-slate-500">
                Nenhum log encontrado para o filtro selecionado ({selectedCoin} / {selectedCategory}
                ).
              </div>
            ) : (
              logsFiltrados.map((log, i) => {
                const isError = /ERROR|ERR|FATAL|🚨/.test(log.texto);
                const isWarn = /WARN|⚠️|⛔/.test(log.texto);
                const isSuccess = /SUCCESS|✅|🟢/.test(log.texto);
                const textColor = isError
                  ? "font-semibold text-rose-400"
                  : isWarn
                    ? "text-amber-300"
                    : isSuccess
                      ? "text-emerald-400"
                      : "text-slate-300";
                return (
                  <div
                    key={log.id}
                    className={`rounded px-1 py-0.5 hover:bg-slate-900/50 ${textColor}`}
                  >
                    <span className="mr-3 select-none text-slate-600">
                      {String(i + 1).padStart(3, " ")}
                    </span>
                    {log.texto}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-xs font-medium text-slate-500">
          Logs desligados. Clique em <b className="text-emerald-400">"⚡ Ligar Logs"</b> para
          visualizar os logs sem fazer requisições constantes.
        </div>
      )}
    </div>
  );
}
