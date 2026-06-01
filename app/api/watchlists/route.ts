import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserLists } from "@/lib/watchlists";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ lists: [], authenticated: false });
  }
  try {
    const lists = await getUserLists(session.username);
    console.log(`[watchlists] ${session.username} — ${lists.length} lists`);
    return NextResponse.json({ lists, authenticated: true });
  } catch (err) {
    console.error("[watchlists] failed to fetch lists:", err);
    return NextResponse.json({ lists: [], authenticated: true });
  }
}
