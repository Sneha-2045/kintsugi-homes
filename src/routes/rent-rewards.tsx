import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown, ArrowRight, BadgePercent, Check, ChevronRight, CircleDollarSign, Clock3,
  Gift, Hotel, LockKeyhole, Plane, Sparkles, Ticket, WalletCards,
} from "lucide-react";
import { Button } from "@/components/common/Button";

export const Route = createFileRoute("/rent-rewards")({ component: RentRewardsPage });

const rewards = [
  { icon: BadgePercent, title: "Rent Discounts", text: "Use your points toward savings on a future rent payment.", style: "from-blue-500/20 to-cyan-400/5", accent: "text-sky-300", image: "photo-1600585154340-be6161a56a0c" },
  { icon: CircleDollarSign, title: "Cashback", text: "Redeem points for cashback benefits.", style: "from-emerald-500/20 to-teal-400/5", accent: "text-emerald-300", image: "photo-1579621970563-ebec7560ff3e" },
  { icon: Gift, title: "Gift Cards", text: "Choose gift cards and other useful rewards.", style: "from-fuchsia-500/20 to-pink-400/5", accent: "text-fuchsia-300", image: "photo-1549465220-1a8b9238cd48" },
  { icon: Sparkles, title: "Exclusive Offers", text: "Get access to special deals and tenant-only offers.", style: "from-amber-500/20 to-orange-400/5", accent: "text-amber-300", image: "photo-1515886657613-9f3515b0c78f" },
  { icon: Plane, title: "Flight Miles", text: "Earn travel miles when monthly rent payments succeed.", style: "from-cyan-500/25 to-blue-500/10", accent: "text-cyan-200", image: "photo-1436491865332-7a61a109cc05", featured: true },
  { icon: Ticket, title: "Flight Rewards", text: "Accumulate miles toward flight tickets under future program terms.", style: "from-indigo-500/25 to-violet-500/10", accent: "text-indigo-200", image: "photo-1501785888041-af3ef285b470", featured: true },
  { icon: Gift, title: "Travel Vouchers", text: "Explore travel vouchers and exclusive lifestyle offers.", style: "from-orange-500/20 to-rose-400/5", accent: "text-orange-200", image: "photo-1507525428034-b723cf961d3e" },
  { icon: Hotel, title: "Hotel Discounts", text: "Discover hotel booking benefits and travel deals.", style: "from-teal-500/20 to-cyan-400/5", accent: "text-teal-200", image: "photo-1510414842594-a61c69b5ae57" },
];

const steps = [
  { icon: WalletCards, title: "Pay Your Rent", text: "Complete your monthly payment through Rylestate." },
  { icon: Sparkles, title: "Earn Rewards", text: "Points are awarded after successful payment confirmation." },
  { icon: CircleDollarSign, title: "Build Your Balance", text: "Accumulate rewards every month you pay." },
  { icon: Plane, title: "Enjoy the Benefits", text: "Redeem eligible rewards for savings and travel benefits." },
];

