import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ETFs · Horizon",
  description: "Track performance across broad market, sector, bond, commodity, and international ETFs. Prices delayed 15 minutes, powered by Polygon.",
};

export default function ETFsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
