"use client";

import { useEffect } from "react";

const GICS = [
  { sector: "Information Technology", groups: ["Software", "Semiconductors", "Tech Hardware"] },
  { sector: "Health Care",            groups: ["Pharma & Biotech", "Health Services"] },
  { sector: "Financials",             groups: ["Banks", "Financial Services", "Insurance"] },
  { sector: "Industrials",            groups: ["Capital Goods", "Transportation", "Prof. Services"] },
  { sector: "Consumer Discretionary", groups: ["Consumer Services", "Retail", "Consumer Goods"] },
  { sector: "Consumer Staples",       groups: ["Food & Beverage", "Household Products"] },
  { sector: "Communication Services", groups: ["Media", "Telecom"] },
  { sector: "Energy",                 groups: ["Energy"] },
  { sector: "Materials",              groups: ["Materials"] },
  { sector: "Real Estate",            groups: ["REITs"] },
  { sector: "Utilities",              groups: ["Utilities"] },
];

export default function IndustryModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-lg leading-none"
        >
          ✕
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">About</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Industry Groups</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
          We classify companies using <span className="font-medium text-gray-700 dark:text-gray-300">GICS Industry Groups</span> — one level below the 11 broad sectors, giving a more useful view without being overwhelming. Each sector below contains the industry groups we use.
        </p>

        <div className="overflow-y-auto space-y-3 pr-1">
          {GICS.map(({ sector, groups }) => (
            <div key={sector}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{sector}</p>
              <div className="flex flex-wrap gap-1.5">
                {groups.map((g) => (
                  <span key={g} className="rounded-md bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-300">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
