import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDown, ArrowRight, BriefcaseBusiness, Check, ChevronDown, HeartHandshake, Lightbulb,
  MapPin, Rocket, Send, ShieldCheck, Sparkles, Users, X,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { canonicalLink } from "@/lib/seo";

const title = "Careers at Rylestate | Build the Future of Renting";
const description = "Explore future career opportunities at Rylestate. Join us to build smarter real estate experiences for tenants, landlords and communities.";
const careerLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: "https://rylestate.com/careers",
  about: { "@type": "Organization", name: "Rylestate", url: "https://rylestate.com" },
};

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { name: "robots", content: "index,follow" },
    ],
    links: [canonicalLink("/careers")],
  }),
  component: CareersPage,
});

const values = [
  { icon: Lightbulb, title: "Innovation", text: "Work on modern real estate technology that can make renting simpler." },
  { icon: Rocket, title: "Growth", text: "Build your skills and career as we shape new products and experiences." },
  { icon: ShieldCheck, title: "Ownership", text: "Take responsibility, bring ideas forward, and make a visible impact." },
  { icon: Users, title: "Collaboration", text: "Work with passionate people who bring different perspectives to the table." },
  { icon: HeartHandshake, title: "Flexibility", text: "Find a supportive, productive way of working that makes room for life." },
];

const positions = [
  { title: "Frontend Developer", department: "Engineering", type: "Full-time", location: "Remote / Flexible", description: "Create clear, responsive experiences for people searching, renting and managing homes.", skills: ["React", "TypeScript", "Accessibility"] },
  { title: "Backend Developer", department: "Engineering", type: "Full-time", location: "Remote / Flexible", description: "Build secure, dependable services and data workflows for a growing real estate platform.", skills: ["Node.js", "APIs", "PostgreSQL"] },
  { title: "Full Stack Developer", department: "Engineering", type: "Full-time", location: "Remote / Flexible", description: "Work across the product stack to turn practical ideas into polished features.", skills: ["React", "TypeScript", "SQL"] },
  { title: "UI/UX Designer", department: "Design", type: "Full-time", location: "Remote / Flexible", description: "Shape intuitive journeys and a consistent design system for tenants and property seekers.", skills: ["Figma", "Prototyping", "Research"] },
  { title: "Digital Marketing Executive", department: "Marketing", type: "Full-time", location: "Remote / Flexible", description: "Plan campaigns that help more people discover useful property and rental tools.", skills: ["Campaigns", "Analytics", "Content"] },
  { title: "SEO Specialist", department: "Marketing", type: "Full-time", location: "Remote / Flexible", description: "Improve how renters and buyers find Rylestate through helpful, discoverable content.", skills: ["Technical SEO", "Search Console", "Content"] },
  { title: "Business Development Executive", department: "Growth", type: "Full-time", location: "Remote / Flexible", description: "Build relationships and identify thoughtful opportunities to grow the platform.", skills: ["Research", "Communication", "Partnerships"] },
  { title: "Sales & Partnerships Associate", department: "Growth", type: "Full-time", location: "Remote / Flexible", description: "Support partner relationships and help bring relevant services to our community.", skills: ["Relationship building", "Sales", "Organization"] },
  { title: "Real Estate Operations Executive", department: "Operations", type: "Full-time", location: "Remote / Flexible", description: "Help maintain reliable property information and smooth day-to-day processes.", skills: ["Operations", "Research", "Attention to detail"] },
  { title: "Customer Success Executive", department: "Customer Success", type: "Full-time", location: "Remote / Flexible", description: "Listen to customers, solve problems and help people get more value from Rylestate.", skills: ["Customer care", "Communication", "Problem solving"] },
];

const inputClass = "mt-2 h-12 w-full rounded-xl border border-border bg-background px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";
const departments = ["All departments", ...Array.from(new Set(positions.map((position) => position.department)))];

