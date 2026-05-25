export type ETFCategory = "broad" | "sector" | "bonds" | "commodities" | "international";

export interface ETFConfig {
  symbol: string;
  name: string;
  exchange: string;
  category: ETFCategory;
}

export const BROAD_MARKET: ETFConfig[] = [
  { symbol: "SPY",  name: "SPDR S&P 500 ETF",             exchange: "NYSE",   category: "broad" },
  { symbol: "QQQ",  name: "Invesco Nasdaq 100 ETF",        exchange: "NASDAQ", category: "broad" },
  { symbol: "IWM",  name: "iShares Russell 2000 ETF",      exchange: "NYSE",   category: "broad" },
  { symbol: "DIA",  name: "SPDR Dow Jones ETF",            exchange: "NYSE",   category: "broad" },
  { symbol: "VTI",  name: "Vanguard Total Market ETF",     exchange: "NYSE",   category: "broad" },
];

export const SECTOR_ETFS: ETFConfig[] = [
  { symbol: "XLK",  name: "Technology",                    exchange: "NYSE",   category: "sector" },
  { symbol: "XLF",  name: "Financials",                    exchange: "NYSE",   category: "sector" },
  { symbol: "XLV",  name: "Health Care",                   exchange: "NYSE",   category: "sector" },
  { symbol: "XLE",  name: "Energy",                        exchange: "NYSE",   category: "sector" },
  { symbol: "XLI",  name: "Industrials",                   exchange: "NYSE",   category: "sector" },
  { symbol: "XLY",  name: "Consumer Discretionary",        exchange: "NYSE",   category: "sector" },
  { symbol: "XLP",  name: "Consumer Staples",              exchange: "NYSE",   category: "sector" },
  { symbol: "XLU",  name: "Utilities",                     exchange: "NYSE",   category: "sector" },
  { symbol: "XLB",  name: "Materials",                     exchange: "NYSE",   category: "sector" },
  { symbol: "XLRE", name: "Real Estate",                   exchange: "NYSE",   category: "sector" },
];

export const BOND_ETFS: ETFConfig[] = [
  { symbol: "AGG",  name: "iShares Core US Aggregate",     exchange: "NYSE",   category: "bonds" },
  { symbol: "BND",  name: "Vanguard Total Bond Market",    exchange: "NASDAQ", category: "bonds" },
  { symbol: "TLT",  name: "iShares 20+ Year Treasury",     exchange: "NASDAQ", category: "bonds" },
  { symbol: "HYG",  name: "iShares High Yield Corporate",  exchange: "NYSE",   category: "bonds" },
  { symbol: "LQD",  name: "iShares Investment Grade Corp", exchange: "NYSE",   category: "bonds" },
];

export const COMMODITY_ETFS: ETFConfig[] = [
  { symbol: "GLD",  name: "SPDR Gold Shares",              exchange: "NYSE",   category: "commodities" },
  { symbol: "SLV",  name: "iShares Silver Trust",          exchange: "NYSE",   category: "commodities" },
  { symbol: "USO",  name: "United States Oil Fund",        exchange: "NYSE",   category: "commodities" },
  { symbol: "UNG",  name: "United States Natural Gas",     exchange: "NYSE",   category: "commodities" },
  { symbol: "GDX",  name: "VanEck Gold Miners ETF",        exchange: "NYSE",   category: "commodities" },
];

export const INTERNATIONAL_ETFS: ETFConfig[] = [
  { symbol: "EFA",  name: "iShares MSCI EAFE",             exchange: "NYSE",   category: "international" },
  { symbol: "EEM",  name: "iShares MSCI Emerging Markets", exchange: "NYSE",   category: "international" },
  { symbol: "VEA",  name: "Vanguard Developed Markets",    exchange: "NYSE",   category: "international" },
  { symbol: "VWO",  name: "Vanguard Emerging Markets",     exchange: "NYSE",   category: "international" },
  { symbol: "FXI",  name: "iShares China Large-Cap",       exchange: "NYSE",   category: "international" },
];

export const ALL_ETFS: ETFConfig[] = [
  ...BROAD_MARKET,
  ...SECTOR_ETFS,
  ...BOND_ETFS,
  ...COMMODITY_ETFS,
  ...INTERNATIONAL_ETFS,
];

export const ETF_NAME_MAP: Record<string, string> = Object.fromEntries(
  ALL_ETFS.map((e) => [e.symbol, e.name])
);

export const ETF_CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  ALL_ETFS.map((e) => [e.symbol, e.category])
);

export const ETF_TICKERS_BY_CATEGORY: Record<ETFCategory | "all", string[]> = {
  broad:         BROAD_MARKET.map((e) => e.symbol),
  sector:        SECTOR_ETFS.map((e) => e.symbol),
  bonds:         BOND_ETFS.map((e) => e.symbol),
  commodities:   COMMODITY_ETFS.map((e) => e.symbol),
  international: INTERNATIONAL_ETFS.map((e) => e.symbol),
  all:           ALL_ETFS.map((e) => e.symbol),
};

// Representative ETF for each category — used for the chart
export const CATEGORY_CHART_TICKER: Record<ETFCategory, string> = {
  broad:         "SPY",
  sector:        "XLK",
  bonds:         "AGG",
  commodities:   "GLD",
  international: "EFA",
};

export const CATEGORY_LABELS: Record<ETFCategory | "all", string> = {
  broad:         "Broad Market",
  sector:        "Sectors",
  bonds:         "Bonds",
  commodities:   "Commodities",
  international: "International",
  all:           "All ETFs",
};
