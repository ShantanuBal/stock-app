"use client";

import { useState, useEffect, useRef } from "react";
import { addToWatchList } from "@/app/actions/watchlists";

interface TickerSearchResult {
  ticker: string;
  name: string;
}

// Search box that finds tickers by symbol or company name and adds them to a list.
export default function AddTickerSearch({ listId, existing, disabled, onAdded, className }: {
  listId: string;
  existing: string[];
  disabled?: boolean;
  onAdded: (ticker: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TickerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search against /api/ticker-search
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ticker-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  // Close results on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const existingSet = new Set(existing);

  async function handleAdd(ticker: string) {
    setAdding(ticker);
    const result = await addToWatchList(listId, ticker);
    setAdding(null);
    if (!result.error) {
      onAdded(ticker);
      setQuery("");
      setResults([]);
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className={`relative ${className ?? "mt-3"}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search ticker or company to add…"
        disabled={disabled}
        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
      />
      {open && query.trim() && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">No matches</p>
          ) : (
            results.map((r) => {
              const already = existingSet.has(r.ticker);
              return (
                <button
                  key={r.ticker}
                  onClick={() => { if (!already) handleAdd(r.ticker); }}
                  disabled={already || adding === r.ticker}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white shrink-0">{r.ticker}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.name}</span>
                  </span>
                  <span className={`text-xs font-medium shrink-0 ${already ? "text-gray-400 dark:text-gray-600" : "text-emerald-500"}`}>
                    {already ? "Added" : adding === r.ticker ? "Adding…" : "+ Add"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
