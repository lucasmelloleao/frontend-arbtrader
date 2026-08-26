/**
 * Corretoras centralizadas suportadas na conexão de chaves de API.
 *
 * Registry const de catálogo compartilhado entre features (exchanges e
 * portfolio): os ids vivem só aqui — nada de literal solto em `if`/`===`
 * no código (regra `no-catalog-literal-compare`).
 */
export const SUPPORTED_CEX = [
  { id: "mexc", nome: "MEXC" },
  { id: "binance", nome: "Binance" },
  { id: "okx", nome: "OKX" },
  { id: "bybit", nome: "Bybit" },
  { id: "gateio", nome: "Gate.io" },
] as const;
