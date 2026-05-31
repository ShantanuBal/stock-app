export function ytdDays(): number {
  const now = new Date();
  return Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000);
}

export function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

// Returns cache key info for the 1D AI summary period.
// On weekends: falls back to last Friday's post-close key so Claude is not
// called repeatedly for stale intraday data and prompt language says "Friday".
// On weekdays after 4pm ET: uses an #eod key so a stable post-close summary
// is persisted and reused through the weekend.
export function get1DCacheContext(): {
  cacheDate: string;   // date fragment for the DynamoDB pk (may include #eod)
  promptDate: string;  // display date to embed in Claude prompts
  rangeLabel: string;  // "Friday's session" | "today"
  marketStatus: string; // appropriate market-closed description for prompts
  isWeekend: boolean;
  skipHourTTL: boolean; // true when the EOD key should be long-lived
} {
  const now = new Date();
  const dayOfWeek = now.toLocaleString("en-US", { timeZone: "America/New_York", weekday: "long" });
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const etHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }), 10);

  if (dayOfWeek === "Saturday" || dayOfWeek === "Sunday") {
    const [y, m, d] = today.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - (dayOfWeek === "Saturday" ? 1 : 2));
    const fridayDate = [
      dt.getFullYear(),
      String(dt.getMonth() + 1).padStart(2, "0"),
      String(dt.getDate()).padStart(2, "0"),
    ].join("-");
    return {
      cacheDate: `${fridayDate}#eod`,
      promptDate: fridayDate,
      rangeLabel: "Friday's session",
      marketStatus: "markets closed for the weekend (as of Friday's close)",
      isWeekend: true,
      skipHourTTL: true,
    };
  }

  const afterClose = etHour >= 16;
  const etTimeStr = now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true });
  return {
    cacheDate: afterClose ? `${today}#eod` : today,
    promptDate: today,
    rangeLabel: "today",
    marketStatus: afterClose ? `markets closed (${etTimeStr} ET)` : "",
    isWeekend: false,
    skipHourTTL: afterClose,
  };
}
