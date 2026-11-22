import { Link } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { BrandMark } from "@/components/common/BrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { label: "US Properties", to: "/us-properties", icon: "🇺🇸" },
  { label: "MLS Listings", to: "/properties" },
  { label: "Property Intelligence", to: "/property-intelligence" },
  { label: "Live Intelligence", to: "/live-intelligence" },
  { label: "Japan Properties", to: "/japan-properties", icon: "🇯🇵" },
  { label: "Search", to: "/search" },
  { label: "Find an Agent", to: "/find-an-agent" },
  { label: "Map", to: "/map" },
  { label: "Articles", to: "/articles" },
  { label: "Saved Searches", to: "/saved" },
  { label: "Saved Properties", to: "/saved-properties" },
  { label: "Compare", to: "/compare" },
  { label: "Pricing", to: "/pricing" },
  { label: "Consult", to: "/consult" },
] as const;

const primaryNavItems = [
  { label: "Buy", href: "/us-properties" },
  { label: "Foreclosure", href: "/us-properties?category=Foreclosure%20Sale" },
  { label: "Auctions", href: "/us-properties?category=Auction" },
  { label: "Investment", href: "/us-properties?category=Investment" },
  { label: "Explore markets", href: "/map" },
  { label: "Live Intelligence", href: "/live-intelligence" },
] as const;

function Brand() {
  return (
    <Link
      to="/"
      className="flex shrink-0 items-center leading-none"
      aria-label="Rylestate.com — home"
    >
      <BrandMark className="h-auto w-28 min-[360px]:w-32 sm:w-40 md:w-48" />
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur">
      <nav
        aria-label="Main"
        className="container-page flex h-16 min-w-0 items-center gap-2 py-2 sm:h-18 sm:gap-4 sm:py-3 xl:gap-6"
      >
        <Brand />

        <ul className="hidden flex-1 items-center justify-center gap-1 2xl:flex">
          {primaryNavItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-elevated hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <Link
          to="/live-intelligence"
          className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-elevated hover:text-foreground xl:inline-flex 2xl:hidden"
          activeProps={{ className: "!bg-elevated !text-foreground" }}
        >
          Live Intelligence
        </Link>

        <div className="ml-auto hidden items-center gap-3 2xl:flex">
          <a
            href="tel:+18886933908"
            className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-elevated"
            aria-label="Call +1 (888) 693-3908"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call (888) 693-3908
          </a>
          <ThemeToggle />
          <Link
            to="/login"
            className="px-2 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Button asChild size="md">
            <Link to="/pricing">Start Free Trial</Link>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2 2xl:hidden">
          <ThemeToggle />
          <a
            href="tel:+18886933908"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-foreground hover:bg-elevated"
            aria-label="Call +1 (888) 693-3908"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span className="hidden min-[360px]:inline md:hidden">Call</span>
            <span className="hidden md:inline">(888) 693-3908</span>
          </a>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/pricing">Free Trial</Link>
          </Button>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-md border border-border text-foreground"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-border bg-surface 2xl:hidden">
          <ul className="container-page flex flex-col py-3">
            {[...navItems, { label: "Log in", to: "/login" as const }].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-3 text-base font-medium text-muted-foreground hover:bg-elevated hover:text-foreground"
                  activeProps={{
                    className:
                      "!bg-primary !font-extrabold !text-primary-foreground shadow-sm ring-1 ring-inset ring-primary-light/50",
                  }}
                >
                  {"icon" in item ? (
                    <span aria-hidden="true" className="mr-2 inline-block align-[-1px]">
                      {item.icon}
                    </span>
                  ) : null}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
