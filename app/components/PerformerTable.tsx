"use client";

import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { StockResult } from "@/lib/polygon";
import InfoTooltip from "./InfoTooltip";
import TickerTooltip, { type TickerTooltipHandle } from "./TickerTooltip";

type SortCol = "price" | "change" | "marketCap" | "pe" | "peg" | "beta" | "volume";
type SortDir = "asc" | "desc";

export interface WatchListMeta { listId: string; name: string; }

interface Props {
  title: string;
  titleExtra?: ReactNode;
  accent: "emerald" | "red";
  stocks: StockResult[];
  sectors?: Record<string, string>;
  betas?: Record<string, number | null>;
  marketCapShares?: Record<string, { weighted: number | null; shares: number | null; netIncome: number | null; epsGrowth: number | null }>;
  descriptions?: Record<string, string>;
  showBeta?: boolean;
  showSector?: boolean;
  companyLabel?: string;
  defaultSortCol?: SortCol;
  range?: string;
  linkBasePath?: string;
  // Watchlist support
  watchlists?: WatchListMeta[];
  watchlistAuthenticated?: boolean;
  activeListId?: string;
  onAddToList?: (ticker: string, listId: string) => void;
  onRemoveFromList?: (ticker: string) => void;
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/(?:^|[\s\-])(\w)/g, (m) => m.toUpperCase());
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

