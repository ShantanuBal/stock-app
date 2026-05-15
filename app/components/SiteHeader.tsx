"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { logout } from "@/app/actions/auth";

const NAV_TABS = [
  { label: "Equities", href: "/" },
  { label: "Economy", href: "/economy" },
  { label: "Futures", href: "/futures" },
  { label: "Currencies", href: "/currencies" },
  { label: "Options", href: "/options" },
  { label: "Fixed Income", href: "/bonds" },
  { label: "Global", href: "/global" },
];

interface Props {
  username?: string;
  role?: string;
}

export default function SiteHeader({ username, role }: Props) {
  const { toggle, theme } = useTheme();
  const isDark = theme === "dark";
  const pathname = usePathname();

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between mb-5">
        <div>
          <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight hover:opacity-80 transition-opacity">Horizon</Link>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Financial foresight for everyone</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {username && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {role === "guest" ? "Guest" : username}
              </span>
              <form action={logout}>
                <button type="submit" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                  Sign out
                </button>
              </form>
              <span className="text-gray-300 dark:text-gray-700 text-xs">·</span>
            </div>
          )}
          <button
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
          )}
        </button>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-900 p-1 w-fit max-w-full overflow-x-auto scrollbar-hide">
        {NAV_TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-emerald-500 text-white shadow"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
