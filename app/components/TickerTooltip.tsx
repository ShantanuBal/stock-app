"use client";

import { useRef, useState } from "react";
import type { TickerDetails } from "@/lib/tickerDetails";

export default function TickerTooltip({ ticker }: { ticker: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [details, setDetails] = useState<TickerDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFetched = useRef(false);

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setRect(ref.current?.getBoundingClientRect() ?? null);
    if (!hasFetched.current) {
      hasFetched.current = true;
      setLoading(true);
      fetch(`/api/ticker-details?ticker=${ticker}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setDetails(d))
        .finally(() => setLoading(false));
    }
  }

  function hide() {
    hideTimer.current = setTimeout(() => setRect(null), 150);
  }

  return (
    <>
      <span ref={ref} onMouseEnter={show} onMouseLeave={hide} className="cursor-help">
        {ticker}
      </span>
      {rect && (
        <div
          className="fixed z-50 w-96 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-left shadow-xl font-normal normal-case tracking-normal font-[family-name:var(--font-inter)]"
          style={{ top: rect.bottom + 8, left: rect.left }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-3 w-3 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs text-gray-400 dark:text-gray-500">Loading…</span>
            </div>
          ) : details ? (
            <>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                {details.description}
              </p>
              <div className="flex gap-4">
                {details.homepageUrl && (
                  <a
                    href={details.homepageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    Website ↗
                  </a>
                )}
                <a
                  href={`https://en.wikipedia.org/wiki/${encodeURIComponent(details.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  Wikipedia ↗
                </a>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500">No description available.</p>
          )}
        </div>
      )}
    </>
  );
}
