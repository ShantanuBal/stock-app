"use client";

import { useState } from "react";
import Link from "next/link";

const SECTIONS = [
  { id: "markets-101", label: "Markets 101" },
  { id: "deep-dives", label: "Deep Dives" },
  { id: "reserve-currency", label: "US Dollar" },
  { id: "geopolitics", label: "Geopolitics" },
  { id: "case-studies", label: "Case Studies" },
];

const MARKET_HIERARCHY = [
  {
    rank: 1, emoji: "🏦", name: "Forex (Currency) Market",
    size: "$7.5 trillion / day",
    insight: "The largest financial market in the world — bigger than equities, bonds, and commodities combined. Every international trade settlement, tourism transaction, and central bank reserve operation flows through here.",
  },
  {
    rank: 2, emoji: "🏛️", name: "Bond / Fixed Income Market",
    size: "$130 trillion outstanding · $900B / day",
    insight: "Bigger than the stock market. Governments and corporations borrow here. Bond markets can — and do — fire prime ministers. Most retail investors ignore this market entirely.",
  },
  {
    rank: 3, emoji: "📈", name: "Stock / Equity Market",
    size: "$109 trillion outstanding · $400B / day",
    insight: "The market most retail investors know. Ownership stakes in publicly traded companies. The US accounts for ~45–50% of global market cap.",
  },
  {
    rank: 4, emoji: "🏠", name: "Real Estate",
    size: "$326 trillion (illiquid)",
    insight: "The largest asset class globally — but not a traded market in the traditional sense. Highly illiquid. REITs give stock-market access to real estate exposure.",
  },
  {
    rank: 5, emoji: "🛢️", name: "Commodities",
    size: "Varies · Oil ~$1 trillion / day",
    insight: "Physical goods: energy (oil, gas), metals (gold, copper), agriculture (wheat, corn). All major commodities are priced in US dollars — a cornerstone of the petrodollar system.",
  },
  {
    rank: 6, emoji: "📊", name: "Derivatives (Options, Futures, Swaps)",
    size: "$600+ trillion notional",
    insight: "Financial contracts whose value derives from underlying assets. The notional value dwarfs every other market. Used for hedging risk and speculation.",
  },
  {
    rank: 7, emoji: "🥇", name: "Gold",
    size: "~$13 trillion",
    insight: "The original safe haven asset. Central banks hold it as a reserve. Inversely correlated with dollar strength — when the dollar weakens, gold rises.",
  },
  {
    rank: 8, emoji: "₿", name: "Crypto",
    size: "~$3 trillion",
    insight: "24/7 trading. High volatility. Bitcoin is increasingly treated as 'digital gold' by institutional investors, though volatility limits reserve currency viability.",
  },
];

