"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HScrollContainer from "./HScrollContainer";

const NAV_TABS = [
  { label: "Equities",     href: "/"          },
  { label: "Options",      href: "/options"   },
  { label: "Currencies",   href: "/currencies"},
  { label: "Economy",      href: "/economy"   },
  { label: "Futures",      href: "/futures"   },
  { label: "Fixed Income", href: "/bonds"     },
  { label: "Global",       href: "/global"    },
];

export default function NavTabs() {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-20 bg-slate-50 dark:bg-gray-950 -mx-4 px-4 mb-1">
      <div className="rounded-xl bg-gray-100 dark:bg-gray-900 p-1">
        <HScrollContainer variant="page" className="gap-1">
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
        </HScrollContainer>
      </div>
    </div>
  );
}
