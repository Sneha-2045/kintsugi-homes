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
    <section className="bg-background py-10 md:py-14" aria-labelledby="payment-plan-title">
      <div className="container-page">
        <div className="grid gap-8 overflow-hidden rounded-3xl border border-slate-700 bg-[#1b2535] p-6 shadow-xl shadow-slate-950/10 md:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12 lg:p-12">
          <div className="min-w-0">
            <p className="inline-flex items-center rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
              Flexible ownership
            </p>
            <h2
              id="payment-plan-title"
              className="mt-4 text-3xl font-bold leading-tight text-white md:text-[40px]"
            >
              A payment plan that feels more manageable
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
              Explore a sample schedule for a Japanese property purchase, with payments spread
              across deposit, renovation, and handover.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-slate-200">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
            <Link
              to="/consult"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-blue-300"
            >
              Ask about a payment plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7 md:p-8">
            <p className="text-sm font-medium text-slate-300">Sample plan</p>
            <p className="mt-2 text-4xl font-bold text-white md:text-5xl">1% / month</p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-3">
              {tiles.map((t) => (
                <li
                  key={t.label}
                  className={`relative rounded-2xl border p-6 text-center ${
                    t.highlight
                      ? "border-blue-400/50 bg-blue-400/10 pt-9"
                      : "border-white/10 bg-white/[0.05]"
                  }`}
                >
                  {t.highlight ? (
                    <div className="absolute inset-x-0 top-2 flex justify-center">
                      <Badge variant="blue" size="xs">
                        PAY IN 3 TO 4 YEARS
                      </Badge>
                    </div>
                  ) : null}
                  <p className="text-3xl font-bold text-white">{t.value}</p>
                  <p className="mt-1 text-xs text-slate-300">{t.label}</p>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-xs text-slate-400">
              *Indicative example. Terms and availability vary by property and partner lender.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
