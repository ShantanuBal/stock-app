export type ETFCategory = "broad" | "sector" | "bonds" | "commodities" | "international";

export interface ETFConfig {
  symbol: string;
  name: string;
  exchange: string;
  category: ETFCategory;
  description: string;
}

export const BROAD_MARKET: ETFConfig[] = [
  { symbol: "SPY",  name: "SPDR S&P 500 ETF",             exchange: "NYSE",   category: "broad",
    description: "Tracks the S&P 500 — 500 of the largest US companies by market cap. The world's most-traded ETF and the de facto benchmark for US large-cap equities. Launched in 1993, it pioneered the modern ETF industry." },
  { symbol: "QQQ",  name: "Invesco Nasdaq 100 ETF",        exchange: "NASDAQ", category: "broad",
    description: "Tracks the Nasdaq-100's 100 largest non-financial companies, heavily weighted toward technology. Includes Apple, Microsoft, NVIDIA, and Meta. A go-to for tech-tilted equity exposure." },
  { symbol: "IWM",  name: "iShares Russell 2000 ETF",      exchange: "NYSE",   category: "broad",
    description: "Tracks the Russell 2000 — 2,000 small-cap US stocks. More sensitive to domestic economic conditions than large-caps. Higher volatility but a popular indicator of US economic health." },
  { symbol: "DIA",  name: "SPDR Dow Jones ETF",            exchange: "NYSE",   category: "broad",
    description: "Tracks the price-weighted Dow Jones Industrial Average's 30 blue-chip US stocks. One of the oldest indices in the world, dating to 1896. Underweight tech relative to SPY due to price-weighting." },
  { symbol: "VTI",  name: "Vanguard Total Market ETF",     exchange: "NYSE",   category: "broad",
    description: "Tracks the entire US stock market — over 3,500 stocks across large, mid, and small caps. Broadest single-fund US equity exposure available, with one of the lowest expense ratios in the industry." },
];

export const SECTOR_ETFS: ETFConfig[] = [
  { symbol: "XLK",  name: "Technology",                    exchange: "NYSE",   category: "sector",
    description: "Tracks the Technology sector of the S&P 500. Heavy concentration in Apple and Microsoft. Highly sensitive to interest rates and earnings revisions in mega-cap tech." },
  { symbol: "XLF",  name: "Financials",                    exchange: "NYSE",   category: "sector",
    description: "Tracks the Financials sector — banks, insurance, and asset managers. Outperforms in rising rate environments and steepening yield curves. Sensitive to credit cycles and regulatory risk." },
  { symbol: "XLV",  name: "Health Care",                   exchange: "NYSE",   category: "sector",
    description: "Tracks the Health Care sector — pharma, biotech, medical devices, and managed care. Historically defensive with steady earnings growth, though exposed to drug pricing policy risk." },
  { symbol: "XLE",  name: "Energy",                        exchange: "NYSE",   category: "sector",
    description: "Tracks the Energy sector — oil majors, E&P companies, and refiners. Highly correlated with crude oil prices. Cyclical but acts as a natural inflation hedge." },
  { symbol: "XLI",  name: "Industrials",                   exchange: "NYSE",   category: "sector",
    description: "Tracks the Industrials sector — aerospace, defense, machinery, and transportation. Economically sensitive and closely tied to manufacturing activity and government infrastructure spending." },
  { symbol: "XLY",  name: "Consumer Discretionary",        exchange: "NYSE",   category: "sector",
    description: "Tracks the Consumer Discretionary sector — retail, autos, restaurants, and leisure. Outperforms in expansionary phases; underperforms in recessions as consumers cut non-essential spending." },
  { symbol: "XLP",  name: "Consumer Staples",              exchange: "NYSE",   category: "sector",
    description: "Tracks the Consumer Staples sector — food, beverages, and household products. Defensive with stable demand regardless of economic conditions. Often outperforms in downturns." },
  { symbol: "XLU",  name: "Utilities",                     exchange: "NYSE",   category: "sector",
    description: "Tracks the Utilities sector — electric, gas, and water companies. A bond proxy with predictable dividends. Sensitive to interest rate changes; underperforms when rates rise." },
  { symbol: "XLB",  name: "Materials",                     exchange: "NYSE",   category: "sector",
    description: "Tracks the Materials sector — chemicals, metals, mining, and paper. Cyclical and tied to global industrial demand. Acts as a partial inflation hedge through commodity exposure." },
  { symbol: "XLRE", name: "Real Estate",                   exchange: "NYSE",   category: "sector",
    description: "Tracks the Real Estate sector — REITs and real estate services. High dividend yields but sensitive to interest rates. Underperforms when rates rise as borrowing costs increase." },
];

