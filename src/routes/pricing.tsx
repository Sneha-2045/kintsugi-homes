import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Yadori Estate Membership" },
      {
        name: "description",
        content:
          "Browsing is free forever. Membership costs $5/month or $50/year and unlocks new listings 24 hours early.",
      },
      { property: "og:title", content: "Pricing — Yadori Estate Membership" },
      {
        property: "og:description",
        content:
          "Browsing is free forever. Membership costs $5/month or $50/year and unlocks new listings 24 hours early.",
      },
    ],
  }),
  component: PricingPage,
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    badge: null,
    features: ["Search & map", "Original listing links", "30 property views", "1 email alert"],
    cta: "Current plan",
    variant: "outline" as const,
  },
  {
    name: "Member",
    price: "$5",
    period: "per month",
    badge: "Most popular",
    features: [
      "Unlimited property views",
      "New listings 24 hours early",
      "Full English write-ups",
      "Hazard, cost & population data",
      "Comparable sales",
      "CSV export",
    ],
    cta: "Start free trial",
    variant: "primary" as const,
  },
  {
    name: "Premium",
    price: "$19",
    period: "per month",
    badge: "For buyers in progress",
    features: [
      "Everything in Member",
      "Priority partner introductions",
      "Two survey report reviews",
      "Renovation cost modelling",
      "Direct chat with a specialist",
    ],
    cta: "Start free trial",
    variant: "success" as const,
  },
];

function PricingPage() {
  const [plan, setPlan] = useState<string | null>(null);

  return (
    <PageShell
      title="Simple pricing"
      description="Browsing stays free forever. Membership is the head start. No hidden fees, no lock in."
    >
      <ul className="grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => (
          <li
            key={tier.name}
            className="flex flex-col rounded-2xl border border-border bg-card p-7 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-foreground">{tier.name}</h2>
              {tier.badge ? (
                <Badge variant="blue" size="xs">
                  {tier.badge.toUpperCase()}
                </Badge>
              ) : null}
            </div>
            <p className="mt-4 text-4xl font-bold text-foreground">
              {tier.price}
              <span className="ml-2 text-sm font-medium text-muted-foreground">{tier.period}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant={tier.variant}
              className="mt-7 w-full"
              onClick={() => setPlan(tier.name)}
            >
              {tier.cta}
            </Button>
          </li>
        ))}
      </ul>

      <Modal open={!!plan} onClose={() => setPlan(null)} title="Mock checkout">
        <p>
          No payment provider is connected in this demo. Selecting <strong>{plan}</strong> would
          normally open a secure checkout.
        </p>
        <Button className="mt-5 w-full" onClick={() => setPlan(null)}>
          Close
        </Button>
      </Modal>
    </PageShell>
  );
}