const DEEP_DIVES = [
  {
    title: "Equities (Stock Market)",
    href: "/",
    linkLabel: "View Equities →",
    points: [
      "Ownership stakes in publicly traded companies",
      "Traded on exchanges: NYSE, Nasdaq, LSE, NSE, and others",
      "Key instruments: individual stocks, ETFs, index funds",
      "Benchmarks: S&P 500, Nasdaq 100, Dow Jones, Russell 2000",
      "Key metrics: P/E ratio, PEG ratio, market cap, EPS, free cash flow",
      "US dominates: ~45–50% of global market capitalisation",
    ],
  },
  {
    title: "Fixed Income (Bond Market)",
    href: "/bonds",
    linkLabel: "View Fixed Income →",
    points: [
      "Debt instruments issued by governments and corporations",
      "Government bonds: Treasuries (US), Gilts (UK), JGBs (Japan)",
      "Types: T-Bills (<1yr), T-Notes (2–10yr), T-Bonds (20–30yr), TIPS (inflation-protected)",
      "Corporate bonds: investment grade vs. high yield (junk)",
      "Key concept: bond yield moves INVERSE to price — when prices fall, yields rise",
      "Yield curve shape signals economic health: normal = upward sloping, inverted = recession warning",
    ],
  },
  {
    title: "Currencies (Forex)",
    href: "/currencies",
    linkLabel: "View Currencies →",
    points: [
      "Exchange rates between currency pairs, always quoted in pairs (e.g. EUR/USD)",
      "Base currency vs. quote currency — EUR/USD of 1.08 means 1 euro buys $1.08",
      "Influenced by: interest rate differentials, inflation, political stability, trade flows",
      "US dollar = world's reserve currency (~58% of global forex reserves)",
      "Petrodollar system: oil is priced in dollars globally, creating permanent dollar demand",
      "Crypto (BTC, ETH, SOL, XRP) is included in this tab on Horizon",
    ],
  },
  {
    title: "Commodities",
    href: "/commodities",
    linkLabel: "View Commodities →",
    points: [
      "Physical goods: energy (oil, natural gas), metals (gold, silver, copper), agriculture (wheat, corn, coffee)",
      "Primarily traded via futures contracts — spot price vs. futures price",
      "Ways to invest: spot/physical, futures contracts, commodity ETFs (GLD, USO), producer stocks",
      "Gold = safe haven asset, inversely correlated with dollar strength and real interest rates",
      "Oil is the most geopolitically sensitive commodity — Middle East tensions move prices overnight",
      "Commodity prices feed directly into inflation — a rising oil price means rising CPI",
    ],
  },
  {
    title: "Derivatives (Options & Futures)",
    href: "/options",
    linkLabel: "View Options →",
    points: [
      "Financial contracts deriving value from an underlying asset (stock, index, commodity, currency)",
      "Options: right but NOT obligation to buy (call) or sell (put) at a strike price before expiry",
      "Futures: obligation to buy/sell at a predetermined price on a future date",
      "Swaps: exchange of cash flows — interest rate swaps, credit default swaps (CDS)",
      "Key options concepts: premium, strike price, expiry, and the Greeks (delta, gamma, theta, vega)",
      "VIX (the 'fear index') measures expected 30-day volatility of the S&P 500 using options pricing",
    ],
  },
  {
    title: "ETFs (Exchange-Traded Funds)",
    href: "/etfs",
    linkLabel: "View ETFs →",
    points: [
      "Baskets of assets that trade like stocks on an exchange — buy the whole market in one click",
      "Types: equity (SPY, QQQ), bond (BND, TLT), commodity (GLD, USO), thematic (ARKK, QTUM)",
      "Key metrics: expense ratio, NAV (net asset value), tracking error, bid-ask spread, AUM",
      "Most retail-friendly instrument — VOO gives you the whole S&P 500 for 0.03% per year",
      "Sector ETFs (XLK for tech, XLE for energy) let you bet on industries without picking stocks",
      "International ETFs (EEM, VEA) add geographic diversification with a single trade",
    ],
  },
  {
    title: "Real Estate",
    href: null,
    linkLabel: null,
    points: [
      "Physical property: residential, commercial, industrial, agricultural",
      "REITs (Real Estate Investment Trusts): invest in real estate through the stock market",
      "Heavily influenced by interest rates — higher rates = higher mortgage costs = lower demand",
      "Inflation hedge: property values and rents tend to rise with inflation",
      "Largest asset class globally (~$326 trillion) but illiquid — can't sell a building in a day",
      "Commercial real estate (offices, retail) has faced structural headwinds from remote work and e-commerce",
    ],
  },
  {
    title: "Crypto",
    href: "/currencies",
    linkLabel: "View Currencies →",
    points: [
      "Digital assets: Bitcoin, Ethereum, Solana, XRP and thousands of others",
      "Total market cap ~$3 trillion — Bitcoin alone is ~$1.5–2T",
      "24/7 trading — unlike traditional markets, crypto never closes",
      "High volatility: 20–30% moves in weeks are common; 80%+ drawdowns in bear markets",
      "Bitcoin increasingly treated as 'digital gold' — fixed supply of 21 million coins",
      "Ethereum is programmable money — smart contracts, DeFi, NFTs all run on it",
    ],
  },
];

const RESERVE_CURRENCY_TABLE = [
  { flag: "🇺🇸", currency: "US Dollar", pct: "~58%" },
  { flag: "🇪🇺", currency: "Euro", pct: "~20%" },
  { flag: "🇯🇵", currency: "Japanese Yen", pct: "~6%" },
  { flag: "🇬🇧", currency: "British Pound", pct: "~5%" },
  { flag: "🇨🇳", currency: "Chinese Yuan", pct: "~3%" },
];

