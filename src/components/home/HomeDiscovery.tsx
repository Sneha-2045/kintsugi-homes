import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BarChart3, Compass, Globe2, Map, Scale, Sparkles } from "lucide-react";
import { properties } from "@/data/properties";
import { usListings } from "@/data/us-listings";

const listingPhoto = (index: number) =>
  usListings[index]?.images?.find(Boolean) ?? "/images/miami-1369.avif";
const japanPhoto = properties[0]?.images?.find(Boolean) ?? "/images/miami-1369.avif";

const discoveries = [
  {
    number: "01",
    icon: Map,
    label: "See the market",
    title: "Explore homes on a map",
    body: "Scan available U.S. listings by place and get a feel for the neighborhoods on your shortlist.",
    action: "Open map",
    href: "/map",
    image: listingPhoto(0),
  },
  {
    number: "02",
    icon: Scale,
    label: "Make a shortlist",
    title: "Compare properties side by side",
    body: "Put the details that matter next to each other as you decide which homes deserve a closer look.",
    action: "Start comparing",
    href: "/compare",
    image: listingPhoto(5),
  },
  {
    number: "03",
    icon: BarChart3,
    label: "Look beyond the listing",
    title: "Get a property intelligence brief",
    body: "Explore available property context and insights to guide your next research steps.",
    action: "Explore insights",
    href: "/property-intelligence",
    image: listingPhoto(12),
  },
  {
    number: "04",
    icon: Globe2,
    label: "Take a different path",
    title: "Discover homes across Japan",
    body: "Browse distinctive homes, land, and akiya opportunities across Japan’s regions.",
    action: "Explore Japan",
    href: "/search?q=Japan",
    image: japanPhoto,
  },
];

export function HomeDiscovery() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`home-reveal bg-background py-16 md:py-24 ${visible ? "is-visible" : ""}`}
      aria-labelledby="discovery-title"
    >
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-primary-light">
              <Sparkles className="h-4 w-4" /> Your search, with more possibilities
            </p>
            <h2
              id="discovery-title"
              className="mt-3 text-3xl font-bold text-foreground md:text-4xl"
            >
              Where would you like to go next?
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Go beyond the first search. Explore markets, compare your shortlist, and find the
              tools that fit your next move.
            </p>
          </div>
          <a
            href="/us-properties"
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-elevated md:self-auto"
          >
            Browse all U.S. listings <Compass className="h-4 w-4 text-primary-light" />
          </a>
        </div>

        <ul className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {discoveries.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.number}
                className="home-reveal-card"
                style={{ animationDelay: `${Number(item.number) * 85}ms` }}
              >
                <a
                  href={item.href}
                  className="group relative flex h-full min-h-72 flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0b1422] p-5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-primary-light/60 hover:shadow-[0_22px_55px_-25px_rgba(59,130,246,.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
                >
                  <img
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-700 ease-out group-hover:scale-110 group-hover:opacity-55 motion-reduce:transform-none motion-reduce:transition-none"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08111e] via-[#0b1422]/85 to-[#0b1422]/45 transition-colors duration-300 group-hover:via-[#0b1422]/75" />
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(59,130,246,.22),transparent_38%)] opacity-60 transition-opacity group-hover:opacity-100" />
                  <span className="relative flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-[#08111e]/80 text-blue-200 shadow-lg backdrop-blur-sm transition duration-300 group-hover:border-blue-200/50 group-hover:bg-blue-500/20">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-white/65">{item.number}</span>
                  </span>
                  <span className="relative mt-7 text-xs font-bold uppercase tracking-[.12em] text-blue-100/90">
                    {item.label}
                  </span>
                  <span className="relative mt-2 text-xl font-bold leading-snug text-white drop-shadow-sm">
                    {item.title}
                  </span>
                  <span className="relative mt-2 flex-1 text-sm leading-6 text-slate-200">
                    {item.body}
                  </span>
                  <span className="relative mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-200 transition-colors group-hover:text-white">
                    {item.action}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
