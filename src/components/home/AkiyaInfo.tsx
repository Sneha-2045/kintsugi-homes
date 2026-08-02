import { ArrowRight } from "lucide-react";

const stats = [
  {
    value: "$0 – $31K",
    label: "Typical Price Range",
    color: "text-primary-light",
    body: "Some municipalities offer akiya for free. Rural homes commonly sell for ¥500,000–¥5,000,000 (about $3K–$31K).",
  },
  {
    value: "No Restrictions",
    label: "Foreign Ownership",
    color: "text-success",
    body: "Japan places no restrictions on foreign property ownership. Buy land and buildings outright, remotely, with a licensed agent.",
  },
  {
    value: "2,690+ Sources",
    label: "Akiya Banks & Agencies",
    color: "text-violet",
    body: "Yadori Estate aggregates municipal akiya banks and agency listings into one English-language search — 1,536,000+ properties across all 47 prefectures.",
  },
];

const steps = [
  {
    title: "1 · Search & discover",
    body: "Browse all 47 prefectures with the map, filters and English descriptions.",
  },
  {
    title: "2 · Save & get alerts",
    body: "Save searches and get daily email alerts when new properties match.",
  },
  {
    title: "3 · Connect & purchase",
    body: "Buy through a licensed partner agent when you find the right one.",
  },
];

const quickLinks: { label: string; href: string }[] = [
  { label: "Houses for Sale", href: "/category/house" },
  { label: "Cheap Houses", href: "/search" },
  { label: "Abandoned Houses", href: "/category/akiya-bank" },
  { label: "Akiya Bank Listings", href: "/category/akiya-bank" },
  { label: "What is an Akiya?", href: "/articles" },
  { label: "Compare Japan RE Websites", href: "/articles" },
];

export function AkiyaInfo() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="akiya-title">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="akiya-title" className="text-3xl font-bold text-foreground md:text-[44px]">
            What is an Akiya?
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
            Akiya (空き家) means &ldquo;empty house&rdquo; in Japanese. With over 9 million vacant
            homes across the country, Japan&rsquo;s akiya represent one of the most affordable entry
            points into property ownership — and{" "}
            <strong className="font-semibold text-foreground">
              foreigners can buy with the same rights as Japanese citizens
            </strong>
            , no visa required.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {stats.map((s) => (
            <li
              key={s.label}
              className="rounded-2xl border border-border bg-card p-7 text-center transition-colors hover:border-primary/40"
            >
              <p className={`text-2xl font-bold md:text-3xl ${s.color}`}>{s.value}</p>
              <h3 className="mt-2 text-base font-semibold text-foreground">{s.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-2xl border border-border bg-card p-7 md:p-10">
          <h3 className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            How it works
          </h3>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.title} className="text-center">
                <h4 className="text-lg font-semibold text-foreground">{step.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {quickLinks.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-light hover:text-primary"
              >
                {l.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
