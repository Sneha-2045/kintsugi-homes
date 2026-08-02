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
    <div className="bg-background py-14 md:py-20">
      <div className="container-page">
        <h1 className="text-3xl font-bold text-foreground md:text-[44px]">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">{description}</p>
        ) : null}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
