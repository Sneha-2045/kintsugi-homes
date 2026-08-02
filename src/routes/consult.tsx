import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/common/Button";
import { PageShell } from "@/components/layout/PageShell";
import { partners } from "@/data/partners";

export const Route = createFileRoute("/consult")({
  head: () => ({
    meta: [
      { title: "Consult an Expert — Yadori Estate" },
      {
        name: "description",
        content:
          "Book a consultation with a licensed Japanese brokerage, surveyor or relocation specialist.",
      },
      { property: "og:title", content: "Consult an Expert — Yadori Estate" },
      {
        property: "og:description",
        content:
          "Book a consultation with a licensed Japanese brokerage, surveyor or relocation specialist.",
      },
    ],
  }),
  component: ConsultPage,
});

const inputClass =
  "h-12 w-full rounded-lg border border-border bg-card px-4 text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary";

function ConsultPage() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <PageShell
      title="Consult an expert"
      description="Tell us what you are looking for and one of our licensed partners will follow up. This demo form does not send anything."
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                Name
              </label>
              <input id="name" required className={inputClass} placeholder="Your name" />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                Email
              </label>
              <input id="email" type="email" required className={inputClass} placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label htmlFor="topic" className="mb-2 block text-sm font-medium text-foreground">
              What do you need help with?
            </label>
            <select id="topic" className={inputClass}>
              <option>Buying a property</option>
              <option>Renovation & survey</option>
              <option>Relocation & paperwork</option>
              <option>Something else</option>
            </select>
          </div>
          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-medium text-foreground">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              className="w-full rounded-lg border border-border bg-card p-4 text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Region, budget, timeline…"
            />
          </div>
          <Button type="submit" size="lg">
            Request a consultation
          </Button>
          {sent ? (
            <p role="status" className="text-sm font-medium text-success">
              Thanks — this is a demo, so nothing was actually sent.
            </p>
          ) : null}
        </form>

        <ul className="space-y-4">
          {partners.map((p) => (
            <li key={p.id} className="rounded-2xl border border-border bg-card p-6">
              <span
                className="inline-block rounded-lg px-4 py-2 font-display text-lg font-bold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.name}
              </span>
              <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary-light">
                {p.badge}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
