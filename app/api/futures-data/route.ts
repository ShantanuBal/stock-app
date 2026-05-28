import { NextResponse } from "next/server";
import { getAllFuturesData } from "@/lib/massive-futures";

export async function GET() {
  try {
    const data = await getAllFuturesData();
    return NextResponse.json({ futures: data });
  } catch (err) {
    console.error("futures-data route error:", err);
    return NextResponse.json({ error: "Failed to fetch futures data" }, { status: 500 });
  }
}
