# Market Watch

A stock market tracker that shows top performers across major US indices, with AI-generated market summaries.

**Live:** [stock-app-one-khaki.vercel.app](https://stock-app-one-khaki.vercel.app)

## Features

- **4 indices** — S&P 500, Nasdaq 100, Dow Jones, Russell 2000
- **6 time ranges** — 1D, 3D, 1W, 1M, 3M, YTD
- **Industry filter** — multi-select filter by GICS industry group
- **AI summary** — Claude-generated market commentary, cached daily in DynamoDB
- **Index chart** — historical performance chart for the selected index and range
- **Dark / light mode**

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Polygon.io](https://polygon.io) — EOD stock data
- [AWS DynamoDB](https://aws.amazon.com/dynamodb) — data cache
- [Anthropic Claude](https://anthropic.com) — AI summaries
- [Vercel](https://vercel.com) — hosting

## Running locally

```bash
npm install
npm run dev
```

Create a `.env.local` with:

```
POLYGON_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
DYNAMODB_TABLE_NAME=StockDailyPrices
AI_SUMMARIES_TABLE_NAME=AiSummaries
ANTHROPIC_API_KEY=...
```
