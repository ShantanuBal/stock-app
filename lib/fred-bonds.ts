import { getIndicator, type IndicatorConfig, type IndicatorResult } from "./fred";

export interface BondIndicatorConfig extends IndicatorConfig {
  maturityLabel?: string;
}

export const TREASURY_CONFIGS: BondIndicatorConfig[] = [
  {
    id: "DGS3MO",
    label: "3-Month T-Bill",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    maturityLabel: "3M",
    tooltip: {
      what: "The yield on 3-month US Treasury bills — the shortest-duration government debt and the closest proxy to the risk-free rate.",
      why: "The 3-month T-bill closely tracks the Fed Funds rate. When significantly above the 10-year yield, the curve is deeply inverted — a historically reliable recession signal.",
      good: "No absolute level. Watch it relative to the 10-year: when higher, the curve is inverted.",
    },
  },
  {
    id: "DGS6MO",
    label: "6-Month T-Bill",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    maturityLabel: "6M",
    tooltip: {
      what: "The yield on 6-month US Treasury bills.",
      why: "Short-duration yields are sensitive to near-term Fed policy. A 6-month yield above the 10-year signals the market expects rate cuts within 6 months.",
      good: "Context-dependent. Compare to the 10-year yield to gauge yield curve slope.",
    },
  },
  {
    id: "DGS1",
    label: "1-Year Treasury",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    maturityLabel: "1Y",
    tooltip: {
      what: "The yield on 1-year US Treasury notes.",
      why: "The 1-year yield reflects market expectations for Fed policy over the next year. It moves sharply around Fed decisions and economic data releases.",
      good: "Context-dependent. Well above the 10-year is a strong inversion signal.",
    },
  },
  {
    id: "DGS2",
    label: "2-Year Treasury",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    maturityLabel: "2Y",
    tooltip: {
      what: "The yield on 2-year US Treasury notes — the most sensitive duration to Fed policy expectations.",
      why: "The 2-year is Wall Street's real-time gauge of where the Fed Funds rate is heading. When it rises above the 10-year, recession fears intensify (the 2s10s inversion).",
      good: "No absolute level. The spread to the 10-year is what matters — negative means inverted, which has preceded every US recession since the 1950s.",
    },
  },
  {
    id: "DGS5",
    label: "5-Year Treasury",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    maturityLabel: "5Y",
    tooltip: {
      what: "The yield on 5-year US Treasury notes — the midpoint of the yield curve.",
      why: "The 5-year balances near-term Fed expectations with longer-run growth and inflation outlooks. It influences auto loan and corporate bond pricing.",
      good: "A normal curve shows 5-year yields below the 10-year and above the 2-year.",
    },
  },
  {
    id: "DGS10",
    label: "10-Year Treasury",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    maturityLabel: "10Y",
    tooltip: {
      what: "The yield on 10-year US Treasury notes — the most watched interest rate in the world.",
      why: "The 10-year is the global benchmark for long-term borrowing costs, influencing mortgage rates, corporate bonds, and stock valuations. Sharp rises pressure growth stocks.",
      good: "Lower yields support higher stock valuations. Historically 4–5% is 'normal.' Rapid moves above 5% tend to pressure equities.",
    },
  },
  {
    id: "DGS20",
    label: "20-Year Treasury",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    maturityLabel: "20Y",
    tooltip: {
      what: "The yield on 20-year US Treasury bonds.",
      why: "Long-duration bonds are most sensitive to inflation expectations. A 20-year yield well above the 10-year suggests sustained inflation fears.",
      good: "Normally slightly above the 10-year. Flat or inverted 20Y–10Y is unusual.",
    },
  },
  {
    id: "DGS30",
    label: "30-Year Treasury",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    maturityLabel: "30Y",
    tooltip: {
      what: "The yield on 30-year US Treasury bonds — the longest-duration US government debt.",
      why: "The 30-year is the market's long-run view on inflation and growth, and directly drives 30-year mortgage rates. Pension funds are major buyers.",
      good: "Normally the highest yield on the curve. Below shorter maturities is unusual and signals extreme risk aversion.",
    },
  },
];

export const CREDIT_CONFIGS: BondIndicatorConfig[] = [
  {
    id: "DFII10",
    label: "10-Year TIPS Yield",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    tooltip: {
      what: "The real yield on 10-year Treasury Inflation-Protected Securities. Unlike nominal bonds, TIPS principal adjusts with CPI — so their yield is a return after inflation.",
      why: "A positive TIPS yield means earning above inflation. Negative TIPS yields (common post-2008) meant investors accepted a real loss for safety. Rising real yields tighten financial conditions.",
      good: "Positive is healthier. Very negative real yields drove asset price inflation in 2020–2021. Above 2% is considered restrictive monetary policy.",
    },
  },
  {
    id: "T10YIE",
    label: "10-Year Breakeven",
    unitDisplay: "%",
    framing: "neutral",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    tooltip: {
      what: "The market's implied 10-year inflation expectation — the 10-year nominal Treasury yield minus the 10-year TIPS yield.",
      why: "This is the bond market's collective bet on where inflation will average over the next decade. Rising breakevens signal inflation fears; falling breakevens signal deflation worries.",
      good: "Around 2–2.5% aligns with the Fed's target. Above 3% suggests the market doesn't trust the Fed. Below 1.5% signals deflation concerns.",
    },
  },
  {
    id: "BAMLC0A0CM",
    label: "IG Credit Spread",
    unitDisplay: "%",
    framing: "negative",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    tooltip: {
      what: "The option-adjusted spread between investment-grade corporate bonds and equivalent Treasuries — the extra yield demanded for corporate credit risk.",
      why: "Credit spreads are a real-time fear gauge. Widening spreads signal growing default concerns. Tightening spreads indicate confidence. Spreads blow out sharply in recessions.",
      good: "Below 1% is tight — high confidence in corporate credit. 1–2% is normal. Above 3% signals stress. Above 5% is crisis territory.",
    },
  },
  {
    id: "BAMLH0A0HYM2",
    label: "HY Credit Spread",
    unitDisplay: "%",
    framing: "negative",
    changeLabel: "vs prev day",
    fetchLimit: 400,
    tooltip: {
      what: "The option-adjusted spread on high-yield ('junk') bonds — issued by below-investment-grade companies. The extra yield over Treasuries for taking on default risk.",
      why: "HY spreads are a leading indicator of economic distress. Spreads above 8–10% historically signal imminent recession. They blew out to ~20% in 2008 and ~10% at the COVID lows.",
      good: "Below 3.5% is tight (risk-on). 3.5–5% is normal. Above 7% is significant stress. Above 10% is crisis-level.",
    },
  },
];

export async function getAllBondData(): Promise<{
  treasuries: (IndicatorResult | null)[];
  credit: (IndicatorResult | null)[];
}> {
  const [treasuries, credit] = await Promise.all([
    Promise.all(TREASURY_CONFIGS.map((c) => getIndicator(c))),
    Promise.all(CREDIT_CONFIGS.map((c) => getIndicator(c))),
  ]);
  return { treasuries, credit };
}