const DOLLAR_CHAIN = `World needs dollars for international trade
              ↓
Countries accumulate dollar reserves
              ↓
They invest reserves in US Treasury Bonds
              ↓
Permanent demand for US bonds (~$7.5T foreign-held)
              ↓
US can borrow cheaply (low yields)
              ↓
US government finances itself cheaply
              ↓
Americans enjoy lower mortgage and borrowing rates
              ↓
US economy benefits enormously`;

const GEO_CHAIN = `Geopolitical event
       ↓
Affects confidence and risk perception
       ↓
Capital flows shift
       ↓
Currencies move
       ↓
Bond yields reprice
       ↓
Stock markets react
       ↓
Commodities reprice
       ↓
Central banks respond
       ↓
New geopolitical reality`;

const TRUSS_BOND_CHAIN = `Unfunded £45B tax cuts announced
              ↓
Bond markets: massive new gilt issuance needed
              ↓
More supply → gilt prices crash → yields spike
              ↓
10-year gilt yield: 3.5% → 4.5% in days (+100 basis points)
              ↓
30-year gilt hit 5% — highest in decades`;

const TRUSS_PENSION_CHAIN = `Gilt prices crash
       ↓
LDI pension fund collateral value falls
       ↓
Margin calls triggered
       ↓
Forced gilt selling → more prices fall
       ↓
Death spiral: more selling → lower prices → more margin calls
       ↓
Bank of England emergency intervention: bought £65B in gilts`;

const TRUSS_GBP_CHAIN = `Foreign investors fled UK assets
       ↓
Converted pounds to dollars and euros
       ↓
Pound supply surged, demand collapsed
       ↓
GBP/USD hit $1.03 — lowest EVER recorded
       ↓
(Historically pound was $2.00 in 2007)`;

const TRUSS_INFLATION_CHAIN = `Pound weakens
       ↓
Imports more expensive (UK imports heavily)
       ↓
Energy costs rise (priced in dollars)
       ↓
Inflation rises further
       ↓
Bank of England forced to raise rates
       ↓
Higher mortgage costs → economy contracts`;

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mb-1">
      {children}
    </h2>
  );
}

function FlowDiagram({ content }: { content: string }) {
  return (
    <pre className="text-sm font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 overflow-x-auto text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre">
      {content}
    </pre>
  );
}

function CalloutBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4">
      {children}
    </div>
  );
}

// ─── Section: Markets 101 ────────────────────────────────────────────────────

