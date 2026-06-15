import { NextRequest, NextResponse } from "next/server";
import { searchTickers } from "@/lib/polygon";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  console.log(`[ticker-search] q="${q ?? ""}"`);

  if (!q || !q.trim()) return NextResponse.json({ results: [] });

  try {
    const results = await searchTickers(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[ticker-search] failed:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
