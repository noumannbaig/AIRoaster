"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics/client";

export function EmailCapture({ sessionId }: { sessionId: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setState("saving");
    setMessage(null);

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), sessionId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setMessage(data?.error?.detail ?? "That didn't save. Check the address and try again.");
        setState("error");
        return;
      }
      setState("saved");
      track("email_submitted", {}, sessionId);
    } catch {
      setMessage("Network hiccup. Try again.");
      setState("error");
    }
  };

  if (state === "saved") {
    return (
      <div className="glass-card flex items-center gap-3 rounded-2xl px-5 py-4">
        <Check className="size-5 shrink-0 text-acid" />
        <p className="text-sm text-muted">
          Saved. We&apos;ll only use this if you ask us to send your roast — no marketing.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-card rounded-2xl p-5 sm:p-6">
      <p className="font-display text-lg font-bold text-chalk">Want your roast saved?</p>
      <p className="mt-1 text-sm text-muted">
        Optional. Bookmark this page and you never need to give us an email at all.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1"
        />
        <Button type="submit" variant="secondary" size="md" disabled={state === "saving"}>
          {state === "saving" ? <Loader2 className="size-4 animate-spin" /> : null}
          Save my roast
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm text-ember">{message}</p> : null}
    </form>
  );
}
