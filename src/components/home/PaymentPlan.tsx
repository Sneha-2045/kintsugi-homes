import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/common/Badge";

const bullets = [
  "Low deposit options on selected akiya",
  "Post-handover renovation payment plans",
  "0% brokerage commission on partner listings",
  "Investor-friendly terms with transparent yields",
];

const tiles = [
  { value: "10%", label: "Deposit" },
  { value: "60%", label: "During renovation", highlight: true },
  { value: "30%", label: "On handover" },
];

export function PaymentPlan() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="payment-plan-title">
      <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-light">
            Investor friendly
          </p>
          <h2
            id="payment-plan-title"
            className="mt-4 text-3xl font-bold leading-tight text-foreground md:text-[44px]"
          >
            Just 1% monthly payment plans
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Own a Japanese property with the simplest schedule on the market. Pay around 1% per
            month through a partner lender — no hidden fees, no inflated interest. Built for
            end-users and investors who want predictable, stress-free ownership.
          </p>
          <ul className="mt-8 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground md:text-base">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
          <Link
            to="/consult"
            className="mt-9 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Calculate your payments
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-7 md:p-10">
          <p className="text-sm font-medium text-muted-foreground">Sample plan</p>
          <p className="mt-2 text-4xl font-bold text-foreground md:text-5xl">1% / month</p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {tiles.map((t) => (
              <li
                key={t.label}
                className={`relative rounded-2xl border p-6 text-center ${
                  t.highlight
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-elevated"
                }`}
              >
                {t.highlight ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="blue" size="xs">
                      PAY IN 3 TO 4 YEARS
                    </Badge>
                  </div>
                ) : null}
                <p className="text-3xl font-bold text-foreground">{t.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.label}</p>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs text-subtle">
            *Indicative. Actual plans vary by property and partner lender.
          </p>
        </div>
      </div>
    </section>
  );
}
