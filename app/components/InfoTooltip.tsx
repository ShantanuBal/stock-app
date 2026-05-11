"use client";

import { useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  width?: string;
}

export default function InfoTooltip({ children, width = "w-96" }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setRect(ref.current?.getBoundingClientRect() ?? null);
  }

  function hide() {
    hideTimer.current = setTimeout(() => setRect(null), 150);
  }

  return (
    <button
      ref={ref}
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
          className={`fixed z-50 ${width} rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-left shadow-xl font-normal normal-case tracking-normal text-gray-900 dark:text-white`}
          style={{ top: rect.bottom + 8, left: rect.left }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {children}
        </div>
      )}
    </button>
  );
}
