type DiscountedPriceProps = {
  price: number;
  format: (amount: number) => string;
  className?: string;
  originalClassName?: string;
  discountedClassName?: string;
};

export function DiscountedPrice({
  price,
  format,
  className = "",
  originalClassName = "text-sm text-muted-foreground",
  discountedClassName = "text-lg font-bold text-primary-light",
}: DiscountedPriceProps) {
  if (!Number.isFinite(price) || price <= 0) return null;

  const discountedPrice = Math.round(price * 0.6);
  const original = format(price);
  const discounted = format(discountedPrice);

  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}
      aria-label={`Original price ${original}; estimated 40 percent discount price ${discounted}`}
    >
      <del className={originalClassName}>{original}</del>
      <span className={discountedClassName}>{discounted}</span>
      <span className="rounded bg-success/15 px-1.5 py-0.5 text-xs font-semibold text-success">
        40% off · estimate
      </span>
    </div>
  );
}
