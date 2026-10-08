export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <img
      src="/rylestate-logo-blue-black.png"
      alt="Rylestate.com"
      className={`rounded-md bg-white p-1 ${className}`}
      width={640}
      height={200}
    />
  );
}
