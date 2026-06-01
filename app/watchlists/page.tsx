import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserLists } from "@/lib/watchlists";
import WatchlistsClient from "./WatchlistsClient";

export const metadata = {
  title: "Watchlists · Horizon",
  description: "Create and manage your personal stock watchlists.",
};

export default async function WatchlistsPage() {
  const session = await getSession();
  if (!session || session.role !== "user") redirect("/login");

  const lists = await getUserLists(session.username);
  return <WatchlistsClient initialLists={lists} />;
}
