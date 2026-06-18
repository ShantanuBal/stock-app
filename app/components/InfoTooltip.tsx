"use client";

import { useRef, useState, useLayoutEffect } from "react";

interface Props {
  children: React.ReactNode;
  width?: string;
  element?: "button" | "span";
}

export default function InfoTooltip({ children, width = "w-96", element = "button" }: Props) {
  const ref = useRef<HTMLButtonElement | HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setRect(ref.current?.getBoundingClientRect() ?? null);
  }

  function hide() {
    hideTimer.current = setTimeout(() => { setRect(null); setPos(null); }, 150);
  }

  // Position after render so we can measure the tooltip's actual width and clamp
  // it inside the viewport (prevents the box from spilling off the right edge).
  useLayoutEffect(() => {
    if (!rect) { setPos(null); return; }
    const w = tipRef.current?.offsetWidth ?? 384;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - w - 8));
    setPos(
      rect.bottom > window.innerHeight * 0.65
        ? { left, bottom: window.innerHeight - rect.top + 8 }
        : { left, top: rect.bottom + 8 }
    );
  }, [rect]);

  const Tag = element;
  return (
    <Tag
      ref={ref as never}
      onMouseEnter={show}
      onMouseLeave={hide}
      className="flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      {rect && (
        <div
          ref={tipRef}
          className={`fixed z-50 ${width} max-w-[calc(100vw-1rem)] max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-left shadow-xl font-normal normal-case tracking-normal whitespace-normal break-words text-gray-900 dark:text-white font-[family-name:var(--font-inter)] ${pos ? "" : "opacity-0"}`}
          style={pos ? { left: pos.left, top: pos.top, bottom: pos.bottom } : { left: 0, top: rect.bottom + 8 }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {children}
        </div>
      )}
    </Tag>
  );
}
