"use client";

import { useState, useEffect } from "react";

export default function FuturesAiSummary({ range }: { range: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setSummary(null);
    fetch(`/api/ai-futures-summary?range=${range}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSummary(d?.summary ?? null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 flex items-center gap-3">
        <svg className="animate-spin h-4 w-4 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-gray-500 dark:text-gray-400">Generating AI summary…</span>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">AI Summary</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">· Claude · Not financial advice</span>
      </div>
      <div className={`space-y-3 ${expanded ? "" : "line-clamp-5"}`}>
        {summary.split("\n\n").map((para, i) => (
          <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-[family-name:var(--font-inter)]">
            {para.trim()}
          </p>
        ))}
      </div>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-2 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
}
