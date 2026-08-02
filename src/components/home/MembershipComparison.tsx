import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { SectionHeader } from "@/components/common/SectionHeader";

type Cell = boolean | string;

const rows: { feature: string; free: Cell; member: Cell }[] = [
  { feature: "Search, map & original listing links", free: true, member: true },
  { feature: "Property views", free: "30 free", member: "Unlimited" },
  { feature: "See new listings (1,620/day) as they land", free: false, member: true },
  { feature: "Email alerts on saved searches & properties", free: "1 alert", member: "Unlimited" },
  { feature: "Full English property write-up & details", free: false, member: true },
  { feature: "Hazard, cost & population data", free: false, member: true },
  { feature: "Comparable sales from 780,000+ sold records", free: false, member: true },
  { feature: "Verified land rights & market pace data", free: false, member: true },
  { feature: "Export saved properties to CSV", free: false, member: true },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true)
    return (
      <>
        <Check className="mx-auto h-5 w-5 text-success" aria-hidden="true" />
        <span className="sr-only">Included</span>
      </>
    );
  if (value === false)
    return (
      <>
        <X className="mx-auto h-5 w-5 text-subtle" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </>
    );
  return <span className="font-semibold text-foreground">{value}</span>;
}

export function MembershipComparison() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="compare-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Browse free. Buy smarter as a member."
          subtitle="Searching, the map and original listing links are free — always. Members get the data that turns browsing into buying: 1,620 new listings daily, 24 hours early."
          className="mb-12"
        />
        <h2 id="compare-title" className="sr-only">
          Free versus member comparison
        </h2>

        <div className="mx-auto max-w-5xl overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-150 border-collapse text-left">
            <caption className="sr-only">What you get on the free and member plans</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-6 py-5 text-sm font-semibold text-muted-foreground">
                  What you get
                </th>
                <th scope="col" className="w-32 px-4 py-5 text-center text-sm font-semibold text-muted-foreground">
                  Free
                </th>
                <th scope="col" className="w-32 px-4 py-5 text-center text-sm font-semibold text-primary-light">
                  Member
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="px-6 py-4 text-[15px] font-normal text-foreground">
                    {row.feature}
                  </th>
                  <td className="px-4 py-4 text-center text-sm text-muted-foreground">
                    <CellValue value={row.free} />
                  </td>
                  <td className="px-4 py-4 text-center text-sm">
                    <CellValue value={row.member} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Button asChild size="lg">
            <Link to="/pricing">
              Start your 3-day free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">From $5/month · cancel anytime</p>
        </div>
      </div>
    </section>
  );
}