function CareersPage() {
  const [department, setDepartment] = useState("All departments");
  const [selectedPosition, setSelectedPosition] = useState("General Application");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const filteredPositions = useMemo(() => department === "All departments" ? positions : positions.filter((position) => position.department === department), [department]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elements = document.querySelectorAll<HTMLElement>(".career-reveal");
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function openApplication(position: string) {
    setSelectedPosition(position);
    setMessage(null);
    document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const formElement = event.currentTarget;
    setSubmitting(true);
    setMessage(null);
    const formData = new FormData(formElement);
    formData.set("position", selectedPosition);
    try {
      const response = await fetch("/api/careers/applications", { method: "POST", body: formData });
      const result = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !result.ok) throw new Error(result.message || "We could not send your application.");
      formElement.reset();
      setSelectedPosition("General Application");
      setMessage({ type: "success", text: "Thank you for your interest. Your application was securely received and we’ll be in touch if a suitable opportunity becomes available." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "We could not send your application. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(careerLd) }} />
    <section className="relative isolate flex min-h-[590px] items-center overflow-hidden bg-slate-950 sm:min-h-[660px]">
      <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=2200&q=88" alt="A team collaborating around a table in a bright modern workplace" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/20" />
      <div className="container-page py-24 sm:py-32"><div className="max-w-3xl text-white motion-safe:animate-[fade-up_.8s_ease-out_both]">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-100 backdrop-blur"><Sparkles className="h-4 w-4 text-amber-300"/> Careers at Rylestate</span>
        <h1 className="mt-7 text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">Build the Future of Renting <span className="text-cyan-200">with Rylestate.</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100 sm:text-xl">We're transforming how people rent, pay, and experience real estate. Join us and help build smarter experiences for tenants, landlords, and communities.</p>
        <a href="#open-positions" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50">Explore Open Positions <ArrowDown className="h-4 w-4"/></a>
        <p className="mt-4 text-xs text-white/75">Roles shown below are upcoming opportunities, not confirmed vacancies.</p>
      </div></div>
    </section>

    <section className="bg-surface py-16 md:py-24" aria-labelledby="values-title"><div className="container-page">
      <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary-light">The Rylestate experience</p><h2 id="values-title" className="mt-3 text-3xl font-extrabold text-foreground sm:text-5xl">Why Work With Us?</h2><p className="mt-4 text-base leading-7 text-muted-foreground">Bring your ideas, grow your craft, and help make renting work better for everyone.</p></div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{values.map(({ icon: Icon, title: valueTitle, text }, index) => <li key={valueTitle} className="career-reveal rounded-2xl border border-border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl" style={{ transitionDelay: `${index * 60}ms` }}><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary-light"><Icon className="h-6 w-6"/></span><h3 className="mt-5 font-bold text-card-foreground">{valueTitle}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></li>)}</ul>
    </div></section>

    <section id="open-positions" className="scroll-mt-24 bg-background py-16 md:py-24" aria-labelledby="positions-title"><div className="container-page">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary-light">Find your next challenge</p><h2 id="positions-title" className="mt-3 text-3xl font-extrabold text-foreground sm:text-5xl">Open Positions</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">We’re planning for these roles as Rylestate grows. They are upcoming opportunities rather than approved, active vacancies. Share your interest and we’ll reach out when a suitable role opens.</p></div>
        <label className="relative block w-full shrink-0 md:w-64"><span className="mb-2 block text-sm font-semibold text-foreground">Filter by department</span><select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-border bg-card px-4 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">{departments.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 h-4 w-4 text-muted-foreground"/></label>
      </div>
      <div className="mt-9 grid gap-4 lg:grid-cols-2">{filteredPositions.map((job) => <article key={job.title} className="career-reveal group rounded-2xl border border-border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-500"><BriefcaseBusiness className="h-3.5 w-3.5"/> Upcoming opportunity</span><h3 className="mt-3 text-xl font-bold text-card-foreground">{job.title}</h3><p className="mt-1 text-sm font-medium text-primary-light">{job.department}</p></div><span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">{job.type}</span></div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{job.description}</p><p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5"/>{job.location}</p>
        <div className="mt-4"><p className="text-xs font-bold uppercase tracking-wider text-subtle">Useful skills</p><ul className="mt-2 flex flex-wrap gap-2">{job.skills.map((skill) => <li key={skill} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">{skill}</li>)}</ul></div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><p className="text-xs text-muted-foreground">Interest form for future consideration</p><Button size="sm" variant="outline" onClick={() => openApplication(job.title)}>Apply Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></Button></div>
      </article>)}</div>
    </div></section>

    <section className="bg-surface py-16 md:py-24" aria-labelledby="process-title"><div className="container-page"><div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary-light">A thoughtful process</p><h2 id="process-title" className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">What happens next?</h2><p className="mt-4 leading-7 text-muted-foreground">Share a little about yourself. We’ll keep your details private and contact you if a relevant opportunity becomes available.</p></div><ol className="mx-auto mt-9 grid max-w-4xl gap-4 sm:grid-cols-3">{[{ title: "Send your profile", text: "Tell us about your experience and what interests you." }, { title: "We’ll review it", text: "Our team will keep your application for future opportunities." }, { title: "Stay in touch", text: "If a suitable role opens, we’ll contact you about next steps." }].map((step, index) => <li key={step.title} className="rounded-2xl border border-border bg-card p-5"><span className="text-xs font-bold tracking-widest text-primary-light">STEP 0{index + 1}</span><h3 className="mt-3 font-bold text-card-foreground">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p></li>)}</ol></div></section>

    <section className="bg-background px-0 py-16 md:py-24" aria-labelledby="general-title"><div className="container-page"><div className="relative isolate overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-blue-950 via-slate-950 to-teal-950 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14"><div className="absolute -right-10 -top-20 -z-10 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"/><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-200">Your next chapter could start here</p><div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><h2 id="general-title" className="text-3xl font-extrabold sm:text-4xl">Don't See Your Perfect Role?</h2><p className="mt-4 text-base leading-7 text-blue-100">Great people don't always fit into predefined positions. Share your profile with us, and we'll reach out when a suitable opportunity arises.</p></div><Button size="lg" className="shrink-0 bg-white text-blue-950 hover:bg-cyan-50" onClick={() => openApplication("General Application")}>Send Your Resume <Send className="h-4 w-4"/></Button></div></div></div></section>

    <section id="application-form" className="scroll-mt-24 bg-surface py-16 md:py-24" aria-labelledby="application-title"><div className="container-page"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-primary-light">Tell us about yourself</p><h2 id="application-title" className="mt-3 text-3xl font-extrabold text-foreground">Share Your Profile</h2><p className="mt-3 leading-7 text-muted-foreground">These roles are upcoming opportunities, not confirmed vacancies. Your application lets us know what you’re interested in.</p>
      <form onSubmit={submitApplication} className="mt-7 space-y-5 rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-8" encType="multipart/form-data">
        <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><label htmlFor="website">Leave this field blank</label><input id="website" name="website" type="text" tabIndex={-1} autoComplete="off"/></div>
        <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-foreground">Full name<input className={inputClass} name="fullName" autoComplete="name" required minLength={2} maxLength={120} placeholder="Your full name"/></label><label className="text-sm font-semibold text-foreground">Email address<input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com"/></label><label className="text-sm font-semibold text-foreground">Phone number<input className={inputClass} name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={40} pattern="[+0-9(). -]{7,40}" placeholder="+1 (555) 123-4567"/></label><label className="text-sm font-semibold text-foreground">Position applying for<select className={inputClass} value={selectedPosition} onChange={(event) => setSelectedPosition(event.target.value)}>{positions.map((job) => <option key={job.title}>{job.title}</option>)}<option>General Application</option></select></label><label className="text-sm font-semibold text-foreground sm:col-span-2">LinkedIn profile <span className="font-normal text-muted-foreground">(optional)</span><input className={inputClass} name="linkedin" type="url" placeholder="https://www.linkedin.com/in/your-profile"/></label><label className="text-sm font-semibold text-foreground sm:col-span-2">Resume <span className="font-normal text-muted-foreground">(PDF, up to 5 MB)</span><input className={`${inputClass} h-auto py-3 file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-light`} name="resume" type="file" accept="application/pdf,.pdf" required/></label></div>
        <label className="block text-sm font-semibold text-foreground">Short introduction<textarea name="introduction" required minLength={20} maxLength={2000} rows={5} placeholder="Tell us a little about yourself and the work you’re excited to do." className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"/><span className="mt-1 block text-xs font-normal text-muted-foreground">20–2,000 characters</span></label>
        {message && <p role={message.type === "error" ? "alert" : "status"} className={`rounded-xl p-4 text-sm ${message.type === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>{message.text}</p>}
        <div className="flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center"><p className="max-w-xl text-xs leading-5 text-muted-foreground">Your application and resume are stored privately and can only be reviewed by authorized Rylestate administrators.</p><Button type="submit" size="lg" disabled={submitting}>{submitting ? "Sending…" : "Send Application"} {submitting ? null : <ArrowRight className="h-4 w-4"/>}</Button></div>
      </form>
    </div></div></section>
  </main>;
}
