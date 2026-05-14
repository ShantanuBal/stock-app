import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Horizon — Financial foresight for everyone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#030712",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Emerald accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "#10b981", display: "flex" }} />

        {/* Icon */}
        <svg width="80" height="80" viewBox="0 0 32 32" style={{ marginBottom: 36 }}>
          <rect width="32" height="32" rx="7" fill="#0f172a" />
          <line x1="16" y1="5" x2="16" y2="9" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          <line x1="23.5" y1="7.5" x2="21" y2="10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          <line x1="8.5" y1="7.5" x2="11" y2="10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          <path d="M 7 22 A 9 9 0 0 1 25 22 Z" fill="#10b981" />
          <line x1="3" y1="22" x2="29" y2="22" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        {/* Title */}
        <div style={{ fontSize: 100, fontWeight: 800, color: "white", lineHeight: 1, marginBottom: 20, letterSpacing: "-3px", display: "flex" }}>
          Horizon
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 34, color: "#6b7280", fontWeight: 400, display: "flex" }}>
          Financial foresight for everyone
        </div>

        {/* Pills row */}
        <div style={{ display: "flex", gap: 12, marginTop: 44 }}>
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 999, padding: "8px 20px", fontSize: 20, color: "#10b981", display: "flex" }}>Markets</div>
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 999, padding: "8px 20px", fontSize: 20, color: "#9ca3af", display: "flex" }}>Economy</div>
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 999, padding: "8px 20px", fontSize: 20, color: "#9ca3af", display: "flex" }}>Futures</div>
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 999, padding: "8px 20px", fontSize: 20, color: "#9ca3af", display: "flex" }}>Currencies</div>
          <div style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 999, padding: "8px 20px", fontSize: 20, color: "#9ca3af", display: "flex" }}>Options</div>
        </div>

        {/* URL */}
        <div style={{ position: "absolute", top: 44, right: 80, fontSize: 22, color: "#374151", display: "flex" }}>
          stock-app-one-khaki.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
