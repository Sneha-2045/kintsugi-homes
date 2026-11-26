import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Gift, Sparkles, ArrowDownLeft, ArrowUpRight, Clock3 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/common/Button";

export const Route = createFileRoute("/_authenticated/rewards")({ component: RewardsPage });

type RewardTransaction = { id: string; kind: "earned" | "redeemed"; points: number; description: string; created_at: string };
const rewards = [
  { name: "Rent discount", points: 500, detail: "$5 off your next rent payment" },
  { name: "Cashback", points: 1000, detail: "$10 cashback to your account" },
  { name: "Gift card", points: 2000, detail: "A $20 gift card of your choice" },
  { name: "Exclusive offer", points: 500, detail: "Unlock a curated tenant offer" },
];

function RewardsPage() {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const { data: transactions = [], isPending, error } = useQuery({
    queryKey: ["rent-reward-transactions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("rent_reward_transactions")
        .select("id,kind,points,description,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data as RewardTransaction[];
    },
  });
  const balance = transactions.reduce((total, row) => total + (row.kind === "earned" ? row.points : -row.points), 0);

  async function redeem(name: string, points: number) {
    setMessage("");
    const { error } = await (supabase as any).rpc("redeem_rent_reward", { p_reward: name, p_points: points });
    if (error) { setMessage(error.message.includes("Not enough") ? "You need more points for this reward." : "We couldn’t redeem this reward. Please try again."); return; }
    setMessage(`${name} redeemed. Your reward is on its way!`);
    await queryClient.invalidateQueries({ queryKey: ["rent-reward-transactions"] });
  }

  return <PageShell title="Rent Rewards" description="Your on-time payments deserve rewards.">
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-teal-900 p-7 text-white shadow-xl sm:p-10">
        <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full bg-teal-300/15 blur-2xl" />
        <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold"><Sparkles className="h-4 w-4 text-amber-300"/> TENANT REWARDS</div>
            <h1 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Pay Rent, Earn Rewards!</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-blue-100">Your On-Time Payments Deserve Rewards. Earn points every time your rent payment is confirmed.</p>
          </div>
          <div className="min-w-52 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur"><p className="text-sm text-blue-100">Available balance</p><p className="mt-1 text-4xl font-bold">{isPending ? "—" : balance.toLocaleString()} <span className="text-base font-medium text-teal-200">pts</span></p><p className="mt-2 text-xs text-blue-100">Ready to use on a reward</p></div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold text-foreground">Ways to redeem</h2><p className="mt-1 text-sm text-muted-foreground">Choose a reward that works for you.</p></div><Gift className="h-6 w-6 text-teal-600"/></div>
          {message && <p role="status" className="mb-4 rounded-xl bg-teal-50 p-3 text-sm text-teal-900">{message}</p>}
          <div className="grid gap-3 sm:grid-cols-2">{rewards.map((reward) => <article key={reward.name} className="flex flex-col rounded-xl border border-border p-4">
            <p className="font-semibold text-foreground">{reward.name}</p><p className="mt-1 min-h-10 text-sm text-muted-foreground">{reward.detail}</p><div className="mt-4 flex items-center justify-between gap-2"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">{reward.points.toLocaleString()} pts</span><Button size="sm" variant="outline" disabled={balance < reward.points} onClick={() => redeem(reward.name, reward.points)}>Redeem</Button></div>
          </article>)}</div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-5"><h2 className="text-xl font-bold text-foreground">Your points history</h2><p className="mt-1 text-sm text-muted-foreground">Every reward earned and redeemed, all in one place.</p></div>
          {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Rewards history is temporarily unavailable.</p>}
          {isPending && <p className="py-8 text-center text-sm text-muted-foreground">Loading your rewards…</p>}
          {!isPending && !error && transactions.length === 0 && <div className="rounded-xl bg-muted/50 px-4 py-8 text-center"><Clock3 className="mx-auto h-7 w-7 text-muted-foreground"/><p className="mt-3 font-medium text-foreground">Your rewards journey starts here</p><p className="mt-1 text-sm text-muted-foreground">Points will appear after your first confirmed rent payment.</p></div>}
          <ul className="divide-y divide-border">{transactions.map((row) => <li key={row.id} className="flex items-center gap-3 py-4"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${row.kind === "earned" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{row.kind === "earned" ? <ArrowDownLeft className="h-5 w-5"/> : <ArrowUpRight className="h-5 w-5"/>}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{row.description}</p><p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p></div><span className={`shrink-0 text-sm font-bold ${row.kind === "earned" ? "text-emerald-700" : "text-foreground"}`}>{row.kind === "earned" ? "+" : "−"}{row.points.toLocaleString()} pts</span></li>)}</ul>
        </section>
      </div>
      <section className="rounded-2xl border border-border bg-muted/30 p-5 sm:p-6"><h2 className="font-bold text-foreground">How Rent Rewards work</h2><div className="mt-3 grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-3"><p><strong className="text-foreground">1 point per rent currency unit.</strong> Points are added automatically when a rent payment is confirmed as successful.</p><p><strong className="text-foreground">One reward per payment.</strong> Payment references are unique, so payment confirmation retries never add duplicate points.</p><p><strong className="text-foreground">Redeem from your balance.</strong> Choose any available reward above. Points are deducted as soon as redemption succeeds.</p></div></section>
    </div>
  </PageShell>;
}
