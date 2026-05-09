"use client";

import { useEffect, useRef } from "react";

interface Props {
  name: string;
  description: string;
  wikiUrl: string;
  onClose: () => void;
}

export default function InfoModal({ name, description, wikiUrl, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Close on Escape
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
        ref={cardRef}
        className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors text-lg leading-none"
        >
          ✕
        </button>

        {/* Content */}
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">About</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{name}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">{description}</p>

        <a
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors"
        >
          Read more on Wikipedia
          <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  );
}
