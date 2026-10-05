"use client";

import { useState } from "react";
import { Search, Scale, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { kyClient } from "@/lib/api/ky.client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface MovimentoTJPR {
  nome: string;
  data?: string;
  complementos?: string;
}

interface ProcessoTJPR {
  numeroProcesso: string;
  grau?: string;
  sistema?: string;
  classe?: string;
  orgaoJulgador?: string;
  assuntos?: string;
  movimentos?: MovimentoTJPR[];
}

interface ApiResponseTJPR {
  success: boolean;
  message?: string;
  processos?: ProcessoTJPR[];
  data?: ProcessoTJPR;
}

export function ConsultaProcessoTJPRPanel(): React.ReactNode {
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [listaProcessos, setListaProcessos] = useState<ProcessoTJPR[]>([]);
  const [selecionadoIndex, setSelecionadoIndex] = useState(0);

  const buscarProcesso = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!numeroProcesso.trim()) return;

    setLoading(true);
    setErro(null);
    setListaProcessos([]);
    setSelecionadoIndex(0);

    try {
      const res = await kyClient
        .post(API_ENDPOINTS.processoTJPR, {
          json: { numeroProcesso: numeroProcesso.trim() },
        })
        .json<ApiResponseTJPR>();

      if (!res.success) {
        setErro(res.message ?? "Não foi possível localizar os processos.");
        return;
      }

      const procs = res.processos ?? (res.data ? [res.data] : []);
      if (procs.length === 0) {
        setErro("Nenhum processo foi encontrado no TJPR com este trecho ou número.");
        return;
      }

      setListaProcessos(procs);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro de conexão ao consultar a base do TJPR/Datajud.";
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  const resultado = listaProcessos[selecionadoIndex] ?? null;

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-slate-900 p-6 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/20 p-2.5">
          <Scale className="h-6 w-6 text-indigo-400" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Consulta Processual TJPR (Datajud)</h3>
          <p className="text-xs text-slate-400">
            Informe o número único CNJ para consultar classe, órgão julgador e movimentações no
            Tribunal de Justiça do Paraná.
          </p>
        </div>
      </div>

      <form onSubmit={buscarProcesso} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Ex: 0001234-56.2023.8.16.0001 ou 00012345620238160001"
            value={numeroProcesso}
            onChange={(e) => setNumeroProcesso(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !numeroProcesso.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Pesquisando...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Consultar Processo
            </>
          )}
        </button>
      </form>

      {erro ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{erro}</span>
        </div>
      ) : null}

      {listaProcessos.length > 0 ? (
        <div className="mt-6 space-y-4">
          {listaProcessos.length > 1 ? (
            <div className="rounded-xl border border-indigo-500/20 bg-slate-950 p-4">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-indigo-400">
                📋 {listaProcessos.length} Processo(s) Encontrado(s) com este trecho (Selecione para
                ver detalhes):
              </span>
              <div className="flex flex-wrap gap-2">
                {listaProcessos.map((p, idx) => (
                  <button
                    key={p.numeroProcesso}
                    type="button"
                    onClick={() => setSelecionadoIndex(idx)}
                    className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-bold transition-all ${
                      selecionadoIndex === idx
                        ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {p.numeroProcesso}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  Processo Selecionado ({selecionadoIndex + 1}/{listaProcessos.length})
                </span>
              </div>
              <span className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 font-mono text-xs font-bold text-indigo-300">
                Grau: {resultado.grau}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-xs text-slate-500">Número CNJ</span>
                <span className="font-mono text-base font-bold text-white">
                  {resultado.numeroProcesso}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Sistema / Tribunal</span>
                <span className="text-sm font-semibold text-slate-200">{resultado.sistema}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Classe Processual</span>
                <span className="text-sm font-medium text-amber-300">{resultado.classe}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">Órgão Julgador</span>
                <span className="text-sm font-medium text-slate-200">
                  {resultado.orgaoJulgador}
                </span>
              </div>
              {resultado.assuntos ? (
                <div className="sm:col-span-2">
                  <span className="block text-xs text-slate-500">
                    Assuntos Principal / Secundários
                  </span>
                  <span className="text-xs text-slate-300">{resultado.assuntos}</span>
                </div>
              ) : null}
            </div>

            {resultado.movimentos && resultado.movimentos.length > 0 ? (
              <div className="mt-4 border-t border-slate-800 pt-4">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  Últimas Movimentações ({resultado.movimentos.length})
                </h4>
                <div className="max-h-60 space-y-2.5 overflow-y-auto pr-2">
                  {resultado.movimentos.slice(0, 10).map((mov, idx) => (
                    <div
                      key={`${mov.nome}-${mov.data ?? idx}`}
                      className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="font-bold text-slate-200">{mov.nome}</span>
                        <span className="font-mono text-[11px] text-indigo-300">
                          {mov.data ? new Date(mov.data).toLocaleString("pt-BR") : ""}
                        </span>
                      </div>
                      {mov.complementos ? (
                        <p className="text-[11px] text-slate-400">{mov.complementos}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