export const BOND_ETFS: ETFConfig[] = [
  { symbol: "AGG",  name: "iShares Core US Aggregate",     exchange: "NYSE",   category: "bonds",
    description: "Tracks the US investment-grade bond market — Treasuries, agency debt, and corporate bonds. The broadest measure of US fixed income with ~6 year duration; sensitive to interest rate changes." },
  { symbol: "BND",  name: "Vanguard Total Bond Market",    exchange: "NASDAQ", category: "bonds",
    description: "Vanguard's equivalent to AGG, covering the entire US taxable investment-grade bond market. Slightly broader index with a very low expense ratio. A core fixed income holding in diversified portfolios." },
  { symbol: "TLT",  name: "iShares 20+ Year Treasury",     exchange: "NASDAQ", category: "bonds",
    description: "Tracks US Treasury bonds with 20+ years to maturity. Highly rate-sensitive (~17 year duration) — a 1% rate rise can drop NAV ~17%. Used for duration exposure, flight-to-quality, or rate hedges." },
  { symbol: "HYG",  name: "iShares High Yield Corporate",  exchange: "NYSE",   category: "bonds",
    description: "Tracks high-yield (junk) US corporate bonds. Higher income than investment-grade but more credit risk. Correlates with equities during stress periods, often selling off alongside stocks." },
  { symbol: "LQD",  name: "iShares Investment Grade Corp", exchange: "NYSE",   category: "bonds",
    description: "Tracks investment-grade US corporate bonds. Moderate credit quality — above high-yield but below Treasuries. Offers higher yield than AGG with manageable credit risk." },
];

export const COMMODITY_ETFS: ETFConfig[] = [
  { symbol: "GLD",  name: "SPDR Gold Shares",              exchange: "NYSE",   category: "commodities",
    description: "Holds physical gold bars in secure vaults. The largest gold ETF, used as an inflation hedge, safe-haven asset, and dollar hedge. Doesn't pay dividends; returns come purely from gold price appreciation." },
  { symbol: "SLV",  name: "iShares Silver Trust",          exchange: "NYSE",   category: "commodities",
    description: "Holds physical silver. More volatile than gold with a dual role as both a monetary metal and industrial input. Higher beta relative to gold; tends to outperform in strong commodity cycles." },
  { symbol: "USO",  name: "United States Oil Fund",        exchange: "NYSE",   category: "commodities",
    description: "Holds short-term WTI crude oil futures. Prone to contango drag — rolling futures from near to far months can erode returns even if spot prices are flat. Best for short-term tactical trades." },
  { symbol: "UNG",  name: "United States Natural Gas",     exchange: "NYSE",   category: "commodities",
    description: "Holds short-term natural gas futures (Henry Hub). Extremely volatile and seasonally influenced by heating demand. Suffers significant contango drag; suited for short-term tactical positions only." },
  { symbol: "GDX",  name: "VanEck Gold Miners ETF",        exchange: "NYSE",   category: "commodities",
    description: "Tracks gold mining companies worldwide. A leveraged play on gold — miners' profits expand faster than the gold price in rallies. Also exposed to operational, geopolitical, and currency risks." },
];

export const INTERNATIONAL_ETFS: ETFConfig[] = [
  { symbol: "EFA",  name: "iShares MSCI EAFE",             exchange: "NYSE",   category: "international",
    description: "Tracks developed-market equities outside the US and Canada — Europe, Japan, Australia, and more. Broad international diversification with currency exposure. Heavy weights in Japan, UK, and France." },
  { symbol: "EEM",  name: "iShares MSCI Emerging Markets", exchange: "NYSE",   category: "international",
    description: "Tracks large and mid-cap stocks across 24 emerging market countries. Top weights in China, India, Brazil, and Taiwan. Higher growth potential but greater political, currency, and liquidity risk." },
  { symbol: "VEA",  name: "Vanguard Developed Markets",    exchange: "NYSE",   category: "international",
    description: "Vanguard's developed-market ETF, broadly similar to EFA with a lower expense ratio and slightly broader coverage. Core holding for low-cost international developed-market exposure." },
  { symbol: "VWO",  name: "Vanguard Emerging Markets",     exchange: "NYSE",   category: "international",
    description: "Vanguard's emerging-market ETF. Broadly similar to EEM but excludes South Korea (classified as developed by FTSE). Lower fees than EEM with comparable exposure to high-growth economies." },
  { symbol: "FXI",  name: "iShares China Large-Cap",       exchange: "NYSE",   category: "international",
    description: "Tracks the 50 largest Chinese companies listed in Hong Kong. Concentrated in financials, tech, and consumer discretionary. High single-country risk with regulatory and geopolitical volatility." },
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

export const ETF_DESCRIPTION_MAP: Record<string, string> = Object.fromEntries(
  ALL_ETFS.map((e) => [e.symbol, e.description])
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
