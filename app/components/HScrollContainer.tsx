"use client";

import { useRef, useState, useEffect, ReactNode } from "react";

// Variant → gradient from-color (full strings so Tailwind picks them up)
const FROM: Record<string, string> = {
  page: "from-slate-50 dark:from-gray-950",
  card: "from-gray-50 dark:from-gray-900",
};

export default function HScrollContainer({
  children,
  className,
  variant = "page",
}: {
  children: ReactNode;
  className?: string;
  variant?: "page" | "card";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showArrow, setShowArrow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () =>
      setShowArrow(el.scrollWidth > el.clientWidth + 4 && el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  return (
    <div className="relative">
      <div ref={ref} className={`flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide ${className ?? ""}`}>
        {children}
      </div>
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l ${FROM[variant]} to-transparent flex items-center justify-end transition-opacity duration-150 ${showArrow ? "opacity-100" : "opacity-0"}`}
      >
        <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
