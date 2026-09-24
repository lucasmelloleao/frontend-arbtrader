"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal, RefreshCw, Power, Trash2, Download, Clock } from "lucide-react";
import { buscarLogsIcMarkets } from "@/features/icmarkets/icmarkets.actions";

export function IcMarketsTerminalLogs(): React.ReactNode {
  const [showLogs, setShowLogs] = useState(true);
  const [logs, setLogs] = useState<readonly string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [linhasLimite, setLinhasLimite] = useState(150);
  const [ultimoUpdate, setUltimoUpdate] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const carregarLogs = async (): Promise<void> => {
    setCarregando(true);
    const res = await buscarLogsIcMarkets();
    if (res.ok) {
      setLogs(res.logs.slice(-linhasLimite));
      setUltimoUpdate(new Date().toLocaleTimeString("pt-BR"));
    }
    setCarregando(false);
  };

  // Auto-scroll para a última linha quando novos logs chegam
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Efeito de polling contínuo quando logs estão ligados
  useEffect(() => {
    if (!showLogs) return undefined;

    let ativo = true;
    const atualizar = async (): Promise<void> => {
      const res = await buscarLogsIcMarkets();
      if (ativo && res.ok) {
        setLogs(res.logs.slice(-linhasLimite));
        setUltimoUpdate(new Date().toLocaleTimeString("pt-BR"));
      }
    };

    void atualizar();

    if (!autoRefresh) return undefined;

    const interval = setInterval(() => {
      void atualizar();
    }, 3000);

    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, [showLogs, autoRefresh, linhasLimite]);

  const limparLogs = (): void => {
    setLogs([]);
  };

  const baixarLogs = (): void => {
    if (logs.length === 0) return;
    const blob = new Blob([logs.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `icmarkets_logs_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl">
      {/* Barra de Ferramentas Superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Console de Execução & Processamento do Robô
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  showLogs
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    showLogs ? "animate-pulse bg-emerald-400" : "bg-slate-500"
                  }`}
                />
                {showLogs ? "LOGS ATIVOS (3s)" : "PAUSADO"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              IC Markets cTrader HFT Engine • 4 Gates (VR, Kaufman ER, Spread & IA Meta-Labeler)
            </p>
          </div>
        </div>

        {/* Controles: Ligar/Desligar, Auto-refresh, Limite, Limpar, Download */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              showLogs
                ? "border border-rose-500/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                : "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {showLogs ? "Desligar Logs" : "Ligar Logs"}
          </button>

          {showLogs && (
            <>
              <button
                type="button"
                onClick={carregarLogs}
                disabled={carregando}
                title="Atualizar agora"
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <RefreshCw
                  className={`h-3 w-3 ${carregando ? "animate-spin text-cyan-400" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                  autoRefresh
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                    : "border-slate-800 bg-slate-900 text-slate-400"
                }`}
              >
                Auto: {autoRefresh ? "3s" : "Off"}
              </button>

              <select
                value={linhasLimite}
                onChange={(e) => setLinhasLimite(Number(e.target.value))}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300"
                title="Número de linhas"
              >
                <option value={50}>50 linhas</option>
                <option value={150}>150 linhas</option>
                <option value={300}>300 linhas</option>
                <option value={500}>500 linhas</option>
              </select>

              <button
                type="button"
                onClick={limparLogs}
                title="Limpar tela"
                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={baixarLogs}
                disabled={logs.length === 0}
                title="Baixar arquivo de logs"
                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-cyan-400 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Janela do Terminal */}
      <div
        ref={containerRef}
        className="mt-3 h-72 overflow-y-auto rounded-lg border border-slate-900 bg-black/85 p-3.5 font-mono text-[11px] leading-relaxed text-slate-300 shadow-inner"
      >
        {!showLogs ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
            <Power className="h-6 w-6 text-slate-600" />
            <p>Os logs em tempo real estão desligados.</p>
            <button
              type="button"
              onClick={() => setShowLogs(true)}
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-500"
            >
              Ligar Logs
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-slate-600" />
            <p>Conectando ao motor IC Markets cTrader e coletando emissões de ciclo...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((linha, index) => {
              const isError =
                linha.includes("❌") || linha.includes("Erro") || linha.includes("Falha");
              const isWarn =
                linha.includes("⚠️") || linha.includes("Veto") || linha.includes("Aviso");
              const isSuccess =
                linha.includes("🚀") ||
                linha.includes("🎯") ||
                linha.includes("APROV") ||
                linha.includes("Elegível") ||
                linha.includes("TAKE PROFIT");
              const isScan =
                linha.includes("📡") || linha.includes("🔍") || linha.includes("SCANNER");

              let cor = "text-slate-300";
              if (isError) cor = "text-rose-400 font-semibold bg-rose-950/20 px-1 rounded";
              else if (isWarn) cor = "text-amber-400 bg-amber-950/20 px-1 rounded";
              else if (isSuccess)
                cor = "text-emerald-400 font-semibold bg-emerald-950/20 px-1 rounded";
              else if (isScan) cor = "text-cyan-300";

              return (
                <div key={`${linha}-${index}`} className={`${cor} whitespace-pre-wrap font-mono`}>
                  {linha}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rodapé de Status */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Última atualização: {ultimoUpdate || "Aguardando..."}</span>
        </div>
        <div>
          <span>Exibindo {logs.length} linhas de processamento</span>
        </div>
      </div>
    </div>
  );
}
