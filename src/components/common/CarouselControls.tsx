import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CarouselControls({
  onPrev,
  onNext,
  label,
  className,
}: {
  onPrev: () => void;
  onNext: () => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={onPrev}
        aria-label={`Previous ${label}`}
        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-elevated text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label={`Next ${label}`}
        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-elevated text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
