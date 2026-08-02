import type { Partner } from "@/types/property";

export const partners: Partner[] = [
  {
    id: "p1",
    name: "hanamori",
    color: "oklch(0.45 0.24 268)",
    badge: "Licensed Japanese Real Estate Brokerage",
    description:
      "Our purchase partner. When you find the right property, Hanamori handles the Japanese side in English — enquiries, viewings, offers, contracts and aftersales support, from search to settlement.",
    quote: "Mika answered every question twice over and never rushed us. Genuinely painless.",
    author: "Hendrik",
    rating: 5,
  },
  {
    id: "p2",
    name: "kuraya",
    color: "oklch(0.5 0.16 165)",
    badge: "Renovation & Survey Specialists",
    description:
      "Structural surveys, renovation estimates and project management for older timber houses. Reports are delivered in English with photographs and a costed scope of work.",
    quote: "The survey saved us from a foundation problem we would never have spotted.",
    author: "Alice",
    rating: 5,
  },
  {
    id: "p3",
    name: "tsunagi",
    color: "oklch(0.52 0.19 35)",
    badge: "Relocation & Residency Support",
    description:
      "Municipal paperwork, utility set-up, residence registration and translation, for buyers moving in rather than investing from abroad.",
    quote: "They handled the city-hall side entirely. We just signed where they pointed.",
    author: "Marco",
    rating: 5,
  },
];
