"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/client";

function buildXIntent(shareUrl: string, score: number) {
  const text = `I let AI roast my life.\nIt was unnecessarily accurate 💀\nScore: ${score}/100`;
  const params = new URLSearchParams({ text, url: shareUrl });
  return `https://x.com/intent/post?${params.toString()}`;
}

/**
 * Creates (or reuses) the share token for this roast, then exposes the X intent
 * and a copyable link. We never claim a share happened — opening the intent is
 * all we can honestly report.
 */
export function ShareButtons({ sessionId, score }: { sessionId: string; score: number }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await response.json();
        if (!cancelled && response.ok) setShareUrl(data.url as string);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    track("share_clicked", { method: "copy" }, sessionId);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-12 items-center justify-center gap-2 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" /> Preparing your share link…
      </div>
    );
  }

  if (!shareUrl) {
    return (
      <p className="text-sm text-muted">
        We couldn&apos;t build a share link right now. Your roast is still saved at this URL.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        asChild
        size="lg"
        className="w-full"
        onClick={() => track("share_clicked", { method: "x" }, sessionId)}
      >
        <a href={buildXIntent(shareUrl, score)} target="_blank" rel="noopener noreferrer">
          <Share2 className="size-5" /> Share on X
        </a>
      </Button>

      <button
        type="button"
        onClick={copy}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-edge px-5 py-3 text-sm font-medium text-muted transition-colors hover:border-flame/50 hover:text-chalk"
      >
        {copied ? <Check className="size-4 text-acid" /> : <Copy className="size-4" />}
        {copied ? "Link copied" : "Copy share link"}
      </button>
    </div>
  );
}
