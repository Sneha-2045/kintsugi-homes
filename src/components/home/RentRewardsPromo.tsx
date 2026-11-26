import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgePercent, CalendarCheck, Gift, Hotel, Plane, Sparkles, Ticket, WalletCards } from "lucide-react";
import { Button } from "@/components/common/Button";

const benefits = [
  { icon: Sparkles, title: "Points on every payment", text: "Earn points whenever your rent payment is confirmed." },
  { icon: BadgePercent, title: "Cashback & rent discounts", text: "Turn points into savings on rent or cashback benefits." },
  { icon: Gift, title: "Gift cards & special deals", text: "Choose gift cards, exclusive offers, and exciting extras." },
  { icon: CalendarCheck, title: "More for consistency", text: "Keep paying on time to unlock extra reward opportunities." },
];

const travelBenefits = [
  { icon: Plane, title: "Flight Miles", text: "Earn travel miles when each monthly rent payment succeeds." },
  { icon: Ticket, title: "Flight Rewards", text: "Build miles toward flight tickets, subject to future program and partner terms." },
  { icon: Gift, title: "Travel Vouchers", text: "Look forward to travel vouchers and lifestyle offers." },
  { icon: Hotel, title: "Hotel Discounts", text: "Discover hotel booking benefits and exclusive travel deals." },
];

export function RentRewardsPromo() {
  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="rent-rewards-title">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2rem] border border-blue-400/20 bg-gradient-to-br from-slate-950 via-blue-950 to-teal-950 p-5 shadow-2xl shadow-blue-950/25 sm:p-8 lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-cyan-100"><Sparkles className="h-4 w-4 text-amber-300"/> Rylestate Rent Rewards</span>
              <h2 id="rent-rewards-title" className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">Your Rent Should Reward You!</h2>
              <p className="mt-3 text-lg font-bold text-cyan-200 sm:text-xl">Pay Rent. Earn Rewards. Fly More!</p>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-blue-100 md:text-lg">Pay your home rent through Rylestate and turn your biggest monthly expense into exciting travel rewards. Keep your existing points, cashback, rent discounts, gift cards, and exclusive offers, with travel rewards as an additional benefit.</p>
              <div className="mt-7"><Button asChild size="lg" className="bg-white text-blue-950 hover:bg-cyan-50"><Link to="/rent-rewards">Explore Rent Rewards <ArrowRight className="h-4 w-4"/></Link></Button></div>
            </div>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {benefits.map(({ icon: Icon, title, text }) => <li key={title} className="rounded-2xl border border-white/10 bg-white/[.07] p-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[.11]">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-300/15 text-cyan-200"><Icon className="h-5 w-5"/></span>
                <h3 className="mt-4 font-bold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-blue-100/80">{text}</p>
              </li>)}
            </ul>

            <div className="mt-8">
              <div className="mb-4"><h3 className="text-xl font-bold text-white sm:text-2xl">Take your rewards further</h3><p className="mt-1 text-sm text-blue-100/75">Travel and flight miles add another way to enjoy your monthly rent rewards.</p></div>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {travelBenefits.map(({ icon: Icon, title, text }) => <li key={title} className="rounded-2xl border border-cyan-100/15 bg-cyan-200/[.06] p-5 transition duration-300 hover:-translate-y-1 hover:bg-cyan-200/[.1]">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-200/15 text-cyan-100"><Icon className="h-5 w-5"/></span>
                  <h4 className="mt-4 font-bold text-white">{title}</h4><p className="mt-2 text-sm leading-6 text-blue-100/80">{text}</p>
                </li>)}
              </ul>
            </div>

            <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-5 sm:p-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div><p className="text-xs font-bold uppercase tracking-[.14em] text-cyan-200">A simple example</p><p className="mt-2 text-lg font-bold text-white">$1,500 monthly rent</p><p className="mt-1 text-sm text-blue-100/75">Earn 1 point per rent currency unit when payment succeeds.</p></div>
              <div className="flex items-center gap-3 text-cyan-200 md:flex-col"><span className="h-px flex-1 bg-white/15 md:h-8 md:w-px"/><ArrowRight className="h-5 w-5 rotate-90 md:rotate-0"/><span className="h-px flex-1 bg-white/15 md:h-8 md:w-px"/></div>
              <div className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-300/15 text-amber-200"><WalletCards className="h-6 w-6"/></span><div><p className="text-2xl font-extrabold text-white">1,500 points</p><p className="text-sm text-blue-100/75">Redeem for a rent discount, cashback, gift card, or offer.</p></div></div>
            </div>
            <div className="mt-5 rounded-2xl border border-cyan-100/15 bg-cyan-200/[.06] p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-cyan-200">12-month flight miles example · illustrative only</p>
              <p className="mt-2 text-base font-semibold text-white">12 successful monthly rent payments build your travel rewards balance over time.</p>
              <p className="mt-2 text-sm leading-6 text-blue-100/75">For example, paying $1,500 rent each month means $18,000 in rent paid over 12 months. The miles earned depend on a future published earning rate and configured travel partners; no miles total or flight is guaranteed.</p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="How travel rewards work">
              {["Pay rent through Rylestate", "Earn miles after successful payments", "Accumulate miles with monthly payments", "Redeem for flights and travel benefits"].map((step, index) => <div key={step} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.04] p-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-300/15 text-xs font-bold text-cyan-100">{index + 1}</span><p className="text-sm font-medium leading-5 text-white">{step}</p></div>)}
            </div>
            <p className="mt-4 text-center text-xs leading-5 text-blue-100/60">On-time payment streaks may unlock extra points and bonus miles. Flight mile rates, airline and hotel partners, and redemption terms will be published when configured. Available redemption options and terms are shown in your rewards account.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
