"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { IndicatorConfig, IndicatorResult } from "@/lib/fred";
import InfoTooltip from "./InfoTooltip";
import Sparkline from "./Sparkline";

function sparklineColor(framing: IndicatorConfig["framing"], change: number): string {
  if (framing === "neutral") return "#60a5fa";
  const isGood = framing === "positive" ? change >= 0 : change <= 0;
  return isGood ? "#10b981" : "#f87171";
}

function changeBadge(framing: IndicatorConfig["framing"], change: number, unit: string) {
  if (framing === "neutral") {
    const sign = change >= 0 ? "+" : "";
    return { label: `${sign}${change.toFixed(2)}${unit}`, color: "text-blue-500 dark:text-blue-400 bg-blue-500/10" };
  }
  const isGood = framing === "positive" ? change >= 0 : change <= 0;
  const sign = change >= 0 ? "▲ +" : "▼ ";
  const label = `${sign}${Math.abs(change).toFixed(2)}${unit === "%" ? "pp" : " pts"}`;
  return {
    label,
    color: isGood
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      : "text-red-600 dark:text-red-400 bg-red-500/10",
  };
}

interface Props {
  config: IndicatorConfig;
  result: IndicatorResult;
}

export default function IndicatorCard({ config, result }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = sparklineColor(config.framing, result.change);
  const badge = changeBadge(config.framing, result.change, result.value < 200 ? "%" : "");
  const lastDate = new Date(result.lastDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [expanded]);

  return (
    <>
    <div
      onClick={() => setExpanded(true)}
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {config.label}
          </p>
          <InfoTooltip>
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{config.label}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">{config.tooltip.what}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Why it matters: </span>
              {config.tooltip.why}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-medium text-gray-700 dark:text-gray-300">Healthy range: </span>
              {config.tooltip.good}
            </p>
          </InfoTooltip>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-600">{lastDate}</span>
      </div>

      <div className="mb-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
          {result.value.toFixed(result.value < 100 ? 2 : 1)}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{config.unitDisplay}</span>
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-600">{config.changeLabel}</span>
        </div>
      </div>
      <Sparkline points={result.points} color={color} />
    </div>

    {expanded && createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => setExpanded(false)}
      >
        <div
          className="w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{config.label}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                {result.value.toFixed(result.value < 100 ? 2 : 1)}
                <span className="text-base font-normal text-gray-500 dark:text-gray-400 ml-1">{config.unitDisplay}</span>
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${badge.color}`}>{badge.label}</span>
                <span className="text-xs text-gray-400 dark:text-gray-600">{config.changeLabel} · {lastDate}</span>
              </div>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Large chart */}
          <div className="mb-5">
            <Sparkline points={result.points} color={color} height={260} />
          </div>

          {/* Description */}
          <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{config.tooltip.what}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-medium text-gray-700 dark:text-gray-300">Why it matters: </span>
              {config.tooltip.why}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="font-medium text-gray-700 dark:text-gray-300">Healthy range: </span>
              {config.tooltip.good}
            </p>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
