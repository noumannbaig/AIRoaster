import { ImageResponse } from "next/og";

export const runtime = "nodejs";

/** Default Open Graph image for the marketing pages. */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          backgroundColor: "#07060b",
          backgroundImage:
            "radial-gradient(900px 520px at 10% 0%, rgba(255,90,31,0.32), transparent), radial-gradient(760px 520px at 95% 100%, rgba(255,45,120,0.28), transparent)",
          color: "#f5f2ff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 8, color: "#a29bbd" }}>
          🔥 ROASTME AI
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.03,
            marginTop: 28,
          }}
        >
          AI just roasted my life 💀
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#a29bbd", marginTop: 28 }}>
          I gave AI some information about myself. I regret everything.
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
