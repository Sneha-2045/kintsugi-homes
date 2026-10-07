import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Building2, Compass, FileText, MapPin } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { propertyCategories, properties } from "@/data/properties";
import { usListings } from "@/data/us-listings";
import { regions } from "@/data/regions";
import { prefectures } from "@/data/prefectures";
import { articles } from "@/data/articles";
import { bulkListings } from "@/data/bulk-listings";
import { moreProperties } from "@/data/more-properties";

export const Route = createFileRoute("/sitemap")({ component: SitemapPage });

type SitemapLink = { label: string; href: string };

function LinkGroup({
  title,
  description,
  icon: Icon,
  links,
}: {
  title: string;
  description: string;
  icon: typeof Building2;
  links: SitemapLink[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-7">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-light">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {links.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {links.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <a
                href={link.href}
                className="group flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-elevated hover:text-primary-light"
              >
                <span>{link.label}</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No listings are currently available.</p>
      )}
    </section>
  );
}

function SitemapPage() {
  const demoJapanIds = new Set([
    ...bulkListings.map((property) => property.id),
    ...moreProperties.map((property) => property.id),
  ]);
  const japanListingLinks = properties
    .filter((property) => property.sourceUrl && !demoJapanIds.has(property.id))
    .map((property) => ({ label: property.title, href: `/property/${encodeURIComponent(property.id)}` }));
  const usListingLinks = usListings
    .filter((property) => property.sourceUrl && property.lastCheckedAt)
    .map((property) => ({ label: property.title, href: `/property/${encodeURIComponent(property.id)}` }));

  return (
    <PageShell
      title="Explore the site"
      description="A guide to the property listings, locations, resources and key pages on Real Estate."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <LinkGroup
          title="Main pages"
          description="Start browsing or learn more about the service."
          icon={Compass}
          links={[
            { label: "Home", href: "/" },
            { label: "Search properties", href: "/search" },
            { label: "Map view", href: "/map" },
            { label: "Consult an expert", href: "/consult" },
            { label: "Pricing", href: "/pricing" },
            { label: "Sign in", href: "/login" },
            { label: "Saved properties", href: "/saved" },
            { label: "Articles and guides", href: "/articles" },
          ]}
        />
        <LinkGroup
          title="Properties by country"
          description="Browse available properties in each market."
          icon={Building2}
          links={[
            { label: "🇺🇸 United States properties", href: "/us-properties" },
            { label: "🇯🇵 Japan properties", href: "/japan-properties" },
            ...propertyCategories
              .filter((category) => category.count > 0)
              .map((category) => ({ label: `${category.title} in Japan`, href: `/category/${encodeURIComponent(category.slug)}` })),
          ]}
        />
        <LinkGroup
          title="Japan regions"
          description="Explore Japanese property by region and prefecture."
          icon={MapPin}
          links={[
            ...regions
              .filter((region) => region.count > 0)
              .map((region) => ({ label: `${region.name} region`, href: `/region/${encodeURIComponent(region.slug)}` })),
            ...prefectures
              .filter((prefecture) => prefecture.count > 0)
              .map((prefecture) => ({ label: `${prefecture.name} Prefecture`, href: `/prefecture/${encodeURIComponent(prefecture.slug)}` })),
          ]}
        />
        <LinkGroup
          title="Guides and articles"
          description="Read practical guides and learn about Japanese homes."
          icon={FileText}
          links={articles.map((article) => ({ label: article.title, href: "/articles" }))}
        />
        <LinkGroup
          title="Japan property listings"
          description={`${japanListingLinks.length} source-backed listings`}
          icon={Building2}
          links={japanListingLinks}
        />
        <LinkGroup
          title="US property listings"
          description={`${usListingLinks.length} source-backed listings`}
          icon={Building2}
          links={usListingLinks}
        />
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Search engines can use the <a href="/sitemap.xml" className="font-medium text-primary-light hover:underline">XML sitemap</a>.
      </p>
    </PageShell>
  );
}
