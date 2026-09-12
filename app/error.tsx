"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 text-center">
      <span className="text-6xl">🔥</span>
      <h1 className="mt-7 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
        Even the AI needs a minute to process your questionable life choices.
      </h1>
      <p className="mt-4 text-sm text-muted">
        Something broke on our side. Nothing you did caused this, probably.
      </p>
      <Button size="lg" className="mt-8" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
