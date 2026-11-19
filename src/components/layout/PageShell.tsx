import type { ReactNode } from "react";

export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 bg-background py-8 sm:py-12 md:py-20">
      <div className="container-page">
        <h1 className="break-words text-[clamp(1.75rem,5vw,2.75rem)] font-bold text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">{description}</p>
        ) : null}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
