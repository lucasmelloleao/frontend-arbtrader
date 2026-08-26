"use client";

import { useEffect, useRef, useState } from "react";

import {
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Info,
  KeyRound,
  Power,
  ShieldAlert,
  Sprout,
  X,
} from "lucide-react";

type HelpModalProps = {
  /** Callback disparado ao fechar (qualquer via: X, Esc, overlay, CTA). */
  onClose: () => void;
};

type Step = {
  icon: typeof Building2;
  title: string;
  iconClass: string;
  body: React.ReactNode;
};

/**
 * Passo a passo "Como operar na Arbitragem de Perpétuo", fiel ao modal original.
 */
const STEPS: readonly Step[] = [
  {
    icon: Building2,
    title: "1. Crie sua corretora (Exchange)",
    iconClass: "text-indigo-400",
    body: (
      <>
        <p>
          Acesse <strong>Exchange Integrations → Corretoras Centralizadas (CEX)</strong> e clique em{" "}
          <strong>Nova CEX</strong>.
        </p>
        <p className="mt-2">
          Você vai precisar de uma conta em uma corretora centralizada como{" "}
          <strong>MEXC, Binance, OKX, Bybit ou Gate.io</strong>. Dentro da corretora, gere uma{" "}
          <strong>API Key com permissão de leitura e negociação (spot + futuros)</strong>.
        </p>
        <p className="mt-2">Preencha no painel:</p>
        <ul className="mt-1 space-y-1">
          <li>• Corretora (Exchange)</li>
          <li>• Nome da Conexão (ex: Minha MEXC)</li>
          <li>• API Key</li>
          <li>• API Secret</li>
        </ul>
        <p className="mt-2">
          ⚠️ <strong>Não compartilhe o API Secret com ninguém.</strong> Ele é criptografado
          (AES-256-GCM) antes de ser salvo. Guarde também a API Key em local seguro.
        </p>
      </>
    ),
  },
  {
    icon: KeyRound,
    title: "2. Ative o duplo fator (2FA)",
    iconClass: "text-amber-400",
    body: (
      <>
        <p>
          O <strong>2FA (autenticação de dois fatores)</strong> é essencial para proteger sua conta,
          tanto no painel quanto na corretora.
        </p>
        <ul className="mt-1 space-y-1">
          <li>
            • No painel: <strong>Perfil → Two-Factor Authentication (2FA)</strong> →{" "}
            <em>Set up 2FA</em>, escaneie o QR Code com seu app autenticador (Google Authenticator,
            Authy, etc.) e confirme o código.
          </li>
          <li>
            • Na corretora: ative o 2FA nas configurações de segurança e, se exigido,{" "}
            <strong>ative o código anti-phishing</strong>.
          </li>
        </ul>
        <p className="mt-2">
          🔐 O 2FA impede que terceiros acessem sua conta mesmo que descubram sua senha —{" "}
          <strong>nunca desative</strong>.
        </p>
      </>
    ),
  },
  {
    icon: CircleDollarSign,
    title: "3. Deposite USDT na corretora",
    iconClass: "text-emerald-400",
    body: (
      <>
        <p>
          O robô opera com <strong>USDT</strong> (também aceita USDC). Faça o depósito{" "}
          <strong>somente na conta Spot</strong> da corretora conectada.
        </p>
        <p className="mt-2">
          🔄 <strong>Não precisa transferir nada para Futuros.</strong> O robô faz o rateio
          automaticamente: antes de abrir o hedge, ele equilibra o saldo entre Spot e Futuros
          (transferência interna), usando metade do saldo livre em cada conta.
        </p>
        <p className="mt-2">
          💰 Com o saldo todo no Spot, o robô separa o necessário para a perna do Perpétuo e abre o
          hedge (Long no Spot + Short no Perpétuo) sem intervenção manual.
        </p>
      </>
    ),
  },
  {
    icon: Sprout,
    title: "4. Inicie a Colheita Automática",
    iconClass: "text-emerald-400",
    body: (
      <>
        <p>
          Na tela de <strong>Arbitragem Perpétuo</strong>, clique em{" "}
          <strong>🌾 Iniciar Colheita</strong> (no topo da tela).
        </p>
        <p className="mt-2">
          O robô passa a varrer o mercado em busca de pares com funding favorável. Quando encontra
          uma oportunidade, abre automaticamente o hedge:
        </p>
        <ul className="mt-1 space-y-1">
          <li>
            • <strong>Long no Spot</strong> (compra da moeda)
          </li>
          <li>
            • <strong>Short no Perpétuo</strong> (venda futura)
          </li>
        </ul>
        <p className="mt-2">
          Com o hedge montado, a cada ciclo de funding (geralmente a cada 8h) você recebe o
          pagamento da taxa de funding.
        </p>
      </>
    ),
  },
  {
    icon: CircleDollarSign,
    title: "5. Aumente o aporte da posição",
    iconClass: "text-indigo-400",
    body: (
      <>
        <p>
          Em cada posição aberta (aba <strong>Em Aberto</strong>), clique em{" "}
          <strong>+ Aumentar Aporte</strong>.
        </p>
        <p className="mt-2">
          Informe o valor extra em USDT. O robô compra mais Spot e abre mais Short no Perpétuo,
          mantendo o hedge 1:1 (delta neutro).
        </p>
        <p className="mt-2">
          💡 Isso aumenta o valor que recebe de funding, pois o pagamento é proporcional ao tamanho
          da posição.
        </p>
      </>
    ),
  },
  {
    icon: Power,
    title: "6. Encerre a posição",
    iconClass: "text-red-400",
    body: (
      <>
        <p>
          Quando quiser sair, clique em <strong>Encerrar Agora</strong> no card da posição (aba{" "}
          <strong>Em Aberto</strong>).
        </p>
        <p className="mt-2">
          O robô executa a saída a mercado: <strong>vende o Spot</strong> e{" "}
          <strong>recompra o Perpétuo</strong> (fecha o Short), devolvendo seu capital + lucro (ou
          prejuízo) acumulado.
        </p>
      </>
    ),
  },
  {
    icon: BadgeCheck,
    title: "7. Marque como Encerrada pela Corretora",
    iconClass: "text-slate-400",
    body: (
      <>
        <p>
          Use o botão <strong>Encerrada pela Corretora</strong> <em>somente</em> quando a própria
          corretora já liquidou/encerrou a posição (ex: liquidação forçada).
        </p>
        <p className="mt-2">
          Nesse caso <strong>nenhuma ordem é enviada</strong> e o PnL é registrado como zero. Não
          use para sair por conta própria — para isso, use <em>Encerrar Agora</em>.
        </p>
      </>
    ),
  },
];

