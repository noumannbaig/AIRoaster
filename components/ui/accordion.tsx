"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn(
        "glass-card rounded-2xl px-5 transition-colors duration-200 data-[state=open]:border-flame/40",
        className,
      )}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 py-5 text-left font-display text-base sm:text-lg font-semibold text-chalk outline-none transition-colors hover:text-flame",
          className,
        )}
        {...props}
      >
        {children}
        <Plus className="size-5 shrink-0 text-muted transition-transform duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:text-flame" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden text-[0.95rem] leading-relaxed text-muted data-[state=closed]:animate-[accordion-up_200ms_ease] data-[state=open]:animate-[accordion-down_200ms_ease]"
      {...props}
    >
      <div className={cn("pb-5 pr-8", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
