import { Link } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { SectionHeader } from "@/components/common/SectionHeader";

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    badge: "Most popular",
    badgeVariant: "blue" as const,
    price: "$5.00",
    period: "/month",
    note: "Free trial · cancel anytime",
    noteClass: "text-muted-foreground",
    cardVariant: "primary" as const,
  },
  {
    id: "yearly",
    name: "Yearly",
    badge: "Best value",
    badgeVariant: "green" as const,
    price: "$50.00",
    period: "/year",
    note: "Save $10 — 2 months free",
    noteClass: "text-success",
    cardVariant: "success" as const,
  },
];

export function PricingSection() {
  const [checkout, setCheckout] = useState<{ plan: string; method: string } | null>(null);

  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="pricing-title">
      <div className="container-page">
        <SectionHeader
          align="center"
          title="Simple pricing"
          subtitle="Browsing stays free forever. Membership is the head start. No hidden fees. No lock in."
          className="mb-12"
        />
        <h2 id="pricing-title" className="sr-only">
          Membership pricing
        </h2>

        <div className="mx-auto max-w-4xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-8"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                  <Badge variant={plan.badgeVariant} size="xs">
                    {plan.badge.toUpperCase()}
                  </Badge>
                </div>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {plan.price}
                  <span className="text-base font-medium text-muted-foreground">{plan.period}</span>
                </p>
                <p className={`mt-1 text-sm font-medium ${plan.noteClass}`}>{plan.note}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant={plan.cardVariant}
                  size="lg"
                  onClick={() => setCheckout({ plan: plan.name, method: "Card" })}
                >
                  <CreditCard className="h-4 w-4" />
                  Start with Card
                </Button>
                <Button
                  variant="paypal"
                  size="lg"
                  onClick={() => setCheckout({ plan: plan.name, method: "PayPal" })}
                >
                  Start with <span className="font-bold italic">PayPal</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Full plan comparison and Premium tier on the{" "}
          <Link to="/pricing" className="text-primary-light underline underline-offset-4">
            pricing page
          </Link>
          .
        </p>
      </div>

      <Modal open={!!checkout} onClose={() => setCheckout(null)} title="Mock checkout">
        <p>
          This is a front-end demo. No payment provider is connected, and nothing has been charged.
        </p>
        <dl className="mt-4 space-y-2 rounded-lg border border-border bg-elevated p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="font-semibold text-foreground">{checkout?.plan}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Method</dt>
            <dd className="font-semibold text-foreground">{checkout?.method}</dd>
          </div>
        </dl>
        <Button className="mt-5 w-full" onClick={() => setCheckout(null)}>
          Got it
        </Button>
      </Modal>
    </section>
  );
}
