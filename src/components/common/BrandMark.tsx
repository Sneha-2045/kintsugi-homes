export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="14" fill="#243650" />
      <path d="M10 23.5 24 12l14 11.5V38H10V23.5Z" fill="#F5F2EA" />
      <path d="m8 24 16-14 16 14" stroke="#D8AA5E" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m23 12 3 6-3 4 4 4-3 4 3 4-2 4" stroke="#D8AA5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 38V28h7v10" fill="#243650" />
    </svg>
  );
}
