export interface FxProSymbolCategory {
  category: string;
  symbols: { symbol: string; label: string; defaultTp?: number; defaultSl?: number }[];
}

export const FXPRO_SUPPORTED_MARKETS: FxProSymbolCategory[] = [
  {
    category: "Forex Majors",
    symbols: [
      { symbol: "EURUSD", label: "EUR/USD - Euro / US Dollar" },
      { symbol: "GBPUSD", label: "GBP/USD - British Pound / US Dollar" },
      { symbol: "USDJPY", label: "USD/JPY - US Dollar / Japanese Yen" },
      { symbol: "USDCHF", label: "USD/CHF - US Dollar / Swiss Franc" },
      { symbol: "AUDUSD", label: "AUD/USD - Australian Dollar / US Dollar" },
      { symbol: "USDCAD", label: "USDCAD - US Dollar / Canadian Dollar" },
      { symbol: "NZDUSD", label: "NZD/USD - New Zealand Dollar / US Dollar" },
    ],
  },
  {
    category: "Forex Minors & Crosses",
    symbols: [
      { symbol: "EURGBP", label: "EUR/GBP - Euro / British Pound" },
      { symbol: "EURJPY", label: "EUR/JPY - Euro / Japanese Yen" },
      { symbol: "GBPJPY", label: "GBP/JPY - British Pound / Japanese Yen" },
      { symbol: "AUDJPY", label: "AUD/JPY - Australian Dollar / Japanese Yen" },
      { symbol: "CADJPY", label: "CAD/JPY - Canadian Dollar / Japanese Yen" },
      { symbol: "CHFJPY", label: "CHF/JPY - Swiss Franc / Japanese Yen" },
      { symbol: "NZDJPY", label: "NZD/JPY - New Zealand Dollar / Japanese Yen" },
      { symbol: "EURAUD", label: "EUR/AUD - Euro / Australian Dollar" },
      { symbol: "EURCAD", label: "EUR/CAD - Euro / Canadian Dollar" },
      { symbol: "EURCHF", label: "EUR/CHF - Euro / Swiss Franc" },
      { symbol: "EURNZD", label: "EUR/NZD - Euro / New Zealand Dollar" },
      { symbol: "GBPAUD", label: "GBP/AUD - British Pound / Australian Dollar" },
      { symbol: "GBPCAD", label: "GBP/CAD - British Pound / Canadian Dollar" },
      { symbol: "GBPCHF", label: "GBP/CHF - British Pound / Swiss Franc" },
      { symbol: "GBPNZD", label: "GBP/NZD - British Pound / New Zealand Dollar" },
      { symbol: "AUDCAD", label: "AUD/CAD - Australian Dollar / Canadian Dollar" },
      { symbol: "AUDCHF", label: "AUD/CHF - Australian Dollar / Swiss Franc" },
      { symbol: "AUDNZD", label: "AUD/NZD - Australian Dollar / New Zealand Dollar" },
      { symbol: "CADCHF", label: "CAD/CHF - Canadian Dollar / Swiss Franc" },
      { symbol: "NZDCAD", label: "NZD/CAD - New Zealand Dollar / Canadian Dollar" },
      { symbol: "NZDCHF", label: "NZD/CHF - New Zealand Dollar / Swiss Franc" },
    ],
  },
  {
    category: "Índices & Commodities (CFDs)",
    symbols: [
      { symbol: "US30", label: "US30 / Wall Street 30 (Dow Jones)" },
      { symbol: "US500", label: "US500 / S&P 500 Index" },
      { symbol: "NAS100", label: "NAS100 / US Tech 100 (Nasdaq)" },
      { symbol: "GER40", label: "GER40 / Germany 40 (DAX)" },
      { symbol: "UK100", label: "UK100 / FTSE 100 Index" },
      { symbol: "JP225", label: "JP225 / Japan 225 (Nikkei)" },
      { symbol: "XAUUSD", label: "XAU/USD - Gold (Ouro Spot)" },
      { symbol: "XAGUSD", label: "XAG/USD - Silver (Prata Spot)" },
      { symbol: "USOIL", label: "USOIL - WTI Crude Oil" },
      { symbol: "UKOIL", label: "UKOIL - Brent Crude Oil" },
    ],
  },
  {
    category: "Cryptocurrencies (CFDs)",
    symbols: [
      { symbol: "BTCUSD", label: "BTC/USD - Bitcoin" },
      { symbol: "ETHUSD", label: "ETH/USD - Ethereum" },
      { symbol: "SOLUSD", label: "SOL/USD - Solana" },
      { symbol: "XRPUSD", label: "XRP/USD - Ripple" },
      { symbol: "DOGEUSD", label: "DOGE/USD - Dogecoin" },
      { symbol: "ADAUSD", label: "ADA/USD - Cardano" },
      { symbol: "LTCUSD", label: "LTC/USD - Litecoin" },
      { symbol: "BNBUSD", label: "BNB/USD - Binance Coin" },
      { symbol: "LINKUSD", label: "LINK/USD - Chainlink" },
      { symbol: "AVAXUSD", label: "AVAX/USD - Avalanche" },
    ],
  },
];