function Markets101() {
  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Financial Markets 101</SectionLabel>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-snug mb-2">
          The Hierarchy of Global Markets
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Ranked by total size or daily volume. Most retail investors only know about stocks — they&apos;re missing the bigger picture.
        </p>
      </div>

      <CalloutBox>
        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Key insight</p>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          The bond market is bigger than the stock market. Forex dwarfs everything. Derivatives dwarf forex.
          The markets most retail investors focus on are actually the smaller ones.
        </p>
      </CalloutBox>

      <div className="space-y-3">
        {MARKET_HIERARCHY.map((m) => (
          <Card key={m.rank} className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
              {m.rank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-base">{m.emoji}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.name}</span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {m.size}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{m.insight}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Deep Dives ─────────────────────────────────────────────────────

function DeepDives() {
  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Market Deep Dives</SectionLabel>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-snug mb-2">
          How Each Market Works
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          The mechanics, instruments, and key concepts behind each of the major asset classes — with links to live data on Horizon.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEEP_DIVES.map((d) => (
          <Card key={d.title}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{d.title}</p>
              {d.href && d.linkLabel && (
                <Link
                  href={d.href}
                  className="shrink-0 text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  {d.linkLabel}
                </Link>
              )}
            </div>
            <ul className="space-y-1.5">
              {d.points.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  <span className="shrink-0 text-emerald-500 mt-0.5">·</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Section: US Dollar as Reserve Currency ──────────────────────────────────

function ReserveCurrency() {
  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>The US Dollar</SectionLabel>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-snug mb-2">
          The World&apos;s Reserve Currency
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Why does the whole world use dollars? How did that happen? And what does it mean for financial markets?
        </p>
      </div>

      {/* What is a reserve currency */}
      <Card>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">What does &quot;reserve currency&quot; mean?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
          When countries trade internationally, they need a common currency to settle transactions. The reserve
          currency is that agreed-upon universal medium — the world&apos;s money.
        </p>
        <CalloutBox>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            <span className="font-semibold">Example:</span> A Brazilian coffee exporter selling to a Japanese buyer
            settles the transaction in US dollars — even though neither party is American. That&apos;s reserve currency
            status in action.
          </p>
        </CalloutBox>
      </Card>

      {/* Reserve currency breakdown table */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">
          Global Reserve Currency Breakdown (2026)
        </p>
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Currency</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Share of reserves</th>
              </tr>
            </thead>
            <tbody>
              {RESERVE_CURRENCY_TABLE.map((row, i) => (
                <tr key={row.currency} className={i < RESERVE_CURRENCY_TABLE.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="mr-2">{row.flag}</span>{row.currency}
                    {i === 0 && <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">~3× the next</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white">{row.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Historical arc */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">
          How the Dollar Got Here — The Historical Arc
        </p>
        <div className="space-y-3">
          {[
            {
              era: "Pre-1944: Gold Standard",
              body: "Currencies were backed by gold. Countries held gold reserves. Limited money printing. Stable but inflexible — a government couldn't respond to a recession by printing money.",
            },
            {
              era: "1944: Bretton Woods Agreement",
              body: "After WW2, world leaders met at the Bretton Woods hotel in New Hampshire. The US held 2/3 of the world's gold and had emerged as the dominant economic and military power. Agreement: all currencies pegged to the US dollar, dollar pegged to gold at $35/oz. The dollar becomes THE reserve currency.",
            },
            {
              era: "1971: Nixon Shock",
              body: "The Vietnam War was expensive. The US was spending beyond its gold reserves. France started demanding gold for their dollars — exposing the bluff. Nixon simply announced the US would no longer exchange dollars for gold, 'closing the gold window.' Overnight the entire global monetary system changed.",
            },
            {
              era: "1973–Present: The Petrodollar System",
              body: "Nixon needed something to replace gold as dollar backing. Kissinger negotiated a deal with Saudi Arabia: Saudi Arabia agrees to ONLY sell oil in US dollars; the US agrees to provide military protection to Saudi Arabia. Since every country needs oil → every country needs dollars → permanent global dollar demand. This is the petrodollar system — and it's why oil is always priced in dollars globally.",
            },
          ].map((h) => (
            <Card key={h.era}>
              <p className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 mb-1.5">{h.era}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{h.body}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* The bond market connection */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">
          The Bond Market Connection — The Key Insight
        </p>
        <Card className="mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
            Countries holding dollar reserves don&apos;t just stuff cash under a mattress. They invest those dollars in
            the safest dollar asset available: <span className="font-semibold text-gray-700 dark:text-gray-300">US Treasury Bonds.</span>
          </p>
        </Card>
        <FlowDiagram content={DOLLAR_CHAIN} />
        <Card className="mt-4">
          <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1.5">
            &quot;Exorbitant Privilege&quot;
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            This term was coined by French Finance Minister Valéry Giscard d&apos;Estaing in the 1960s. He was furious
            that America could print dollars, buy real goods from France, and France had to recycle those dollars
            back into US bonds. The privilege persists today — the US can run deficits no other country could sustain.
          </p>
        </Card>
      </div>

      {/* Advantages & Threats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Advantages for the US</p>
          <ul className="space-y-1.5">
            {[
              "Guaranteed global demand for dollars AND US Treasury bonds",
              "Artificially low borrowing costs for the US government",
              "Can run larger deficits than any other country",
              "Strong dollar makes imports cheap for Americans",
              "Geopolitical leverage — can weaponise dollar access (SWIFT exclusion, sanctions)",
              "Estimated to be worth trillions annually to the US economy",
            ].map((a, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                <span className="shrink-0 text-emerald-500 mt-0.5">·</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Threats to Dollar Dominance</p>
          <ul className="space-y-1.5">
            {[
              "China pushing yuan for international trade via CIPS (alternative to SWIFT)",
              "BRICS nations discussing alternative reserve arrangements",
              "US weaponising the dollar: freezing Russia's $300B in reserves accelerated diversification",
              "Bitcoin / crypto: fixed supply, no single country controls it — but volatility limits reserve viability",
              "Ray Dalio: 'Reserve currencies follow a cycle. Dutch guilder → British pound → US dollar. Each lasts ~80–100 years.'",
            ].map((a, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                <span className="shrink-0 text-gray-400 mt-0.5">·</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ─── Section: Geopolitics ────────────────────────────────────────────────────

function Geopolitics() {
  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Geopolitics &amp; Markets</SectionLabel>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-snug mb-2">
          How Geopolitics Moves Financial Markets
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Markets are not just economic machines — they are confidence machines. Geopolitical events move prices before
          economists have time to write a report about them.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">
          The Interconnection Framework
        </p>
        <FlowDiagram content={GEO_CHAIN} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: "Risk On / Risk Off",
            body: "The most important two-state mental model in macro investing. Risk ON: investors confident → buy stocks, sell bonds and gold → yields rise, gold falls. Risk OFF: investors fearful → sell stocks, buy bonds and gold → yields fall, gold rises. Geopolitical events trigger risk-off instantly.",
          },
          {
            title: "Currency as Confidence Barometer",
            body: "A strong currency signals market confidence in a country's economy and political stability. A weak currency signals the opposite. The US dollar strengthens in ANY global crisis — it's the ultimate safe haven. When everything is uncertain, the world holds dollars.",
          },
          {
            title: "Oil and Geopolitics",
            body: "Middle East tensions → oil price spike → inflation fears → bond yields rise. OPEC decisions move global inflation expectations overnight. The petrodollar system ties US foreign policy directly to oil markets — which is why the US has always had strategic interests in the Gulf.",
          },
          {
            title: "Sanctions as Financial Weapons",
            body: "After Russia's Ukraine invasion, the US and allies froze $300B in Russian central bank reserves and excluded Russia from SWIFT. This showed every country that dollar-denominated reserves could be weaponised. It accelerated global de-dollarisation discussions and is the single biggest long-term threat to dollar hegemony.",
          },
        ].map((m) => (
          <Card key={m.title}>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{m.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{m.body}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Historical Examples at a Glance</p>
        <div className="space-y-3">
          {[
            { event: "2008 Financial Crisis", impact: "MBS fraud → global contagion → $8 trillion in household wealth destroyed. Lehman Brothers collapses. Governments bail out banks globally." },
            { event: "COVID-19, March 2020", impact: "S&P 500 fell 34% in 33 days. Then the Fed announced unlimited QE — markets bottomed the SAME DAY. Fastest recovery ever recorded. Central bank communication IS market reality." },
            { event: "Russia-Ukraine War, 2022", impact: "Commodity price spike (wheat, oil, natural gas) → global inflation surge → central banks forced into fastest rate hiking cycle in 40 years → global recession fears." },
            { event: "US-China Trade War", impact: "Tariff announcements move markets instantly. A tweet from the US President about China tariffs can wipe $500B from global equity markets within minutes." },
            { event: "OPEC Oil Embargo, 1973", impact: "Created stagflation (high inflation + low growth) — a combination that broke the standard Keynesian playbook. Triggered the search for a new global monetary system and helped birth the petrodollar." },
          ].map((e) => (
            <div key={e.event} className="border-l-2 border-emerald-500/30 pl-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-0.5">{e.event}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{e.impact}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Section: Case Studies ───────────────────────────────────────────────────

function CaseStudies() {
  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Case Studies</SectionLabel>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-snug mb-2">
          When Markets Punished Governments
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          The clearest way to understand how bond markets, currencies, and investor confidence interact is to watch
          what happens when a government loses the market&apos;s trust.
        </p>
      </div>

      {/* Liz Truss */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">🇬🇧</span>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">The Liz Truss Pound Collapse (2022)</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">How an unfunded tax cut fired a Prime Minister in 45 days</p>
          </div>
        </div>

        <Card>
          <p className="text-xs font-semibold text-emerald-500 mb-2">Background</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Liz Truss became UK Prime Minister in September 2022 during already-elevated inflation. She appointed
            Kwasi Kwarteng as Chancellor and together they announced what became known as the &quot;mini-budget&quot; —
            the largest unfunded tax cuts in 50 years (£45 billion): abolishing the 45p top income tax rate, cutting
            stamp duty, reversing national insurance rises — with no independent OBR assessment and no spending cuts
            to offset lost revenue.
          </p>
        </Card>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">
            Bond Market Reaction (within hours)
          </p>
          <FlowDiagram content={TRUSS_BOND_CHAIN} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">
            The Pension Fund Crisis
          </p>
          <FlowDiagram content={TRUSS_PENSION_CHAIN} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">
            The Currency Collapse
          </p>
          <FlowDiagram content={TRUSS_GBP_CHAIN} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-2">
            The Inflation Feedback Loop
          </p>
          <FlowDiagram content={TRUSS_INFLATION_CHAIN} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">The Political Outcome</p>
            <ul className="space-y-1.5">
              {[
                "Kwarteng fired after 38 days",
                "Truss resigned after 45 days — shortest-serving PM in UK history",
                "Most policies reversed immediately by successor Rishi Sunak",
                "Bond market had effectively fired the Prime Minister",
              ].map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="shrink-0 text-emerald-500 mt-0.5">·</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </Card>
          <CalloutBox>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">The Key Lesson</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Bond markets are the world&apos;s most powerful check on government irresponsibility. They move faster
              than elections, harder than protests, and more decisively than any court.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed italic">
              &quot;I used to want to come back as the President. Now I want to come back as the bond market.
              You can intimidate everybody.&quot; — James Carville, Clinton adviser
            </p>
          </CalloutBox>
        </div>
      </div>

      {/* Other case studies teaser */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mb-3">
          More Case Studies
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { flag: "🇺🇸", title: "2008 Financial Crisis", teaser: "How subprime mortgages packaged into securities nearly collapsed the global financial system. MBS, CDOs, and the role of credit rating agencies." },
            { flag: "🇺🇸", title: "COVID-19 Market Crash & Recovery", teaser: "The fastest 34% crash in history, followed by the fastest recovery — driven by Fed QE and fiscal stimulus. What it revealed about central bank power." },
            { flag: "🇷🇺", title: "Russia-Ukraine & Commodity Shock", teaser: "How a war in Eastern Europe triggered global inflation, energy crises in Europe, and the fastest rate-hiking cycle since the 1980s." },
            { flag: "🇺🇸", title: "US-China Trade War", teaser: "Tariffs, supply chain disruption, and how geopolitical rivalry between the world's two largest economies reshapes global trade flows." },
          ].map((c) => (
            <Card key={c.title} className="border-dashed">
              <div className="flex items-center gap-2 mb-2">
                <span>{c.flag}</span>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{c.title}</p>
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500">Coming soon</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{c.teaser}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LearnContent() {
  const [activeSection, setActiveSection] = useState("markets-101");

  return (
    <div className="font-[family-name:var(--font-inter)]">
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 mb-1">
          Horizon University
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          How global financial markets work — from first principles
        </p>
      </div>

      {/* Section tabs */}
      <div className="sticky top-[48px] z-10 bg-slate-50 dark:bg-gray-950 -mx-4 px-4 pb-2 mb-6">
        <div className="rounded-xl bg-gray-100 dark:bg-gray-900 py-1 w-fit max-w-full overflow-x-auto">
          <div className="flex gap-1 px-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeSection === s.id
                    ? "bg-emerald-500 text-white shadow"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeSection === "markets-101" && <Markets101 />}
      {activeSection === "deep-dives" && <DeepDives />}
      {activeSection === "reserve-currency" && <ReserveCurrency />}
      {activeSection === "geopolitics" && <Geopolitics />}
      {activeSection === "case-studies" && <CaseStudies />}
    </div>
  );
}
