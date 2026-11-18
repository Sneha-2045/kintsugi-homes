import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Globe2, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";
import { properties } from "@/data/properties";
import { usListings } from "@/data/us-listings";

const values = [
  {
    icon: Compass,
    title: "Discover more",
    text: "Explore foreclosure listings, U.S. homes, and distinctive Japanese properties from one place.",
  },
  {
    icon: SearchCheck,
    title: "Search smarter",
    text: "Use location, price, and property details to narrow down the opportunities worth a closer look.",
  },
  {
    icon: Globe2,
    title: "Explore supported markets",
    text: "Move between U.S. states and Japan regions, with listings and market context in one experience.",
  },
  {
    icon: ShieldCheck,
    title: "Make informed moves",
    text: "Compare available details, review listing sources, and know what to verify before taking a next step.",
  },
];

export function HomeValueSections() {
  const storyImage =
    usListings.find((listing) => listing.images?.[0])?.images?.[0] ?? "/images/miami-1369.avif";
  const ctaImage =
    properties.find((property) => property.images?.[0])?.images?.[0] ?? "/images/miami-1369.avif";

  return (
    <>
      <section className="bg-surface py-16 text-foreground md:py-24" aria-labelledby="why-title">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-primary-light">
              Why Rylestate
            </p>
            <h2
              id="why-title"
              className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-5xl"
            >
              Real estate discovery, made smarter.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
              Useful tools and property context to help you explore at your own pace.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {values.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.title}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-blue-950/10"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary-light transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-card-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-background py-16 md:py-24" aria-labelledby="story-title">
        <div className="container-page">
          <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-elevated lg:grid-cols-2">
            <div className="group relative min-h-72 overflow-hidden sm:min-h-96">
              <img
                src={storyImage}
                alt="Home currently listed in the Rylestate property index"
                loading="lazy"
                className="h-full min-h-72 w-full object-cover transition duration-700 group-hover:scale-105 sm:min-h-96 motion-reduce:transform-none motion-reduce:transition-none"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
              <span className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/50 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                <Sparkles className="h-4 w-4 text-blue-200" /> New ways to explore
              </span>
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary-light">
                A different kind of property search
              </p>
              <h2
                id="story-title"
                className="mt-4 text-3xl font-bold leading-tight text-foreground md:text-4xl"
              >
                Your next opportunity is out there.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                From everyday homes to distinctive investment opportunities, discover a better way
                to explore real estate. Start with a place, a price range, or simply a possibility.
              </p>
              <Link
                to="/us-properties"
                className="mt-7 inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                Start exploring <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative isolate overflow-hidden py-16 md:py-20"
        aria-labelledby="final-cta-title"
      >
        <img
          src={ctaImage}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(5,12,23,.95),rgba(5,12,23,.76))]" />
        <div className="container-page relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-200">
              Make your next move count
            </p>
            <h2 id="final-cta-title" className="mt-3 text-3xl font-bold text-white md:text-5xl">
              The next move could be your best one yet.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
              Explore properties, discover opportunities, and take the next step with Rylestate.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="h-12">
                <Link to="/us-properties">Explore properties</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-white/35 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/pricing">Start your free trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
