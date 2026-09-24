/**
 * Corretoras centralizadas suportadas na conexão de chaves de API.
 *
 * Registry const de catálogo compartilhado entre features (exchanges e
 * portfolio): os ids vivem só aqui — nada de literal solto em `if`/`===`
 * no código (regra `no-catalog-literal-compare`).
 */
export const SUPPORTED_CEX = [
  { id: "ctrader", nome: "cTrader Open API (IC Markets / FxPro / Pepperstone / Deriv)" },
  { id: "icmarkets", nome: "IC Markets (cTrader Open API)" },
  { id: "fxpro", nome: "FxPro (cTrader Open API)" },
  { id: "deriv", nome: "Deriv (cTrader Open API)" },
  { id: "pepperstone", nome: "Pepperstone (cTrader)" },
  { id: "mexc", nome: "MEXC" },
  { id: "binance", nome: "Binance" },
  { id: "okx", nome: "OKX" },
  { id: "bybit", nome: "Bybit" },
  { id: "gateio", nome: "Gate.io" },
  { id: "polymarket", nome: "Polymarket" },
  { id: "fix", nome: "FIX API (Pepperstone)" },
  { id: "pepperstone-fix", nome: "Pepperstone FIX" },
  { id: "ctrader-fix", nome: "cTrader FIX" },
] as const;

/**
 * Corretoras que usam o fluxo cTrader Open API (Client ID/Secret em vez de
 * API Key/Secret). O `apiKey` no backend é o espelho do `clientId`.
 */
const CTRADER_CEX_IDS: ReadonlySet<string> = new Set([
  "ctrader",
  "icmarkets",
  "pepperstone",
  "fxpro",
  "deriv",
]);

export function isCtraderId(exchangeId: string): boolean {
  return CTRADER_CEX_IDS.has(exchangeId);
}

/**
 * Corretoras que usam FIX API (Pepperstone/cTrader): credenciais host/ports/
 * comp ids/username/password em vez de API Key/Secret.
 */
const FIX_CEX_IDS: ReadonlySet<string> = new Set(["fix", "pepperstone-fix", "ctrader-fix"]);

export function isFixId(exchangeId: string): boolean {
  return FIX_CEX_IDS.has(exchangeId);
}

/**
 * Corretoras com auditoria spot/perp (relatório `/perp-arb/audit-exchange`).
 * cTrader/Pepperstone são forex/CFD — não entram no cruzamento spot vs perp.
 */
export const AUDITABLE_CEX_IDS: readonly string[] = ["mexc", "binance", "okx", "bybit", "gateio"];
