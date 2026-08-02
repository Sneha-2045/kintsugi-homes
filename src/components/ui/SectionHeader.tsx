import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  align = "left",
  serif = false,
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  serif?: boolean;
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "gap-6",
        centered
          ? "flex flex-col items-center text-center"
          : "grid grid-cols-[minmax(0,1fr)_auto] items-end",
        className,
      )}
    >
      <div className={cn("min-w-0", centered && "max-w-3xl")}>
        {eyebrow ? <div className={cn("mb-4", centered && "flex justify-center")}>{eyebrow}</div> : null}
        <h2
          className={cn(
            "text-3xl font-bold text-foreground md:text-[44px] md:leading-[1.1]",
            serif && "font-serif tracking-normal",
          )}
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-4 text-base text-muted-foreground md:text-lg">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
