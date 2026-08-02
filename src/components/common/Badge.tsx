import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide",
  {
    variants: {
      variant: {
        blue: "bg-primary/15 text-primary-light",
        solidBlue: "bg-primary text-primary-foreground",
        orange: "bg-warning text-[#0B1628]",
        orangeSoft: "bg-warning/15 text-warning",
        green: "bg-success/15 text-success",
        neutral: "bg-elevated text-muted-foreground border border-border",
        dark: "bg-background/80 text-foreground backdrop-blur-sm",
      },
      size: {
        xs: "px-2.5 py-0.5 text-[11px]",
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-1.5 text-xs uppercase",
      },
    },
    defaultVariants: { variant: "blue", size: "sm" },
  },
);

export function Badge({
  className,
  variant,
  size,
  children,
}: VariantProps<typeof badgeVariants> & { className?: string; children: ReactNode }) {
  return <span className={cn(badgeVariants({ variant, size }), className)}>{children}</span>;
}
