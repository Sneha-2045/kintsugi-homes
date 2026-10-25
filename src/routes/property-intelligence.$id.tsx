import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

type DataRecord = Record<string, unknown>;
type DetailResult = { property: DataRecord | null; valuation: DataRecord; rent: DataRecord };
type Search = { address?: string | undefined; propertyType?: string | undefined; bedrooms?: string | undefined; bathrooms?: string | undefined; squareFootage?: string | undefined; listingType?: string | undefined; sourceUrl?: string | undefined };
const initialAssumptions = { purchasePrice: "", downPayment: "20", interestRate: "7", loanTerm: "30", taxes: "", insurance: "", maintenance: "", vacancy: "5", management: "8" };

export const Route = createFileRoute("/property-intelligence/$id")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    address: typeof search["address"] === "string" ? search["address"].slice(0, 250) : undefined,
    propertyType: typeof search["propertyType"] === "string" ? search["propertyType"].slice(0, 40) : undefined,
    bedrooms: typeof search["bedrooms"] === "string" ? search["bedrooms"].slice(0, 10) : undefined,
    bathrooms: typeof search["bathrooms"] === "string" ? search["bathrooms"].slice(0, 10) : undefined,
    squareFootage: typeof search["squareFootage"] === "string" ? search["squareFootage"].slice(0, 12) : undefined,
    listingType: search["listingType"] === "rental" ? "rental" : "sale",
    sourceUrl: typeof search["sourceUrl"] === "string" ? search["sourceUrl"].slice(0, 2000) : undefined,
  }),
  head: () => ({ meta: [{ title: "Property Investment Analysis | Rylestate" }, { name: "description", content: "Review RentCast property details, valuation, comparable listings and investment estimates." }] }),
  component: PropertyIntelligenceDetailPage,
});

