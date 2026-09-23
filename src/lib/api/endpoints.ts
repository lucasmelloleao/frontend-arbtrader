/**
 * Config central dos endpoints do backend: fonte única de todos os paths REST do
 * projeto, agrupados por domínio.
 *
 * Cada valor é o path relativo ao `baseUrl` da instância ky (sem barra inicial).
 * A base URL não entra aqui: ela vive no `kyServer`/`kyClient` (ver `ky.server`,
 * `ky.client` e `base-url`), então este arquivo guarda só os caminhos.
 * Centralizar evita string de endpoint solta espalhada pelas features e dá um
 * lugar só para revisar os paths contra o contrato (skill `api-contract`).
 *
 * Cada novo endpoint entra aqui no domínio correspondente, não como const local.
 */
export const API_ENDPOINTS = {
  /** Sessão do usuário. Chamado browser-direct: o backend emite o cookie. */
  auth: {
    login: "api/v1/login",
    logout: "api/v1/logout",
  },

  /** Perfil do usuário autenticado — a feature de exemplo do boilerplate. */
  perfil: {
    me: "api/v1/perfil",
    senha: "api/v1/perfil/senha",
    gerar2fa: "api/v1/perfil/2fa/gerar",
    ativar2fa: "api/v1/perfil/2fa/ativar",
    desativar2fa: "api/v1/perfil/2fa/desativar",
  },

  /** Chaves de API de corretoras centralizadas (CEX). */
  exchanges: {
    listar: "api/v1/exchanges",
    criar: "api/v1/exchanges",
    atualizar: "api/v1/exchanges",
    deletar: "api/v1/exchanges",
  },

  /** Polymarket: credenciais, saldo e transferência de pUSD. */
  polymarket: {
    credentials: "api/v1/polymarket/credentials",
    balance: "api/v1/polymarket/balance",
    transfer: "api/v1/polymarket/transfer",
    deployWallet: "api/v1/polymarket/deploy-wallet",
    syncHistory: "api/v1/polymarket/sync-history",
  },

  /** Portfolio: resumo patrimonial, evolução e posições ao vivo. */
  portfolio: {
    resumo: "api/v1/portfolio/resumo",
    historico: "api/v1/portfolio/historico",
    live: "api/v1/portfolio/live",
  },

  /** Arbitragem perpétuo vs spot (Funding Arb). */
  perpArb: {
    listarStrategies: "api/v1/perp-arb/strategies",
    criarStrategy: "api/v1/perp-arb/strategies",
    atualizarStrategy: "api/v1/perp-arb/strategies",
    deletarStrategy: "api/v1/perp-arb/strategies",
    listarTrades: "api/v1/perp-arb/trades",
    tradesResumo: "api/v1/perp-arb/trades/resumo",
    settings: "api/v1/perp-arb/settings",
    botStatus: "api/v1/bot-status",
    fechar: "api/v1/perp-arb/close",
    aumentar: "api/v1/perp-arb/increase",
    voidClose: "api/v1/perp-arb/void-close",
    logs: "api/v1/perp-arb/logs",
    manualScan: "api/v1/perp-arb/manual-scan",
    auditExchange: "api/v1/perp-arb/audit-exchange",
  },

  /** Arbitragem Forex (simples e triangular, via cTrader/FIX). */
  forexArb: {
    listarStrategies: "api/v1/forex-arb/strategies",
    criarStrategy: "api/v1/forex-arb/strategies",
    deletarStrategy: "api/v1/forex-arb/strategies",
    listarTrades: "api/v1/forex-arb/trades",
    oportunidades: "api/v1/forex-arb/opportunities",
    settings: "api/v1/forex-arb/settings",
    ctraderCredentials: "api/v1/forex-arb/ctrader-credentials",
    fechar: "api/v1/forex-arb/close",
    fecharTodas: "api/v1/forex-arb/close-all",
    voidClose: "api/v1/forex-arb/void-close",
    limparTrades: "api/v1/forex-arb/trades",
    logs: "api/v1/forex-arb/logs",
    livePrices: "api/v1/forex-arb/live-prices",
  },

  /** Arbitragem por Latência (cTrader -> MEXC). */
  latencyArb: {
    settings: "api/v1/latency-arb/settings",
    trades: "api/v1/latency-arb/trades",
    close: "api/v1/latency-arb/close",
    logs: "api/v1/latency-arb/logs",
  },

  /** Arbitragem em prediction markets (Polymarket). */
  predictionArb: {
    listarStrategies: "api/v1/prediction-arb/strategies",
    criarStrategy: "api/v1/prediction-arb/strategies",
    atualizarStrategy: "api/v1/prediction-arb/strategies",
    deletarStrategy: "api/v1/prediction-arb/strategies",
    listarTrades: "api/v1/prediction-arb/trades",
    tradesResumo: "api/v1/prediction-arb/trades/resumo",
    settings: "api/v1/prediction-arb/settings",
    botStatus: "api/v1/prediction-arb/bot-status",
    fechar: "api/v1/prediction-arb/close",
    aumentar: "api/v1/prediction-arb/increase",
    voidClose: "api/v1/prediction-arb/void-close",
    manualScan: "api/v1/prediction-arb/manual-scan",
    logs: "api/v1/prediction-arb/logs",
    limparTrades: "api/v1/prediction-arb/trades",
    metaModelTrain: "api/v1/prediction-arb/meta-model/train",
    metaModelStatus: "api/v1/prediction-arb/meta-model/status",
  },

  /** Consulta Processual TJPR / Datajud */
  processoTJPR: "api/v1/processo-tjpr",

  /** Robô de Opções Digitais Deriv. */
  deriv: {
    settings: "api/v1/deriv/settings",
    strategies: "api/v1/deriv/strategies",
    contractsFor: "api/v1/deriv/contracts-for",
    barrierRange: "api/v1/deriv/barrier-range",
    proposal: "api/v1/deriv/proposal",
    balance: "api/v1/deriv/balance",
    listarTrades: "api/v1/deriv/trades",
    summary: "api/v1/deriv/summary",
    close: "api/v1/deriv/close",
    sync: "api/v1/deriv/sync",
    logs: "api/v1/deriv/logs",
    aiAnalysis: "api/v1/deriv/ai-analysis",
    limparTrades: "api/v1/deriv/trades",
    metaModelTrain: "api/v1/deriv/meta-model/train",
    metaModelStatus: "api/v1/deriv/meta-model/status",
  },

  /** Robô Forex / CFD FxPro cTrader. */
  fxpro: {
    settings: "api/v1/fxpro/settings",
    strategies: "api/v1/fxpro/strategies",
    toggle: (id: string) => `api/v1/fxpro/strategies/${id}/toggle`,
    trades: "api/v1/fxpro/trades",
    botStatus: "api/v1/fxpro/bot/status",
    botStart: "api/v1/fxpro/bot/start",
    botStop: "api/v1/fxpro/bot/stop",
    metaModelStatus: "api/v1/fxpro/meta-model/status",
    metaModelTrain: "api/v1/fxpro/meta-model/train",
  },
} as const;