function formatMarketCap(v: number): string {
  if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  return `$${(v / 1_000_000).toFixed(0)}M`;
}

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol | null; sortDir: SortDir }) {
  if (sortCol !== col) {
    return (
      <svg className="w-3 h-3 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      {sortDir === "desc"
        ? <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M7 14l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function ColHeader({
  label, col, sortCol, sortDir, onSort, align = "right", children,
}: {
  label: string;
  col: SortCol;
  sortCol: SortCol | null;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
  align?: "left" | "right";
  children?: React.ReactNode;
}) {
  const isActive = sortCol === col;
  return (
    <th className={`px-3 py-3 text-${align}`}>
      <span className={`inline-flex items-center justify-end gap-1`}>
        <button
          onClick={() => onSort(col)}
          className={`inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors ${isActive ? "text-emerald-500" : ""}`}
        >
          {label}
          <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
        </button>
        {children && <InfoTooltip>{children}</InfoTooltip>}
      </span>
    </th>
  );
}

function SimpleColHeader({
  label, col, sortCol, sortDir, onSort, align = "right",
}: {
  label: string;
  col: SortCol;
  sortCol: SortCol | null;
  sortDir: SortDir;
  onSort: (col: SortCol) => void;
  align?: "left" | "right";
}) {
  const isActive = sortCol === col;
  return (
    <th className={`px-3 py-3 text-${align}`}>
      <button
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors ${isActive ? "text-emerald-500" : ""}`}
      >
        {label}
        <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
      </button>
    </th>
  );
}

function WatchlistButton({ ticker, watchlists, onAdd }: {
  ticker: string;
  watchlists: WatchListMeta[];
  onAdd: (ticker: string, listId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors text-sm font-semibold"
        title="Add to watchlist"
      >
        +
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-30 w-44 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
            Add to list
          </p>
          {watchlists.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-gray-400 dark:text-gray-500">No lists yet</p>
          ) : (
            watchlists.map((list) => (
              <button
                key={list.listId}
                onClick={(e) => { e.stopPropagation(); onAdd(ticker, list.listId); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {list.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function PerformerTable({ title, titleExtra, accent, stocks, sectors, betas, marketCapShares, descriptions, showBeta = true, showSector = true, companyLabel = "Company", defaultSortCol, range, linkBasePath = "/stock", watchlists, watchlistAuthenticated, activeListId, onAddToList, onRemoveFromList }: Props) {
  const accentColor = accent === "emerald" ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400";
  const [sortCol, setSortCol] = useState<SortCol | null>(defaultSortCol ?? null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visibleCount, setVisibleCount] = useState(20);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const tooltipRefs = useRef<Map<string, TickerTooltipHandle | null>>(new Map());
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTicker = useRef<string | null>(null);

  // Guest sign-in tooltip — fixed-position so it escapes the table's overflow clipping,
  // with a delayed hide so the cursor can travel into it to click "Sign in"
  const [signinTooltip, setSigninTooltip] = useState<{ right: number; y: number } | null>(null);
  const signinTooltipHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelSigninTooltipHide() {
    if (signinTooltipHideTimer.current) {
      clearTimeout(signinTooltipHideTimer.current);
      signinTooltipHideTimer.current = null;
    }
  }

  function scheduleSigninTooltipHide() {
    cancelSigninTooltipHide();
    signinTooltipHideTimer.current = setTimeout(() => setSigninTooltip(null), 300);
  }

  function getTooltipCallbacks(ticker: string) {
    return {
      onMouseEnter: () => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        if (showTimer.current) clearTimeout(showTimer.current);
        showTimer.current = setTimeout(() => {
          if (activeTicker.current && activeTicker.current !== ticker) {
            tooltipRefs.current.get(activeTicker.current)?.hide();
          }
          activeTicker.current = ticker;
          tooltipRefs.current.get(ticker)?.show();
        }, 300);
      },
      onMouseLeave: () => {
        if (showTimer.current) clearTimeout(showTimer.current);
        hideTimer.current = setTimeout(() => {
          tooltipRefs.current.get(ticker)?.hide();
          if (activeTicker.current === ticker) activeTicker.current = null;
        }, 150);
      },
    };
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => d === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const filteredStocks = useMemo(() => {
    if (!search.trim()) return stocks;
    const q = search.trim().toLowerCase();
    return stocks.filter((s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }, [stocks, search]);

  const sortedStocks = useMemo(() => {
    if (!sortCol) return filteredStocks;
    return [...filteredStocks].sort((a, b) => {
      let av: number | null = null;
      let bv: number | null = null;
      if (sortCol === "price") { av = a.price; bv = b.price; }
      else if (sortCol === "change") { av = a.changePercent; bv = b.changePercent; }
      else if (sortCol === "volume") { av = a.volume; bv = b.volume; }
      else if (sortCol === "beta") {
        av = betas?.[a.ticker] ?? null;
        bv = betas?.[b.ticker] ?? null;
      } else if (sortCol === "marketCap") {
        const da = marketCapShares?.[a.ticker];
        const db = marketCapShares?.[b.ticker];
        av = da ? (da.weighted ?? da.shares) != null ? (da.weighted ?? da.shares)! * a.price : null : null;
        bv = db ? (db.weighted ?? db.shares) != null ? (db.weighted ?? db.shares)! * b.price : null : null;
      } else if (sortCol === "pe") {
        const da = marketCapShares?.[a.ticker];
        const db = marketCapShares?.[b.ticker];
        const mcA = da ? (da.weighted ?? da.shares) != null ? (da.weighted ?? da.shares)! * a.price : null : null;
        const mcB = db ? (db.weighted ?? db.shares) != null ? (db.weighted ?? db.shares)! * b.price : null : null;
        av = mcA != null && da?.netIncome != null && da.netIncome > 0 ? mcA / da.netIncome : null;
        bv = mcB != null && db?.netIncome != null && db.netIncome > 0 ? mcB / db.netIncome : null;
      } else if (sortCol === "peg") {
        const da = marketCapShares?.[a.ticker];
        const db = marketCapShares?.[b.ticker];
        const mcA = da ? (da.weighted ?? da.shares) != null ? (da.weighted ?? da.shares)! * a.price : null : null;
        const mcB = db ? (db.weighted ?? db.shares) != null ? (db.weighted ?? db.shares)! * b.price : null : null;
        const peA = mcA != null && da?.netIncome != null && da.netIncome > 0 ? mcA / da.netIncome : null;
        const peB = mcB != null && db?.netIncome != null && db.netIncome > 0 ? mcB / db.netIncome : null;
        av = peA != null && da?.epsGrowth != null && da.epsGrowth > 0 ? peA / da.epsGrowth : null;
        bv = peB != null && db?.epsGrowth != null && db.epsGrowth > 0 ? peB / db.epsGrowth : null;
      }
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [filteredStocks, sortCol, sortDir, betas, marketCapShares]);

  const visibleStocks = sortedStocks.slice(0, visibleCount);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <h2 className={`text-sm font-semibold uppercase tracking-wider ${accentColor}`}>{title}</h2>
          {titleExtra}
        </div>
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company / ticker"
            className="pl-7 pr-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-52"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-3 py-3 text-left w-7">#</th>
              <th className="px-3 py-3 text-left">Ticker</th>
              <th className="px-3 py-3 text-left">{companyLabel}</th>
              {showSector && <th className="px-3 py-3 text-left">Industry</th>}
              <SimpleColHeader label="Price" col="price" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              <SimpleColHeader label="% Change" col="change" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
              {marketCapShares !== undefined && (
                <ColHeader label="Mkt Cap" col="marketCap" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Market capitalisation — the total value of all outstanding shares at the current price. Calculated as share price × shares outstanding.
                  </p>
                </ColHeader>
              )}
              {marketCapShares !== undefined && (
                <ColHeader label="P/E" col="pe" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
                    Price-to-earnings ratio — how much investors are paying for each dollar of annual profit. Calculated as market cap ÷ trailing twelve months net income.
                  </p>
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Low P/E (&lt;15)</span> — cheap relative to earnings, or slow growth expected</p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">High P/E (&gt;30)</span> — expensive, or high growth expected</p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">N/A</span> — company is currently unprofitable (negative earnings)</p>
                  </div>
                </ColHeader>
              )}
              {marketCapShares !== undefined && (
                <ColHeader label="PEG" col="peg" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
                    Price/earnings-to-growth ratio — adjusts P/E for the company&apos;s earnings growth rate. Calculated as P/E ÷ trailing YoY net income growth (%).
                  </p>
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">PEG &lt; 1</span> — potentially undervalued relative to growth</p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">PEG = 1</span> — fairly valued</p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">PEG &gt; 1</span> — potentially overvalued relative to growth</p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">—</span> — not meaningful (negative or zero growth)</p>
                  </div>
                </ColHeader>
              )}
              {showBeta && (
                <ColHeader label="Beta" col="beta" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Beta measures how volatile a stock is relative to the overall market (S&P 500).
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Beta &gt; 1</span> — moves more than the market</p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Beta = 1</span> — moves with the market</p>
                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Beta &lt; 1</span> — moves less than the market</p>
                  </div>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Calculated from 1 year of daily returns vs SPY. Cached for up to 7 days — beta is a slow-moving metric so doesn&apos;t need daily recomputation.</p>
                </ColHeader>
              )}
              <ColHeader label="Volume" col="volume" sortCol={sortCol} sortDir={sortDir} onSort={handleSort}>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  The number of shares traded on the most recent trading day. High volume on a price move signals stronger conviction — low volume may suggest the move is less reliable.
                </p>
              </ColHeader>
              {watchlistAuthenticated !== undefined && <th className="px-2 py-3 w-8" />}
            </tr>
          </thead>
          <tbody>
            {visibleStocks.length === 0 && (
              <tr>
                <td colSpan={6 + (showSector ? 1 : 0) + (marketCapShares !== undefined ? 3 : 0) + (showBeta ? 1 : 0)} className="px-3 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  No results for &ldquo;{search}&rdquo;
                </td>
              </tr>
            )}
            {visibleStocks.map((stock, i) => {
              const isPos = stock.changePercent >= 0;
              const color = isPos ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
              const bg = isPos ? "bg-emerald-500/10" : "bg-red-500/10";
              const beta = betas?.[stock.ticker];
              const capData = marketCapShares?.[stock.ticker];
              const capShares = capData ? (capData.weighted ?? capData.shares) : null;
              const marketCap = capShares != null ? capShares * stock.price : null;
              // P/E is only meaningful with positive trailing earnings; negative
              // net income (e.g. post-spinoff like SNDK) is reported as N/A.
              const pe = marketCap != null && capData?.netIncome != null && capData.netIncome > 0 ? marketCap / capData.netIncome : null;
              const peg = pe != null && capData?.epsGrowth != null && capData.epsGrowth > 0 ? pe / capData.epsGrowth : null;
              const rowTooltip = getTooltipCallbacks(stock.ticker);
              return (
                <tr
                  key={stock.ticker}
                  className="border-b border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-900/30 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey) {
                      window.open(`${linkBasePath}/${stock.ticker}`, "_blank");
                    } else {
                      router.push(`${linkBasePath}/${stock.ticker}`);
                    }
                  }}
                  {...rowTooltip}
                >
                  <td className="px-3 py-3 text-gray-400 dark:text-gray-500">{i + 1}</td>
                  <td className="px-3 py-3 font-bold text-gray-900 dark:text-white">
                    <TickerTooltip
                      ref={(el) => { tooltipRefs.current.set(stock.ticker, el); }}
                      ticker={stock.ticker}
                      name={stock.name}
                      price={stock.price}
                      changePercent={stock.changePercent}
                      initialRange={range}
                      href={`${linkBasePath}/${stock.ticker}`}
                      description={descriptions?.[stock.ticker]}
                    />
                  </td>
                  <td className="px-3 py-3 text-gray-500 dark:text-gray-300 max-w-[140px] truncate">
                    {stock.name || "—"}
                  </td>
                  {showSector && (
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 max-w-[140px] truncate text-xs">
                      {sectors?.[stock.ticker] ? toTitleCase(sectors[stock.ticker]) : "N/A"}
                    </td>
                  )}
                  <td className="px-3 py-3 text-right text-gray-900 dark:text-white tabular-nums">
                    ${stock.price.toFixed(2)}
                  </td>
                  <td className={`px-3 py-3 text-right font-semibold ${color}`}>
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${bg}`}>
                      {isPos ? "▲" : "▼"} {Math.abs(stock.changePercent).toFixed(2)}%
                    </span>
                  </td>
                  {marketCapShares !== undefined && (
                    <td className="px-3 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                      {marketCap == null ? (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      ) : (
                        formatMarketCap(marketCap)
                      )}
                    </td>
                  )}
                  {marketCapShares !== undefined && (
                    <td className="px-3 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                      {pe == null ? (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      ) : (
                        <span>{pe.toFixed(1)}x</span>
                      )}
                    </td>
                  )}
                  {marketCapShares !== undefined && (
                    <td className="px-3 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                      {peg == null ? (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      ) : (
                        <span className={peg < 1 ? "text-emerald-500 dark:text-emerald-400" : peg > 2 ? "text-red-400 dark:text-red-500" : ""}>{peg.toFixed(2)}</span>
                      )}
                    </td>
                  )}
                  {showBeta && (
                    <td className="px-3 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                      {betas === undefined ? (
                        <span className="text-gray-300 dark:text-gray-600">···</span>
                      ) : beta === null || beta === undefined ? (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      ) : (
                        beta.toFixed(2)
                      )}
                    </td>
                  )}
                  <td className="px-3 py-3 text-right text-gray-500 dark:text-gray-400 tabular-nums">
                    {formatVolume(stock.volume)}
                  </td>
                  {watchlistAuthenticated !== undefined && (
                    <td
                      className="px-2 py-3"
                      onClick={(e) => e.stopPropagation()}
                      // Suppress the row's chart tooltip while over this cell; re-arm it on the way out
                      onMouseEnter={rowTooltip.onMouseLeave}
                      onMouseLeave={rowTooltip.onMouseEnter}
                    >
                      {activeListId ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveFromList?.(stock.ticker); }}
                          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors text-sm font-semibold"
                          title="Remove from watchlist"
                        >
                          −
                        </button>
                      ) : watchlistAuthenticated ? (
                        <WatchlistButton
                          ticker={stock.ticker}
                          watchlists={watchlists ?? []}
                          onAdd={onAddToList ?? (() => {})}
                        />
                      ) : (
                        <span
                          className="cursor-not-allowed"
                          onMouseEnter={(e) => {
                            cancelSigninTooltipHide();
                            const r = e.currentTarget.getBoundingClientRect();
                            setSigninTooltip({ right: window.innerWidth - r.right, y: r.bottom + 8 });
                          }}
                          onMouseLeave={scheduleSigninTooltipHide}
                        >
                          <button
                            disabled
                            className="w-6 h-6 flex items-center justify-center rounded text-gray-300 dark:text-gray-600 pointer-events-none text-sm font-semibold"
                          >
                            +
                          </button>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Fixed-position tooltip — escapes overflow clipping */}
      {signinTooltip && (
        <div
          className="fixed z-50 w-max rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 pointer-events-auto"
          style={{ right: signinTooltip.right, top: signinTooltip.y }}
          onMouseEnter={cancelSigninTooltipHide}
          onMouseLeave={scheduleSigninTooltipHide}
        >
          <div className="absolute -top-1.5 right-4 w-3 h-3 rotate-45 bg-white dark:bg-gray-900 border-l border-t border-gray-200 dark:border-gray-700" />
          <a href="/login" className="text-emerald-500 hover:text-emerald-400 font-medium">Sign in</a> to save watchlists
        </div>
      )}
      {sortedStocks.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((c) => c + 30)}
          className="mt-3 w-full rounded-lg border border-gray-200 dark:border-gray-800 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Show more ({sortedStocks.length - visibleCount} remaining)
        </button>
      )}
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
        Data from <a href="https://polygon.io" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 dark:hover:text-gray-500 transition-colors">Polygon.io</a> · Prices delayed 15 min
      </p>
    </div>
  );
}
