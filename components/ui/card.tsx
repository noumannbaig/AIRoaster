import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("glass-card rounded-3xl p-6 sm:p-8 transition-colors duration-300", className)}
      {...props}
    />
  );
}

export function CardEyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("font-display text-xl sm:text-2xl font-bold tracking-tight text-chalk", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-[0.975rem] leading-relaxed text-muted", className)} {...props} />;
}
