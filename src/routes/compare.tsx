import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import {
  ComparisonRemoveButton,
  usePropertyComparison,
} from "@/components/property/PropertyComparison";
import {
  calculateComparison,
  DEFAULT_ASSUMPTIONS,
  parseAssumptions,
  type ComparisonProperty,
  type InvestmentAssumptions,
} from "@/lib/property-comparison";

const ASSUMPTIONS_KEY = "rylest-property-comparison-assumptions-v1";
export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Properties | Rylestate" },
      {
        name: "description",
        content:
          "Compare property facts, source prices, valuations, rental estimates and transparent investment assumptions side by side.",
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { properties, clear } = usePropertyComparison();
  const [assumptions, setAssumptions] = useState<InvestmentAssumptions>(DEFAULT_ASSUMPTIONS);
  useEffect(() => {
    try {
      setAssumptions(parseAssumptions(JSON.parse(localStorage.getItem(ASSUMPTIONS_KEY) ?? "null")));
    } catch {
      try {
        localStorage.removeItem(ASSUMPTIONS_KEY);
      } catch {
        // Keep default assumptions when browser storage is unavailable.
      }
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(ASSUMPTIONS_KEY, JSON.stringify(assumptions));
    } catch {
      // The calculator remains usable for this session without browser storage.
    }
  }, [assumptions]);

  const metrics = useMemo(
    () => properties.map((property) => calculateComparison(property, assumptions)),
    [properties, assumptions],
  );
  const comparablePrices =
    properties.length > 1 &&
    properties.every(
      (property) =>
        property.currency === properties[0]?.currency &&
        property.priceBasis === properties[0]?.priceBasis,
    );
  const winners = useMemo(() => {
    const lowest = (values: Array<number | undefined>) => {
      const defined = values.filter(
        (value): value is number => value != null && Number.isFinite(value),
      );
      if (defined.length < 2 || defined.length !== properties.length) return undefined;
      const best = Math.min(...defined);
      return values
        .map((value, index) => (value === best ? properties[index]?.key : undefined))
        .filter(Boolean);
    };
    const highest = (values: Array<number | undefined>) => {
      const defined = values.filter(
        (value): value is number => value != null && Number.isFinite(value),
      );
      if (defined.length < 2 || defined.length !== properties.length) return undefined;
      const best = Math.max(...defined);
      return values
        .map((value, index) => (value === best ? properties[index]?.key : undefined))
        .filter(Boolean);
    };
    return {
      price: comparablePrices ? lowest(properties.map((property) => property.price)) : undefined,
      perSqFt: comparablePrices ? lowest(metrics.map((metric) => metric.pricePerSqFt)) : undefined,
      yield: comparablePrices ? highest(metrics.map((metric) => metric.grossYield)) : undefined,
      cashFlow: comparablePrices
        ? highest(metrics.map((metric) => metric.monthlyCashFlow))
        : undefined,
    };
  }, [properties, metrics, comparablePrices]);

  const setAssumption = (key: keyof InvestmentAssumptions, value: string) =>
    setAssumptions((current) => ({ ...current, [key]: value }));
  const fmt = (value: number | undefined, currency: ComparisonProperty["currency"] = "USD") =>
    value == null || !Number.isFinite(value)
      ? "Not available"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(value);
  const percent = (value: number | undefined) =>
    value == null || !Number.isFinite(value) ? "Not available" : `${value.toFixed(1)}%`;
  const number = (value?: number, suffix = "") =>
    value == null ? "Not available" : `${value.toLocaleString()}${suffix}`;

  return (
    <PageShell
      title="Compare properties"
      description="Review property facts and investment estimates side by side."
    >
      <div className="comparison-print-hide mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/us-properties"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-primary-light hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-elevated"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          {properties.length ? (
            <button
              type="button"
              onClick={clear}
              className="min-h-10 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-elevated"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </div>
      <header className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-light">
          Investment comparison
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">
          Compare properties side by side
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Compare listing snapshots separately from estimated values and user-entered assumptions. A
          displayed price is not a confirmed acquisition price. Confirm current availability and
          terms with each original source.
        </p>
      </header>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center md:p-12">
          <h2 className="text-xl font-semibold">No properties selected</h2>
          <p className="mt-2 text-muted-foreground">
            Select properties from US or MLS listings to compare up to four options.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              to="/us-properties"
              className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground"
            >
              Browse US properties
            </Link>
            <Link
              to="/properties"
              className="rounded-lg border border-border px-4 py-2.5 font-semibold"
            >
              Browse MLS
            </Link>
          </div>
        </div>
      ) : (
        <>
          {properties.length < 2 ? (
            <p className="mb-5 rounded-xl border border-blue-300/20 bg-blue-500/5 p-4 text-sm text-muted-foreground">
              Select one more property to start a side-by-side comparison. You can keep browsing;
              this selection is saved in this browser.
            </p>
          ) : null}
          <div className="comparison-scroll overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 w-48 border-b border-border bg-surface p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Property
                  </th>
                  {properties.map((property) => (
                    <th
                      key={property.key}
                      className="min-w-64 border-b border-border p-4 align-top text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {property.image ? (
                            <img
                              src={property.image}
                              alt={`Property image: ${property.name}`}
                              loading="lazy"
                              className="mb-3 aspect-[16/9] w-full max-w-72 rounded-xl bg-elevated object-cover"
                            />
                          ) : (
                            <div className="mb-3 grid aspect-[16/9] w-full max-w-72 place-items-center rounded-xl bg-elevated text-xs text-muted-foreground">
                              Image unavailable
                            </div>
                          )}
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary-light">
                            {property.sourceLabel}
                          </span>
                          <h2 className="mt-2 font-bold text-foreground">{property.name}</h2>
                        </div>
                        <ComparisonRemoveButton propertyKey={property.key} />
                      </div>
                      {winners.price?.includes(property.key) ? (
                        <span className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                          Lowest available price
                        </span>
                      ) : null}
                      <a
                        href={property.detailHref}
                        className="comparison-print-hide mt-3 inline-block text-xs font-semibold text-primary-light underline underline-offset-4"
                      >
                        View full details
                      </a>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow
                  label="Address"
                  values={properties.map(
                    (p) =>
                      [p.address, [p.city, p.state, p.zipCode].filter(Boolean).join(", ")]
                        .filter(Boolean)
                        .join(" · ") || "Not available",
                  )}
                />
                <CompareRow
                  label="Listing price"
                  values={properties.map((p) => (
                    <WinnerValue
                      key={p.key}
                      value={fmt(p.price, p.currency)}
                      winner={winners.price?.includes(p.key)}
                    />
                  ))}
                />
                <CompareRow
                  label="Price basis"
                  values={properties.map((p) =>
                    p.priceBasis === "mls-asking"
                      ? "MLS asking price"
                      : p.priceBasis === "auction-listed"
                        ? "Auction/source-listed price"
                        : p.priceBasis === "japan-listed"
                          ? "Japan source-listed price"
                          : p.priceBasis === "tranchi-reported"
                            ? "Tranchi source-reported price"
                            : "Source-reported price",
                  )}
                />
                <CompareRow
                  label="Estimated market value"
                  values={properties.map((p) => fmt(p.marketValue, p.currency))}
                />
                <CompareRow
                  label="Estimated appraised value"
                  values={properties.map((p) => fmt(p.appraisedValue, p.currency))}
                />
                <CompareRow
                  label="Listing category / type"
                  values={properties.map(
                    (p) =>
                      [p.category, p.propertyType].filter(Boolean).join(" · ") || "Not available",
                  )}
                />
                <CompareRow
                  label="Listing status"
                  values={properties.map((p) => p.status ?? "Not available")}
                />
                <CompareRow label="Bedrooms" values={properties.map((p) => number(p.bedrooms))} />
                <CompareRow label="Bathrooms" values={properties.map((p) => number(p.bathrooms))} />
                <CompareRow
                  label="Interior area"
                  values={properties.map((p) => number(p.areaSqFt, " sq ft"))}
                />
                <CompareRow
                  label="Lot size"
                  values={properties.map((p) => number(p.lotAreaSqFt, " sq ft"))}
                />
                <CompareRow
                  label="Auction date"
                  values={properties.map((p) => p.auctionDate ?? "Not applicable / unavailable")}
                />
                <CompareRow
                  label="Last checked"
                  values={properties.map((p) => {
                    if (!p.lastCheckedAt) return "Not recorded";
                    const date = new Date(p.lastCheckedAt);
                    return Number.isNaN(date.getTime())
                      ? "Not recorded"
                      : date.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                  })}
                />
                <CompareRow
                  label="Original listing source"
                  values={properties.map((p) =>
                    p.sourceUrl ? (
                      <a
                        key={p.key}
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary-light underline"
                      >
                        Open source
                      </a>
                    ) : (
                      "Not provided by source"
                    ),
                  )}
                />
                <tr>
                  <th
                    colSpan={properties.length + 1}
                    className="border-y border-border bg-elevated/70 px-4 py-3 text-left font-semibold"
                  >
                    Pricing analysis{" "}
                    <span className="font-normal text-muted-foreground">
                      · calculated where comparable source data exists
                    </span>
                  </th>
                </tr>
                <CompareRow
                  label="Price per sq ft"
                  values={properties.map((p, i) => (
                    <WinnerValue
                      key={p.key}
                      value={
                        metrics[i] ? fmt(metrics[i].pricePerSqFt, p.currency) : "Not available"
                      }
                      winner={winners.perSqFt?.includes(p.key)}
                    />
                  ))}
                />
                <CompareRow
                  label="Difference vs. estimated value"
                  values={properties.map((p, i) =>
                    metrics[i]?.discountPercent == null
                      ? "Not shown · price basis may not be comparable"
                      : `${fmt((p.marketValue ?? 0) - (p.price ?? 0), p.currency)} (${percent(metrics[i]?.discountPercent)})`,
                  )}
                />
                <tr>
                  <th
                    colSpan={properties.length + 1}
                    className="border-y border-border bg-elevated/70 px-4 py-3 text-left font-semibold"
                  >
                    Rental analysis{" "}
                    <span className="font-normal text-muted-foreground">· estimates only</span>
                  </th>
                </tr>
                <CompareRow
                  label="Estimated monthly rent"
                  values={properties.map((p, i) => fmt(metrics[i]?.monthlyRent))}
                />
                <CompareRow
                  label="Source-reported monthly cash flow (estimate)"
                  values={properties.map((p) => fmt(p.reportedMonthlyCashFlow))}
                />
                <CompareRow
                  label="Estimated annual rent"
                  values={properties.map((p, i) => fmt(metrics[i]?.annualRent))}
                />
                <CompareRow
                  label="Estimated gross rental yield vs. source price"
                  values={properties.map((p, i) => (
                    <WinnerValue
                      key={p.key}
                      value={percent(metrics[i]?.grossYield)}
                      winner={winners.yield?.includes(p.key)}
                    />
                  ))}
                />
                <CompareRow
                  label="Estimated annual operating expenses"
                  values={properties.map((p, i) => fmt(metrics[i]?.annualOperatingExpenses))}
                />
                <CompareRow
                  label="Estimated monthly cash flow"
                  values={properties.map((p, i) => (
                    <WinnerValue
                      key={p.key}
                      value={fmt(metrics[i]?.monthlyCashFlow)}
                      winner={winners.cashFlow?.includes(p.key)}
                    />
                  ))}
                />
                <CompareRow
                  label="Estimated annual debt payments"
                  values={properties.map((p, i) =>
                    metrics[i]?.annualDebt
                      ? fmt(metrics[i].annualDebt)
                      : "Enter price, down payment, rate and term",
                  )}
                />
                <CompareRow
                  label="Estimated upfront cash (down payment + entered renovation budget)"
                  values={properties.map((p, i) =>
                    metrics[i]?.estimatedInitialCash == null
                      ? "Enter source price and down payment"
                      : `${fmt(metrics[i].estimatedInitialCash)}${assumptions.renovationBudget ? " including entered renovation budget" : " · renovation not included"}`,
                  )}
                />
              </tbody>
            </table>
          </div>

          <section
            className="comparison-print-hide mt-8 rounded-2xl border border-border bg-card p-5 md:p-7"
            aria-labelledby="assumptions-heading"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-light">
              Optional calculator
            </p>
            <h2 id="assumptions-heading" className="mt-2 text-2xl font-bold">
              Investment assumptions
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Every value below is an editable user estimate and applies to selected US dollar
              listings. Blank operating costs prevent cash-flow estimates from being shown. RentCast
              is not configured in this project.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Assumption
                label="Expected monthly rent (override)"
                value={assumptions.monthlyRent}
                onChange={(v) => setAssumption("monthlyRent", v)}
                prefix="$"
              />
              <Assumption
                label="Down payment"
                value={assumptions.downPaymentPercent}
                onChange={(v) => setAssumption("downPaymentPercent", v)}
                suffix="%"
              />
              <Assumption
                label="Annual interest rate"
                value={assumptions.annualInterestRate}
                onChange={(v) => setAssumption("annualInterestRate", v)}
                suffix="%"
              />
              <Assumption
                label="Loan term"
                value={assumptions.loanTermYears}
                onChange={(v) => setAssumption("loanTermYears", v)}
                suffix="years"
              />
              <Assumption
                label="Estimated annual property tax"
                value={assumptions.annualPropertyTax}
                onChange={(v) => setAssumption("annualPropertyTax", v)}
                prefix="$"
              />
              <Assumption
                label="Estimated annual insurance"
                value={assumptions.annualInsurance}
                onChange={(v) => setAssumption("annualInsurance", v)}
                prefix="$"
              />
              <Assumption
                label="Estimated monthly maintenance"
                value={assumptions.monthlyMaintenance}
                onChange={(v) => setAssumption("monthlyMaintenance", v)}
                prefix="$"
              />
              <Assumption
                label="Vacancy allowance"
                value={assumptions.vacancyPercent}
                onChange={(v) => setAssumption("vacancyPercent", v)}
                suffix="%"
              />
              <Assumption
                label="Estimated monthly HOA"
                value={assumptions.monthlyHoa}
                onChange={(v) => setAssumption("monthlyHoa", v)}
                prefix="$"
              />
              <Assumption
                label="Renovation budget (cash required)"
                value={assumptions.renovationBudget}
                onChange={(v) => setAssumption("renovationBudget", v)}
                prefix="$"
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Cash flow includes estimated rent less vacancy, tax, insurance, maintenance, HOA and
              principal-and-interest payments. Complete every operating-cost field plus the
              financing inputs. Renovation budget is shown as a separate initial-cost assumption and
              is not included in the monthly payment. Actual costs, financing and rent may differ.
            </p>
          </section>
        </>
      )}
    </PageShell>
  );
}

function CompareRow({ label, values }: { label: string; values: ReactNode[] }) {
  return (
    <tr className="border-b border-border last:border-0">
      <th
        scope="row"
        className="sticky left-0 z-10 w-48 bg-card px-4 py-3 text-left font-medium text-muted-foreground"
      >
        {label}
      </th>
      {values.map((value, index) => (
        <td key={index} className="min-w-64 px-4 py-3 align-top text-foreground">
          {value ?? "Not available"}
        </td>
      ))}
    </tr>
  );
}

function WinnerValue({ value, winner }: { value: string; winner: boolean | undefined }) {
  return (
    <span
      className={
        winner
          ? "inline-flex rounded-lg bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-400"
          : ""
      }
    >
      {value}
      {winner ? <span className="sr-only"> (best comparable value)</span> : null}
    </span>
  );
}

function Assumption({
  label,
  value,
  onChange,
  prefix,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="text-xs font-medium text-muted-foreground">
      {label}
      <span className="mt-1 flex min-h-11 items-center rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-within:border-primary">
        <span className="text-muted-foreground">{prefix}</span>
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-1.5 py-2 outline-none"
        />
        {suffix ? <span className="text-muted-foreground">{suffix}</span> : null}
      </span>
    </label>
  );
}
