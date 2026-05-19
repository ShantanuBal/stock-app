"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_TABS = [
  { label: "Equities",     href: "/"          },
  { label: "Economy",      href: "/economy"   },
  { label: "Futures",      href: "/futures"   },
  { label: "Currencies",   href: "/currencies"},
  { label: "Options",      href: "/options"   },
  { label: "Fixed Income", href: "/bonds"     },
  { label: "Global",       href: "/global"    },
];

export default function NavTabs() {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-20 bg-slate-50 dark:bg-gray-950 -mx-4 px-4 mb-1">
      <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-900 p-1 w-fit max-w-full overflow-x-auto scrollbar-hide">
        {NAV_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              pathname === tab.href
                ? "bg-emerald-500 text-white shadow"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
