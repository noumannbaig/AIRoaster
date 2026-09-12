import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-tight transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-flame/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-linear-to-r from-flame to-ember text-white shadow-[0_16px_44px_-16px_rgba(255,90,31,0.85)] hover:shadow-[0_20px_60px_-14px_rgba(255,45,120,0.9)] hover:brightness-110",
        acid: "bg-acid text-ink shadow-[0_16px_44px_-18px_rgba(182,255,61,0.8)] hover:brightness-105",
        secondary:
          "border border-edge bg-white/5 text-chalk hover:border-flame/60 hover:bg-white/10",
        ghost: "text-muted hover:bg-white/5 hover:text-chalk",
        link: "text-flame underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-[0.95rem]",
        lg: "h-13 px-8 text-base sm:text-lg",
        xl: "h-15 px-9 text-lg sm:text-xl",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
