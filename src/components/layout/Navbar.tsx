import { Link } from "@tanstack/react-router";
import { Menu, Settings, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";

const navItems = [
  { label: "Japan Properties", to: "/japan-properties" },
  { label: "US Properties", to: "/us-properties" },
  { label: "Search", to: "/search" },
  { label: "Map", to: "/map" },
  { label: "Articles", to: "/articles" },
  { label: "Saved", to: "/saved" },
  { label: "Pricing", to: "/pricing" },
  { label: "Consult", to: "/consult" },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex shrink-0 flex-col leading-none" aria-label="Yadori Estate — home">
      <span className="font-display text-xl font-bold tracking-tight text-foreground md:text-[22px]">
        Yadori<span className="text-primary-light"> Estate</span>
      </span>
      <span className="mt-1 text-[10px] tracking-[0.28em] text-subtle">ヤドリ・日本の空き家</span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur">
      <nav aria-label="Main" className="container-page flex h-18 items-center gap-6 py-3">
        <Brand />

        <ul className="hidden flex-1 items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="rounded-md px-3.5 py-2 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <button
            type="button"
            aria-label="Site settings"
            className="grid h-9 w-9 place-items-center rounded-md text-subtle transition-colors hover:bg-elevated hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
          </button>
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

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <Button asChild size="sm">
            <Link to="/pricing">Free Trial</Link>
          </Button>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-md border border-border text-foreground"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-border bg-surface lg:hidden">
          <ul className="container-page flex flex-col py-3">
            {[...navItems, { label: "Log in", to: "/login" as const }].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-3 text-base font-medium text-muted-foreground hover:bg-elevated hover:text-foreground"
                >
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
