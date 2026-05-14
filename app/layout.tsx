import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import SiteHeader from "./components/SiteHeader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Horizon",
  description: "Financial foresight for everyone — track markets, the economy, and more.",
  openGraph: {
    title: "Horizon",
    description: "Financial foresight for everyone — track markets, the economy, and more.",
    url: "https://usehorizon.dev",
    siteName: "Horizon",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Horizon",
    description: "Financial foresight for everyone — track markets, the economy, and more.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Set theme class before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark');})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <div className="mx-auto max-w-5xl px-4 pt-10 pb-16 font-[family-name:var(--font-geist-mono)]">
            <SiteHeader />
            {children}
            <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-6 text-center text-xs text-gray-400 dark:text-gray-500">
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Horizon</p>
              <p>
                Built by{" "}
                <span className="text-gray-600 dark:text-gray-400 font-medium">Shantanu Bal</span>
                {" "}·{" "}
                <a href="mailto:shantanu.r.bal@gmail.com" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                  shantanu.r.bal@gmail.com
                </a>
                {" "}·{" "}
                <a href="/about" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  About
                </a>
              </p>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
