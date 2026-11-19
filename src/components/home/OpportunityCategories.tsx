import { ArrowUpRight, Building2, Gavel, House, LandPlot, Lightbulb, Sparkles } from "lucide-react";
import { properties } from "@/data/properties";
import { usListings } from "@/data/us-listings";
import { tranchiProperties } from "@/data/tranchi-properties";

const categoryPhoto = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=80`;

const foreclosureListings = usListings.filter((listing) =>
  listing.tags.some((tag) => /foreclosure/i.test(tag)),
);
const auctionListings = usListings.filter(
  (listing) => Boolean(listing.auctionDate) || listing.tags.some((tag) => /auction/i.test(tag)),
);
const investmentListings = [...usListings, ...tranchiProperties].filter(
  (listing) => listing.tags.some((tag) => /investment/i.test(tag)) || listing.isTranchi,
);
const japanApartments = properties.filter((property) => property.categorySlug === "apartment");
const japanLand = properties.filter((property) => property.categorySlug === "land");

const opportunities = [
  {
    title: "Foreclosure homes",
    description: "Find homes with a different path to ownership.",
    count: foreclosureListings.length,
    image: categoryPhoto("photo-1568605114967-8130f3a36994"),
    icon: House,
    href: "/us-properties?category=Foreclosure%20Sale",
  },
  {
    title: "Auction properties",
    description: "Explore listings with auction dates when provided.",
    count: auctionListings.length,
    image: categoryPhoto("photo-1600585154340-be6161a56a0c"),
    icon: Gavel,
    href: "/us-properties?category=Auction",
  },
  {
    title: "Investment opportunities",
    description: "Research properties and opportunities from multiple sources.",
    count: investmentListings.length,
    image: categoryPhoto("photo-1486406146926-c627a92ad1ab"),
    icon: Lightbulb,
    href: "/us-properties?category=Investment",
  },
  {
    title: "Apartments in Japan",
    description: "Explore compact city homes and apartment listings.",
    count: japanApartments.length,
    image: categoryPhoto("photo-1600607687939-ce8a6c25118c"),
    icon: Building2,
    href: "/category/apartment",
  },
  {
    title: "Land & plots",
    description: "Find a place to build, restore, or make your own.",
    count: japanLand.length,
    image: categoryPhoto("photo-1516156008625-3a9d6067fab5"),
    icon: LandPlot,
    href: "/category/land",
  },
  {
    title: "Distinctive homes",
    description: "Browse homes across the U.S. and regions of Japan.",
    count: usListings.length + properties.length,
    image: categoryPhoto("photo-1613490493576-7fde63acd811"),
    icon: Sparkles,
    href: "/search",
  },
];

export function OpportunityCategories() {
  return (
    <section
      className="bg-background py-16 text-foreground md:py-24"
      aria-labelledby="opportunities-title"
    >
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-primary-light">
            Explore opportunities
          </p>
          <h2
            id="opportunities-title"
            className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-5xl"
          >
            Every property has a possibility.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
            Start with the kind of move you have in mind. See what’s available, then follow the
            details that matter to you.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className="min-w-0">
                <a
                  href={item.href}
                  className="group relative flex min-h-72 overflow-hidden rounded-2xl border border-border bg-card shadow-md shadow-slate-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
                >
                  <img
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/15 transition-colors duration-300 group-hover:via-slate-950/60" />
                  <span className="relative mt-auto w-full p-5 sm:p-6">
                    <span className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/25 bg-slate-950/40 text-blue-200 backdrop-blur-sm">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="rounded-full border border-white/20 bg-slate-950/40 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                        {item.count.toLocaleString("en-US")} indexed
                      </span>
                    </span>
                    <h3 className="mt-5 text-xl font-bold text-white sm:text-2xl">{item.title}</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-200">
                      {item.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-200 transition-colors group-hover:text-white">
                      Explore category{" "}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Counts reflect indexed listings and may include homes from multiple sources. Confirm
          current details with each listing publisher.
        </p>
      </div>
    </section>
  );
}
