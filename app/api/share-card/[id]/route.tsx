import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db/prisma";
import { scoreLabel } from "@/lib/roast/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-rendered share card (1200x630 PNG) via Satori. Vercel-compatible and
 * requires no headless browser. Accepts either a roast session id or a share
 * token so the card works from both the result page and a shared link.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let result = await prisma.roastResult.findFirst({ where: { sessionId: id } });
  if (!result) {
    const share = await prisma.share.findUnique({
      where: { shareToken: id },
      include: { session: { include: { result: true } } },
    });
    result = share?.session.result ?? null;
    if (share) {
      await prisma.share
        .update({ where: { id: share.id }, data: { downloads: { increment: 1 } } })
        .catch(() => undefined);
    }
  }

  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  const quote = result.shareableQuote.replace(/^["“”']+|["“”']+$/g, "");
  const topFlag = Array.isArray(result.redFlags)
    ? (result.redFlags.find((f): f is string => typeof f === "string") ?? "")
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#07060b",
          backgroundImage:
            "radial-gradient(900px 500px at 0% 0%, rgba(255,90,31,0.30), transparent), radial-gradient(800px 500px at 100% 10%, rgba(139,92,246,0.28), transparent)",
          color: "#f5f2ff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 8,
              fontWeight: 700,
              color: "#a29bbd",
            }}
          >
            🔥 ROASTME AI
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#a29bbd", letterSpacing: 3 }}>
            YOUR ROAST SCORE
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 36 }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 190, fontWeight: 800, color: "#ff5a1f", lineHeight: 1 }}>
              {result.overallScore}
            </span>
            <span style={{ fontSize: 64, fontWeight: 700, color: "#4b4560" }}>/100</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 700,
              color: "#b6ff3d",
              paddingBottom: 26,
              maxWidth: 460,
            }}
          >
            {scoreLabel(result.overallScore)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 44,
              fontWeight: 800,
              lineHeight: 1.2,
              color: "#f5f2ff",
            }}
          >
            &ldquo;{quote.slice(0, 150)}&rdquo;
          </div>
          {topFlag ? (
            <div style={{ display: "flex", fontSize: 26, color: "#a29bbd", lineHeight: 1.35 }}>
              🚩 Your biggest red flag: {topFlag.slice(0, 120)}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.10)",
            paddingTop: 26,
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 700, color: "#ff2d78", letterSpacing: 3 }}>
            roastme.ai
          </span>
          <span style={{ fontSize: 22, color: "#6c6489" }}>Get your own roast</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=300" },
    },
  );
}