function RentRewardsPage() {
  const [monthlyRent, setMonthlyRent] = useState(1500);
  const [months, setMonths] = useState(12);
  const totalRent = useMemo(() => monthlyRent * months, [monthlyRent, months]);
  const illustrativePoints = useMemo(() => Math.floor(totalRent), [totalRent]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("has-scroll-reveal");
    const elements = document.querySelectorAll<HTMLElement>(".scroll-reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("has-scroll-reveal");
    };
  }, []);

  const money = (amount: number) => new Intl.NumberFormat(undefined, {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="-mt-8 sm:-mt-12 md:-mt-20">
      <section className="relative isolate flex min-h-[680px] items-center overflow-hidden bg-slate-950 sm:min-h-[760px]">
        <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2400&q=88" alt="Airplane in flight above the clouds" className="rewards-hero-image absolute inset-0 -z-20 h-full w-full object-cover object-center" fetchPriority="high" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/20" />
        <div className="absolute right-[12%] top-[24%] hidden animate-[float_7s_ease-in-out_infinite] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white shadow-2xl backdrop-blur-md md:block">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300/20 text-amber-200"><Sparkles className="h-5 w-5" /></span><div><p className="text-xs text-blue-100">REWARD POINTS</p><p className="font-bold">Every rent payment</p></div></div>
        </div>
        <div className="absolute right-[6%] top-[55%] hidden animate-[float_8s_ease-in-out_infinite] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white shadow-2xl backdrop-blur-md md:block" style={{ animationDelay: "-2.5s" }}>
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/20 text-cyan-100"><Plane className="h-5 w-5" /></span><div><p className="text-xs text-blue-100">TRAVEL REWARDS</p><p className="font-bold">Your next adventure</p></div></div>
        </div>
        <div className="container-page w-full py-24 sm:py-32">
          <div className="max-w-3xl text-white motion-safe:animate-[fade-up_.8s_ease-out_both]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-100 backdrop-blur"><Sparkles className="h-4 w-4 text-amber-300" /> Rylestate Rent Rewards</span>
            <h1 className="mt-7 max-w-3xl text-4xl font-extrabold uppercase leading-[1.03] tracking-[-.04em] sm:text-6xl lg:text-7xl">Your Rent. Your Rewards. <span className="text-cyan-200">Your Next Adventure.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100 sm:text-xl">Every month you pay rent. Now, every payment can bring you closer to your next vacation.</p>
            <p className="mt-5 text-xl font-extrabold tracking-wide text-amber-200 sm:text-2xl">Pay Rent. Earn Miles. Fly More.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#all-rewards" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Explore Rewards <ArrowDown className="h-4 w-4" /></a><Button asChild size="lg" className="border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20"><Link to="/login">Start Earning <ArrowRight className="h-4 w-4" /></Link></Button></div>
            <p className="mt-6 text-xs text-slate-200/75">Travel earning rates and partners are not yet configured. See an illustrative points example below.</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      <main className="container-page">
        <div className="mx-auto -mt-10 max-w-7xl space-y-24 pb-20 sm:-mt-6 sm:space-y-32">
          <section id="all-rewards" className="scroll-reveal scroll-mt-24" aria-labelledby="rewards-title">
            <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary-light">One rent payment, more possibilities</p><h2 id="rewards-title" className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">More Than Rent. A World of Rewards.</h2><p className="mt-4 text-base leading-7 text-muted-foreground">Keep the everyday savings you love and explore travel benefits as an additional way to make rent count.</p></div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {rewards.map(({ icon: Icon, title, text, style, accent, image, featured }) => <article key={title} className={`group relative isolate min-h-[275px] overflow-hidden rounded-3xl border bg-card shadow-lg transition duration-500 hover:-translate-y-2 hover:shadow-2xl ${featured ? "border-cyan-300/40 shadow-cyan-950/25" : "border-border"}`}>
                <img src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=900&q=78`} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/15" />
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${style.replace("/20", "/80").replace("/25", "/80").replace("/5", "/20").replace("/10", "/30")} opacity-90`} />
                {featured && <span className="absolute right-4 top-4 rounded-full border border-cyan-100/25 bg-slate-950/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-100 backdrop-blur">Travel</span>}
                <div className="flex h-full min-h-[275px] flex-col justify-end p-5 sm:p-6"><span className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-gradient-to-br ${style} ${accent} shadow-lg backdrop-blur`}><Icon className="h-6 w-6" /></span><h3 className="text-xl font-bold text-white">{title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-white/80">{text}</p></div>
              </article>)}
            </div>
          </section>

          <section className="scroll-reveal grid items-center gap-8 overflow-hidden rounded-[2rem] border border-border bg-card shadow-elevated lg:grid-cols-[1.05fr_.95fr]" aria-labelledby="travel-title">
            <div className="relative min-h-[360px] overflow-hidden sm:min-h-[480px]"><img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85" alt="Tropical destination with turquoise water and a sandy beach" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" /><div className="absolute left-5 top-5 rounded-2xl border border-white/20 bg-slate-950/35 p-4 text-white backdrop-blur-md sm:left-8 sm:top-8"><p className="text-xs font-semibold uppercase tracking-wider text-cyan-100">Your journey starts here</p><div className="mt-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-300"/><span className="text-sm font-bold">Home</span><span className="mx-1 h-px w-14 border-t border-dashed border-white/60"/><Plane className="h-4 w-4 text-amber-200"/><span className="mx-1 h-px w-14 border-t border-dashed border-white/60"/><span className="h-2 w-2 rounded-full bg-cyan-200"/><span className="text-sm font-bold">Next trip</span></div></div><div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-slate-950/40 p-4 text-white backdrop-blur-md sm:bottom-8 sm:left-8 sm:right-8"><p className="text-xs uppercase tracking-widest text-cyan-100">Build your travel balance</p><div className="mt-3 flex items-center gap-2">{Array.from({ length: 12 }, (_, index) => <span key={index} className={`h-2 flex-1 rounded-full ${index < 7 ? "bg-cyan-200" : "bg-white/25"}`} />)}</div><p className="mt-2 text-right text-xs text-white/75">Monthly progress illustration</p></div></div>
            <div className="p-6 sm:p-10 lg:p-12"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary-light">A new way to look at rent</p><h2 id="travel-title" className="mt-3 text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">Your Next Boarding Pass Could Start With Your Rent.</h2><p className="mt-5 text-base leading-7 text-muted-foreground">Successful rent payments can build rewards points, with flight miles and travel benefits designed to add even more possibility. Keep paying consistently and on time to grow your balance and explore eligible rewards.</p><ul className="mt-6 space-y-3 text-sm text-foreground">{["Miles after successful monthly payments", "Bonus reward opportunities for on-time consistency", "Future flight, hotel and travel redemptions"].map((item) => <li key={item} className="flex items-start gap-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-500"><Check className="h-3.5 w-3.5" /></span>{item}</li>)}</ul><p className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">No airline or hotel partners, miles earning rates, point-to-mile conversions, or flight awards are represented as active. Those details will appear when configured.</p></div>
          </section>

          <section className="scroll-reveal" aria-labelledby="calculator-title"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-primary-light">Plan the possibilities</p><h2 id="calculator-title" className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">See Where Your Rent Could Take You.</h2><p className="mt-4 leading-7 text-muted-foreground">Try an illustrative points estimate using the current example rate. You can adjust your rent and timeline.</p></div><div className="rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-7"><div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="text-sm font-semibold text-foreground">Monthly rent</span><span className="mt-2 flex h-12 items-center rounded-xl border border-input bg-background px-3 text-muted-foreground"><span>$</span><input type="number" min="0" max="1000000" value={monthlyRent} onChange={(event) => setMonthlyRent(Math.max(0, Number(event.target.value) || 0))} className="w-full bg-transparent px-2 font-semibold text-foreground outline-none" aria-label="Monthly rent amount in US dollars" /></span></label><label className="block"><span className="text-sm font-semibold text-foreground">Number of months</span><span className="mt-2 flex h-12 items-center rounded-xl border border-input bg-background px-3"><input type="number" min="1" max="120" value={months} onChange={(event) => setMonths(Math.min(120, Math.max(1, Number(event.target.value) || 1)))} className="w-full bg-transparent font-semibold text-foreground outline-none" aria-label="Number of months" /><span className="text-sm text-muted-foreground">months</span></span></label></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-muted/60 p-4"><p className="text-xs font-medium text-muted-foreground">Total rent paid</p><p key={`rent-${totalRent}`} className="mt-2 text-2xl font-extrabold text-foreground motion-safe:animate-[counter-in_.45s_ease-out]">{money(totalRent)}</p></div><div className="rounded-2xl bg-blue-500/10 p-4"><p className="text-xs font-medium text-muted-foreground">Illustrative reward points</p><p key={`points-${illustrativePoints}`} className="mt-2 text-2xl font-extrabold text-primary-light motion-safe:animate-[counter-in_.45s_ease-out]">{illustrativePoints.toLocaleString()}</p></div><div className="rounded-2xl bg-muted/60 p-4"><p className="text-xs font-medium text-muted-foreground">Potential travel miles</p><p className="mt-2 text-base font-bold text-muted-foreground">Rate not configured</p></div></div><p className="mt-4 flex gap-2 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />Illustration only: 1 point per rent currency unit. Points are not converted to miles. Actual point and travel reward terms depend on configured program rates and partners.</p></div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><article className="rounded-2xl border border-border bg-card/70 p-4"><p className="font-semibold text-foreground">One point per rent currency unit</p><p className="mt-1 text-sm leading-5 text-muted-foreground">For example, a successful $1,500 rent payment earns 1,500 points. Points are added after payment confirmation.</p></article><article className="rounded-2xl border border-border bg-card/70 p-4"><p className="font-semibold text-foreground">One reward per payment</p><p className="mt-1 text-sm leading-5 text-muted-foreground">Payment references are unique, so duplicate confirmations never add points twice.</p></article><article className="rounded-2xl border border-border bg-card/70 p-4"><p className="font-semibold text-foreground">Redeem from your balance</p><p className="mt-1 text-sm leading-5 text-muted-foreground">For example, redeem 1,000 points for an available reward such as cashback, rent savings, a gift card, or a special offer.</p></article></div><p className="mt-3 text-center text-sm text-muted-foreground">Keep paying consistently and on time to unlock extra reward opportunities.</p>
          </section>

          <section className="scroll-reveal" aria-labelledby="steps-title"><div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-primary-light">Easy as one, two, go</p><h2 id="steps-title" className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">A little more joy in every month.</h2></div><ol className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{steps.map(({ icon: Icon, title, text }, index) => <li key={title} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"><span className="absolute -top-4 left-5 grid h-8 w-8 place-items-center rounded-full border-4 border-background bg-primary text-xs font-bold text-primary-foreground">0{index + 1}</span><span className="mt-2 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-400/10 text-primary-light"><Icon className="h-7 w-7" /></span><h3 className="mt-5 font-bold text-card-foreground">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>{index < steps.length - 1 && <ChevronRight className="absolute -right-4 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 rounded-full border border-border bg-background p-1 text-primary-light lg:block" />}</li>)}</ol><p className="mt-6 text-center text-sm text-muted-foreground"><Clock3 className="mr-1 inline h-4 w-4 align-[-3px]" />Reward points are credited after successful payment confirmation.</p></section>

          <section className="scroll-reveal relative isolate overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-center text-white shadow-2xl sm:px-12 sm:py-20"><img src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1800&q=85" alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover"/><div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-blue-950/65"/><div className="mx-auto max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyan-100"><Plane className="h-4 w-4"/> Make every payment count</span><h2 className="mt-6 text-3xl font-extrabold uppercase leading-tight sm:text-5xl">You Pay Rent Anyway. Why Not Get Rewarded for It?</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-100">Make every monthly payment count. Start your rewards journey with Rylestate.</p><Button asChild size="lg" className="mt-8 bg-white text-slate-950 hover:bg-cyan-50"><Link to="/login">Join Rylestate Today <ArrowRight className="h-4 w-4" /></Link></Button><p className="mt-4 text-xs text-white/65">Log in to view your personal balance, make rent payments and redeem rewards.</p></div></section>
        </div>
      </main>
    </div>
  );
}
