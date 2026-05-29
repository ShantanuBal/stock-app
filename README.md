# Horizon

A financial market education platform covering equities, ETFs, options, futures, fixed income, currencies, commodities, and the broader economy — with real-time data, historical charts, and AI-generated insights.

**Live:** [usehorizon.dev](https://usehorizon.dev)

## Features

- **Equities** — Top performers across S&P 500, Nasdaq 100, Dow Jones, and Russell 2000. Filter by sector, sort by price change, beta, market cap, or volume, with a daily AI summary.
- **ETFs** — Broad market, sector, bond, commodity, and international ETFs with sparklines and AI commentary.
- **Options & Volatility** — At-the-money option premiums for top stocks and index ETFs, plus the VIX, with premium history and AI market reads.
- **Futures** — Equity index (ES, NQ, YM, RTY) and commodity futures (crude oil, gold, natural gas, silver) with sparklines, historical charts, and AI summaries.
- **Fixed Income & Credit** — Treasury yields across the full curve, corporate credit spreads, and IG vs high-yield dynamics.
- **Currencies & Forex** — Major forex pairs, emerging market currencies, and crypto (BTC, ETH, SOL, XRP) with historical performance.
- **Commodities** — Spot prices for precious metals and energy benchmarks with sparklines and plain-English explainers.
- **Macroeconomy** — Key FRED indicators: GDP, CPI, Core PCE, unemployment, Fed Funds rate, yield curve, and consumer sentiment.
- **Dark / light mode**

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Polygon.io](https://polygon.io) — equities, ETFs, options, forex, commodities data
- [Massive API](https://massive.com) — futures data
- [FRED](https://fred.stlouisfed.org) — macroeconomic indicators
- [AWS DynamoDB](https://aws.amazon.com/dynamodb) — data cache
- [AWS ECS Fargate](https://aws.amazon.com/fargate) — nightly data refresh jobs
- [Anthropic Claude](https://anthropic.com) — AI summaries
- [Vercel](https://vercel.com) — hosting

## Running locally

```bash
npm install
npm run dev
```