/**
 * Modal "Como operar": accordion dos passos + avisos.
 *
 * Usa o `<dialog>` nativo via `showModal()`: dá foco, foco-trap, Escape e
 * `aria-modal` de graça. O clique no backdrop fecha (checado por coordenadas,
 * não por propagação — o padrão de `onClick` no container gerava falsos
 * fechamentos ao interagir com o conteúdo).
 */
export function HelpModal({ onClose }: HelpModalProps): React.ReactNode {
  const [openStep, setOpenStep] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null || dialog.open) {
      return;
    }
    dialog.showModal();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return undefined;
    }
    const handleBackdropClick = (event: MouseEvent): void => {
      const rect = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) {
        onClose();
      }
    };
    const handleClose = (): void => onClose();
    dialog.addEventListener("click", handleBackdropClick);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("click", handleBackdropClick);
      dialog.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 p-0 text-slate-200 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] flex-col overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-900 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Info className="h-5 w-5 text-indigo-400" aria-hidden="true" />
            Como operar na Arbitragem de Perpétuo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Fechar ajuda"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
            <p>
              <strong>Importante:</strong> o robô não opera com valores menores que{" "}
              <strong>$10 USDT</strong>. Deixe sempre saldo suficiente (acima de $10) na{" "}
              <strong>conta Spot</strong> — o robô faz o rateio automático com a conta de Futuros.
            </p>
          </div>

          {STEPS.map((step, index) => {
            const isOpen = openStep === index;
            return (
              <div
                key={step.title}
                className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70"
              >
                <button
                  type="button"
                  onClick={() => setOpenStep(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-900/60"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-3">
                    <span className={`rounded-lg bg-slate-800/80 p-2 ${step.iconClass}`}>
                      <step.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-white">{step.title}</span>
                  </span>
                  <span
                    className={`text-lg text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>
                {isOpen ? (
                  <div className="px-4 pb-4 pl-[4.25rem] text-sm leading-relaxed text-slate-300">
                    {step.body}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <CircleDollarSign
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
            <p>
              <strong>Dica final:</strong> acompanhe a aba <strong>Em Aberto</strong> para ver o PnL
              por perna, o funding coletado e o APR. Use o botão <strong>Atualizar</strong> para
              sincronizar saldos e o terminal de logs para acompanhar o robô em tempo real.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end border-t border-white/10 bg-slate-900 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Entendi, vamos operar!
          </button>
        </div>
      </div>
    </dialog>
  );
}
