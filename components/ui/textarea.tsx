import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full resize-y rounded-2xl border border-edge bg-ink-soft/80 px-4 py-3.5 text-base text-chalk placeholder:text-muted/60 outline-none transition-colors duration-200 focus:border-flame/70 focus:ring-4 focus:ring-flame/10 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
