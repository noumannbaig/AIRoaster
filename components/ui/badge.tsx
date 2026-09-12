import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-edge bg-white/5 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted",
        className,
      )}
      {...props}
    />
  );
}