function record(value: unknown): DataRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as DataRecord : {};
}
function finite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
function currency(value: number | undefined) {
  return value == null ? "Not available" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function PropertyIntelligenceDetailPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const [data, setData] = useState<DetailResult | null>(null);
  const [error, setError] = useState("");
  const [assumptions, setAssumptions] = useState(initialAssumptions);
  useEffect(() => {
    const controller = new AbortController();
    if (!search.address) {
      setError("Property address details were not included. Return to search and open the property again.");
      return () => controller.abort();
    }
    const params = new URLSearchParams({ address: search.address });
    for (const key of ["propertyType", "bedrooms", "bathrooms", "squareFootage"] as const) {
      if (search[key]) params.set(key, search[key]!);
    }
    fetch(`/api/property-intelligence/details?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) {
          const errorData = record(record(body)["error"]);
          throw new Error(text(errorData["message"]) ?? "Property details are unavailable.");
        }
        return body as DetailResult;
      })
      .then(setData)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Property details are unavailable.");
      });
    return () => controller.abort();
  }, [search.address, search.propertyType, search.bedrooms, search.bathrooms, search.squareFootage]);

  const property = record(data?.property);
  const valuation = record(data?.valuation);
  const rent = record(data?.rent);
  const subject = record(valuation["subjectProperty"] ?? rent["subjectProperty"]);
  const address = text(property["formattedAddress"]) ?? text(subject["formattedAddress"]) ?? search.address ?? "Property details";
  const valueEstimate = finite(valuation["price"]);
  const rentEstimate = finite(rent["rent"]);
  const coordinates = [finite(property["latitude"]) ?? finite(subject["latitude"]), finite(property["longitude"]) ?? finite(subject["longitude"])];
  const sourceUrl = (() => {
    try { const url = new URL(search.sourceUrl ?? ""); return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined; }
    catch { return undefined; }
  })();
  const purchasePrice = Number(assumptions.purchasePrice) || 0;
  const monthlyRent = rentEstimate ?? 0;
  const downPayment = Math.min(100, Math.max(0, Number(assumptions.downPayment) || 0));
  const loanAmount = purchasePrice * (1 - downPayment / 100);
  const monthlyRate = (Number(assumptions.interestRate) || 0) / 1200;
  const months = Math.max(1, (Number(assumptions.loanTerm) || 30) * 12);
  const mortgage = loanAmount > 0 ? monthlyRate === 0 ? loanAmount / months : loanAmount * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1) : 0;
  const operatingExpenses = (Number(assumptions.taxes) || 0) / 12 + (Number(assumptions.insurance) || 0) / 12 + (Number(assumptions.maintenance) || 0) + monthlyRent * (Math.min(100, Number(assumptions.vacancy) || 0) / 100) + monthlyRent * (Math.min(100, Number(assumptions.management) || 0) / 100);
  const annualGross = monthlyRent * 12;
  const annualNOI = (monthlyRent - monthlyRent * (Math.min(100, Number(assumptions.vacancy) || 0) / 100) - (Number(assumptions.taxes) || 0) / 12 - (Number(assumptions.insurance) || 0) / 12 - (Number(assumptions.maintenance) || 0) - monthlyRent * (Math.min(100, Number(assumptions.management) || 0) / 100)) * 12;
  const cashFlow = monthlyRent - operatingExpenses - mortgage;
  const grossYield = purchasePrice > 0 ? annualGross / purchasePrice * 100 : undefined;
  const compsValue = Array.isArray(valuation["comparables"]) ? valuation["comparables"] : [];
  const compsRent = Array.isArray(rent["comparables"]) ? rent["comparables"] : [];
  const taxEntries = Object.values(record(property["propertyTaxes"])).map((entry) => record(entry)).filter((entry) => finite(entry["total"]) != null).sort((a, b) => Number(b["year"] ?? 0) - Number(a["year"] ?? 0));

  return (
    <PageShell title="Property intelligence" description="RentCast property details and investment estimates.">
      <Link to="/property-intelligence" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-light hover:underline"><ArrowLeft className="h-4 w-4" />Back to Property Intelligence</Link>
      <header className="rounded-2xl border border-border bg-card p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-light">RentCast property analysis</p><h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{address}</h1><p className="mt-2 text-sm text-muted-foreground">Data availability varies by property and market. Listing price, AVM estimates and user assumptions are shown separately.</p></header>
      {error ? <div role="alert" className="mt-6 rounded-xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">{error}</div> : !data ? <p className="mt-6 rounded-xl border border-border bg-card p-6 text-muted-foreground">Loading property record, valuation and rent estimates…</p> : <>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Estimated market value" value={currency(valueEstimate)} note="RentCast AVM estimate" />
          <Metric label="Estimated value range" value={finite(valuation["priceRangeLow"]) == null || finite(valuation["priceRangeHigh"]) == null ? "Not available" : `${currency(finite(valuation["priceRangeLow"]))} – ${currency(finite(valuation["priceRangeHigh"]))}`} note="RentCast estimate range" />
          <Metric label="Estimated monthly rent" value={currency(rentEstimate)} note="Long-term rental estimate" />
          <Metric label="Listing price / rent" value={currency(finite(property["price"]))} note={search.listingType === "rental" ? "RentCast rental listing" : "RentCast sale listing"} />
        </div>
        {text(record(data.property)["unavailable"]) || text(valuation["unavailable"]) || text(rent["unavailable"]) ? <p role="status" className="mt-4 rounded-xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-100">{[text(record(data.property)["unavailable"]), text(valuation["unavailable"]), text(rent["unavailable"])].filter(Boolean).join(" ")}</p> : null}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h2 className="text-xl font-bold">Property facts</h2><dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{[["Property type", text(property["propertyType"]) ?? text(subject["propertyType"]) ?? search.propertyType], ["Bedrooms", finite(property["bedrooms"]) ?? finite(subject["bedrooms"])], ["Bathrooms", finite(property["bathrooms"]) ?? finite(subject["bathrooms"])], ["Living area", finite(property["squareFootage"]) ?? finite(subject["squareFootage"])], ["Lot size", finite(property["lotSize"]) ?? finite(subject["lotSize"])], ["Year built", finite(property["yearBuilt"]) ?? finite(subject["yearBuilt"])]] .map(([label, value]) => <Fact key={String(label)} label={String(label)} value={typeof value === "number" ? value.toLocaleString() : typeof value === "string" ? value : undefined} />)}</dl>
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><Fact label="Last recorded sale" value={text(property["lastSaleDate"]) ? `${new Date(String(property["lastSaleDate"])).toLocaleDateString()} · ${currency(finite(property["lastSalePrice"]))}` : undefined} /><Fact label="Latest property tax" value={taxEntries[0] ? `${String(taxEntries[0]["year"] ?? "")} · ${currency(finite(taxEntries[0]["total"]))}/year` : undefined} /></div>
            <div className="mt-5 flex flex-wrap gap-3">{coordinates[0] != null && coordinates[1] != null ? <a href={`https://www.openstreetmap.org/?mlat=${coordinates[0]}&mlon=${coordinates[1]}#map=16/${coordinates[0]}/${coordinates[1]}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-elevated"><MapPin className="h-4 w-4" />View map</a> : null}{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-elevated">Original listing<ExternalLink className="h-4 w-4" /></a> : null}</div>
          </section>
          <InvestmentCalculator assumptions={assumptions} setAssumptions={setAssumptions} valueEstimate={valueEstimate} monthlyRent={rentEstimate} purchasePrice={purchasePrice} annualGross={annualGross} annualNOI={annualNOI} grossYield={grossYield} cashFlow={cashFlow} />
        </div>
        <div className="mt-7 grid gap-6 lg:grid-cols-2"><ComparableSection title="Comparable sale properties" items={compsValue} /><ComparableSection title="Comparable rental properties" items={compsRent} /></div>
        <p className="mt-7 rounded-xl border border-border bg-card p-4 text-xs leading-5 text-muted-foreground">Estimates are informational and are not appraisals, lending decisions, confirmed sale prices, or guaranteed rental income. Verify facts and current availability independently.</p>
      </>}
    </PageShell>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-xl font-bold text-foreground">{value}</p><p className="mt-1 text-xs text-subtle">{note}</p></div>;
}
function Fact({ label, value }: { label: string; value?: string | undefined }) {
  return <div className="rounded-lg bg-elevated p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold text-foreground">{value || "Not available"}</dd></div>;
}

type Assumptions = typeof initialAssumptions;
function InvestmentCalculator({ assumptions, setAssumptions, valueEstimate, monthlyRent, purchasePrice, annualGross, annualNOI, grossYield, cashFlow }: {
  assumptions: Assumptions;
  setAssumptions: (value: Assumptions | ((current: Assumptions) => Assumptions)) => void;
  valueEstimate: number | undefined;
  monthlyRent: number | undefined;
  purchasePrice: number;
  annualGross: number;
  annualNOI: number;
  grossYield: number | undefined;
  cashFlow: number;
}) {
  const fields: Array<[keyof Assumptions, string, string]> = [["purchasePrice", "Purchase price", "USD"], ["downPayment", "Down payment", "%"], ["interestRate", "Interest rate", "%"], ["loanTerm", "Loan term", "years"], ["taxes", "Property taxes", "USD/year"], ["insurance", "Insurance", "USD/year"], ["maintenance", "Maintenance", "USD/month"], ["vacancy", "Vacancy allowance", "%"], ["management", "Management fee", "% of rent"]];
  const value = (key: keyof Assumptions, raw: string) => setAssumptions((current) => ({ ...current, [key]: raw }));
  const metrics: Array<[string, string]> = [["Estimated property value", currency(valueEstimate)], ["Estimated monthly rent", currency(monthlyRent)], ["Annual gross rental income", currency(annualGross)], ["Estimated annual operating expenses", purchasePrice ? currency(annualGross - annualNOI) : "Enter a purchase price and assumptions"], ["Estimated annual net operating income", currency(purchasePrice ? annualNOI : undefined)], ["Gross rental yield", grossYield == null ? "Enter a purchase price" : `${grossYield.toFixed(2)}%`], ["Estimated monthly cash flow", purchasePrice ? currency(cashFlow) : "Enter a purchase price"]];
  return <section className="rounded-2xl border border-blue-300/20 bg-blue-500/5 p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.17em] text-primary-light">Investment calculator</p><h2 className="mt-1 text-xl font-bold">Your assumptions</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">RentCast supplies the value and rent estimates above. These inputs are your assumptions; all outputs are estimates.</p><div className="mt-4 grid grid-cols-2 gap-3">{fields.map(([key, label, suffix]) => <label key={key} className="text-xs text-muted-foreground">{label}<div className="mt-1 flex h-10 items-center rounded-lg border border-border bg-background pr-2"><input type="number" min="0" step="any" value={assumptions[key]} onChange={(e) => value(key, e.target.value)} className="min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none" /><span className="text-[10px]">{suffix}</span></div></label>)}</div><div className="mt-5 space-y-2 border-t border-border pt-4">{metrics.map(([label, metric]) => <div key={label} className="flex items-start justify-between gap-3 text-sm"><span className="text-muted-foreground">{label}</span><strong className="text-right text-foreground">{metric}</strong></div>)}</div></section>;
}

function ComparableSection({ title, items }: { title: string; items: unknown[] }) {
  return <section className="rounded-2xl border border-border bg-card p-5"><h2 className="text-lg font-bold">{title}</h2>{items.length ? <ul className="mt-4 divide-y divide-border">{items.slice(0, 5).map((item, index) => { const comp = record(item); return <li key={String(comp["id"] ?? index)} className="flex items-start justify-between gap-3 py-3 first:pt-0"><div><p className="font-semibold">{text(comp["formattedAddress"]) ?? text(comp["addressLine1"]) ?? "Address unavailable"}</p><p className="mt-1 text-xs text-muted-foreground">{[text(comp["city"]), text(comp["state"]), text(comp["propertyType"])].filter(Boolean).join(" · ") || "Property details unavailable"}</p><p className="mt-1 text-xs text-muted-foreground">{[finite(comp["bedrooms"]) != null ? `${finite(comp["bedrooms"])} bd` : undefined, finite(comp["bathrooms"]) != null ? `${finite(comp["bathrooms"])} ba` : undefined, finite(comp["squareFootage"]) != null ? `${finite(comp["squareFootage"])!.toLocaleString()} sq ft` : undefined].filter(Boolean).join(" · ") || ""}</p></div><strong className="shrink-0">{currency(finite(comp["price"]))}</strong></li>; })}</ul> : <p className="mt-3 text-sm text-muted-foreground">Comparable properties are not available for this address.</p>}</section>;
}
