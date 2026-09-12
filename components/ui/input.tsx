import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-12 w-full rounded-full border border-edge bg-ink-soft/80 px-5 text-base text-chalk placeholder:text-muted/60 outline-none transition-colors duration-200 focus:border-flame/70 focus:ring-4 focus:ring-flame/10 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
