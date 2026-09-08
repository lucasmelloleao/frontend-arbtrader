"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Activity,
  CalendarRange,
  ChevronDown,
  Cpu,
  Globe,
  HelpCircle,
  History,
  LayoutDashboard,
  Menu,
  ShieldAlert,
  Timer,
  TrendingUp,
  User,
  Wallet,
  Waves,
  X,
  Zap,
} from "lucide-react";

import { LogoutButton } from "@/features/dashboard/logout-button";
import { HelpModal } from "@/shared/ui/help-modal";

type SidebarLink = {
  href: Route;
  label: string;
  icon: typeof LayoutDashboard;
  /** `false` deixa o item visível mas sem navegação (em construção). */
  habilitado: boolean;
};

/**
 * Links da navegação principal, espelhando o painel legado. Apenas os itens
 * habilitados navegam; o resto fica visível como "em construção".
 */
const LINKS: readonly SidebarLink[] = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard, habilitado: true },
  {
    href: "/dashboard/perpetual-arb",
    label: "Arbitragem de Funding",
    icon: TrendingUp,
    habilitado: true,
  },
  { href: "/dashboard/exchanges", label: "Exchange", icon: Wallet, habilitado: true },
  { href: "/dashboard/forex-arb", label: "Scalping Forex", icon: Globe, habilitado: true },
  { href: "/dashboard/latency-arb", label: "Latency Arb (cTrader -> MEXC)", icon: Timer, habilitado: true },
  { href: "/dashboard/hyperliquid", label: "Hyperliquid Arb", icon: Waves, habilitado: false },
  {
    href: "/dashboard/hyperliquid-mm",
    label: "Hyperliquid MM (HFT)",
    icon: Cpu,
    habilitado: false,
  },
  { href: "/dashboard/polymarket-arb", label: "Polymarket Arb", icon: Activity, habilitado: true },
  { href: "/dashboard/liquidation", label: "Liquidação", icon: ShieldAlert, habilitado: false },
  { href: "/dashboard/flash-loan", label: "Flash Loans", icon: Zap, habilitado: false },
  {
    href: "/dashboard/exchange-history",
    label: "Histórico Exchange",
    icon: CalendarRange,
    habilitado: false,
  },
  { href: "/dashboard/transactions", label: "Transações", icon: History, habilitado: false },
];

/**
 * Shell do dashboard autenticado: sidebar (collapse + mobile), header com menu
 * do usuário e o modal de ajuda. O conteúdo das rotas chega via `children`.
 *
 * Componente client porque o layout legado é interativo (collapse, dropdown,
 * mobile). O nome/email do usuário chegam do layout RSC (leitura do
 * `/perfil`); se o backend estiver indisponível, cai no placeholder.
 */
export function DashboardShell({
  children,
  nome = null,
  email = null,
}: {
  children?: React.ReactNode;
  nome?: string | null;
  email?: string | null;
}): React.ReactNode {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const nomeExibido = nome ?? "Usuário";
  const emailExibido = email ?? "usuario@email.com";
  const inicial = nomeExibido.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Overlay do menu mobile */}
      {isMobileMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Fechar menu"
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex transform flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-20" : "w-64"}`}
      >
        <div
          className={`flex items-center p-6 md:block ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <h1
            className={`flex items-center gap-2 text-xl font-bold text-white ${isCollapsed ? "justify-center" : ""}`}
          >
            <Zap className="h-6 w-6 shrink-0 text-indigo-500" aria-hidden="true" />
            {!isCollapsed ? <span>ArbTrade</span> : null}
          </h1>
          {!isCollapsed ? (
            <button
              type="button"
              className="text-slate-400 hover:text-white md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Fechar menu"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <nav className="mt-2 mb-4 flex-1 space-y-1 overflow-y-auto px-3">
          {LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            const classeBase = `flex items-center rounded-lg text-sm font-medium transition-colors ${
              isCollapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5"
            }`;
            const iconClass = `h-5 w-5 shrink-0 ${
              link.habilitado ? (isActive ? "text-white" : "text-slate-500") : "text-slate-700"
            }`;

            if (!link.habilitado) {
              return (
                <button
                  key={link.href}
                  type="button"
                  disabled
                  title={isCollapsed ? `${link.label} (em breve)` : undefined}
                  className={`${classeBase} w-full cursor-not-allowed text-slate-600`}
                  aria-disabled="true"
                >
                  <Icon className={iconClass} aria-hidden="true" />
                  {!isCollapsed ? (
                    <span className="truncate">
                      {link.label}
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                        em breve
                      </span>
                    </span>
                  ) : null}
                </button>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                title={isCollapsed ? link.label : undefined}
                className={`${classeBase} ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <Icon className={iconClass} aria-hidden="true" />
                {!isCollapsed ? <span className="truncate">{link.label}</span> : null}
              </Link>
            );
          })}

          {/* Ajuda */}
          <button
            type="button"
            onClick={() => {
              setIsHelpOpen(true);
              setIsMobileMenuOpen(false);
            }}
            title={isCollapsed ? "Ajuda" : undefined}
            className={`flex w-full items-center rounded-lg text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200 ${
              isCollapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5"
            }`}
          >
            <HelpCircle className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
            {!isCollapsed ? <span className="truncate">Ajuda</span> : null}
          </button>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/50 px-4 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setIsMobileMenuOpen((aberto) => !aberto);
                } else {
                  setIsCollapsed((colapsado) => !colapsado);
                }
              }}
              aria-label="Alternar menu"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <h2 className="text-lg font-medium text-white">Dashboard</h2>
          </div>

          {/* Menu do usuário */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((aberto) => !aberto)}
              className="flex items-center gap-3 rounded-xl border border-transparent p-1.5 transition-all hover:border-slate-800 hover:bg-slate-800/60"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/20">
                {inicial}
              </div>
              <div className="hidden flex-col text-left sm:flex">
                <span className="text-sm font-medium leading-tight text-white">{nomeExibido}</span>
                <span className="max-w-[150px] truncate text-xs leading-tight text-slate-400">
                  {emailExibido}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {isUserMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-56 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900 py-2 shadow-xl"
              >
                <div className="px-4 py-3 sm:hidden">
                  <p className="text-sm font-medium text-white">{nomeExibido}</p>
                  <p className="text-xs text-slate-400">{emailExibido}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-white"
                  >
                    <User className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden="true" />
                    Perfil
                  </Link>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsHelpOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-white"
                  >
                    <HelpCircle className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden="true" />
                    Ajuda
                  </button>
                </div>
                <div className="py-1">
                  <LogoutButton className="w-full text-rose-400 hover:bg-rose-500/10 hover:text-rose-300" />
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1700px]">{children}</div>
        </div>
      </main>

      {/* Modal de ajuda */}
      {isHelpOpen ? <HelpModal onClose={() => setIsHelpOpen(false)} /> : null}
    </div>
  );
}
