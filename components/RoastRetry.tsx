"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoastLoading } from "@/components/RoastLoading";

/**
 * Shown when a session exists but has no result — generation failed, timed out,
 * or the user landed here before it finished. Retrying reuses the stored input
 * and never charges for a second roast.
 */
export function RoastRetry({ sessionId, status }: { sessionId: string; status: string }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(status === "GENERATING");
  const [error, setError] = useState<string | null>(null);

  const retry = async () => {
    setRetrying(true);
    setError(null);
    try {
      const response = await fetch(`/api/roast/${sessionId}/generate`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error?.message ?? "That didn't work either.");
        setRetrying(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network failure. Check your connection and try again.");
      setRetrying(false);
    }
  };

  if (retrying) return <RoastLoading label="Rebuilding your roast" />;

  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <span className="text-6xl">🫠</span>
      <h1 className="mt-7 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
        Even the AI needs a minute to process your questionable life choices.
      </h1>
      <p className="mt-4 text-sm text-muted">
        Your input is saved. Retrying won&apos;t cost you anything and won&apos;t use up another
        roast.
      </p>
      {error ? <p className="mt-4 text-sm text-ember">{error}</p> : null}
      <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={retry}>
        {retrying ? <Loader2 className="size-5 animate-spin" /> : <RotateCcw className="size-5" />}
        Try again
      </Button>
    </div>
  );
}
