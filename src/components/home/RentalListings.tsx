import { ArrowUpRight, BedDouble, MapPin } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/common/Badge";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Button } from "@/components/common/Button";

const rentals = [
  { id: "CqtVZh", name: "Spectra Parks", address: "5301 Decker Ln", zip: "78724", rent: 1240, beds: "1–2", image: "https://photos.zillowstatic.com/fp/616d48b862b40e42732d2bdad39e5f74-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/spectra-parks/CqtVZh/" },
  { id: "CmWCqz", name: "Ascend at Pioneer Hill", address: "1701 Daleside Ln", zip: "78754", rent: 1265, beds: "1–3", image: "https://photos.zillowstatic.com/fp/db6144d404ee891c7457286dd62fb779-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/ascend-at-pioneer-hill/CmWCqz/" },
  { id: "ChcQLJ", name: "MAA Canyon Creek", address: "9501 N FM 620 Rd", zip: "78726", rent: 1031, beds: "1–3", image: "https://photos.zillowstatic.com/fp/c65ab3ce3283587ce15738f1e8ef34fa-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/maa-canyon-creek/ChcQLJ/" },
  { id: "CpXXHf", name: "Lirica", address: "5211 E 7th St", zip: "78702", rent: 2216, beds: "1–2", image: "https://photos.zillowstatic.com/fp/241363f30420116d73cfbe36d6f9cc38-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/lirica/CpXXHf/" },
  { id: "CmB93F", name: "Lenox Grand", address: "13505 Burnet Rd", zip: "78727", rent: 1396, beds: "1–3", image: "https://photos.zillowstatic.com/fp/c218d588c3343895b32aa6196c95192b-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/lenox-grand/CmB93F/" },
  { id: "5Xht7n", name: "The Morgan", address: "1801 W Wells Branch Pkwy", zip: "78728", rent: 770, beds: "1–2", image: "https://photos.zillowstatic.com/fp/afb1d2624c0b8011d1c649c45df81d94-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/bridge-at-sweetwater/5Xht7n/" },
  { id: "CkQ7wm", name: "The Goodwin Apartments", address: "3706 Goodwin Ave", zip: "78721", rent: 1997, beds: "Studio–2", image: "https://photos.zillowstatic.com/fp/062a8eea307b9c65e4c8d9bee14c889f-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/the-goodwin-apartments/CkQ7wm/" },
  { id: "5Xht9L", name: "Parmer Place", address: "12101 Dessau Rd", zip: "78754", rent: 1845, beds: "1–3", image: "https://photos.zillowstatic.com/fp/55d5fcd0ff75b84c86733ebd1ffedadc-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/parmer-place/5Xht9L/" },
  { id: "CjrVrz", name: "Veranda", address: "7205 E Ben White Blvd", zip: "78741", rent: 3233, beds: "1–3", image: "https://photos.zillowstatic.com/fp/918134c5b8fef419323f1afdd662c288-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/veranda/CjrVrz/" },
  { id: "CqW86G", name: "The Janis", address: "3500 E Parmer Ln", zip: "78754", rent: 1524, beds: "1–2", image: "https://photos.zillowstatic.com/fp/4aed558d4ed4e8cb6d460ccbaa558a36-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/the-janis/CqW86G/" },
  { id: "CthY48", name: "Prose Decker Lake", address: "8701 Decker Lake Rd", zip: "78724", rent: 1326, beds: "1–2", image: "https://photos.zillowstatic.com/fp/9db2c9ecba443fc1f42dcc97b9f81725-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/prose-decker-lake/CthY48/" },
  { id: "5XhsyQ", name: "MAA Wells Branch", address: "1630 Wells Branch Pkwy", zip: "78728", rent: 947, beds: "1–3", image: "https://photos.zillowstatic.com/fp/dc0e1f1a66e0fa6050534c5bda574b0e-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/maa-wells-branch/5XhsyQ/" },
  { id: "CrVH7y", name: "The Amber", address: "3901 E Parmer Ln", zip: "78754", rent: 1569, beds: "1–3", image: "https://photos.zillowstatic.com/fp/308aa34e713c366c8bf6cd600ccb2e0c-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/the-amber/CrVH7y/" },
  { id: "Ch8cCf", name: "Trailhead East", address: "5100 Bolm Rd", zip: "78721", rent: 1525, beds: "Studio–2", image: "https://photos.zillowstatic.com/fp/d33fe69107123250ad332f89c8af2470-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/trailhead-east/Ch8cCf/" },
  { id: "5Xhsy2", name: "MAA Balcones Woods", address: "11215 Research Blvd", zip: "78759", rent: 957, beds: "1–2", image: "https://photos.zillowstatic.com/fp/f3fb23811100bc1b53e72b1a39c7a800-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/maa-balcones-woods/5Xhsy2/" },
  { id: "CpRFKx", name: "Strata", address: "8340 Bluff Springs Rd", zip: "78744", rent: 1453, beds: "Studio–2", image: "https://photos.zillowstatic.com/fp/3775dfc69e4d05abb52661844d59164b-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/strata/CpRFKx/" },
  { id: "CmQqtq", name: "Gables at the Terrace", address: "2301 S Mopac Expy", zip: "78746", rent: 1318, beds: "1–2", image: "https://photos.zillowstatic.com/fp/6d9feb205e117b14e065a10dd4122bb6-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/gables-at-the-terrace/CmQqtq/" },
  { id: "CgqRpt", name: "Citizen House Blue Bluff", address: "10346 Blue Bluff Rd", zip: "78724", rent: 1279, beds: "1–2", image: "https://photos.zillowstatic.com/fp/845a39ab7fe8c3cd54111d8cd6cbc8ab-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/citizen-house-blue-bluff/CgqRpt/" },
  { id: "CtqCKn", name: "Bellrock La Frontera", address: "16304 FM 1325", zip: "78728", rent: 1250, beds: "1–2", image: "https://photos.zillowstatic.com/fp/181fdebf5bb8c87607fef124f12f0fab-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/bellrock-la-frontera/CtqCKn/" },
  { id: "5Xht9w", name: "Parkside Crossing", address: "3400 Shoreline Dr", zip: "78728", rent: 1027, beds: "1–3", image: "https://photos.zillowstatic.com/fp/3e1ca47290bd4e0a85b3da0211b984e2-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/parkside-crossing/5Xht9w/" },
  { id: "CkQ7qZ", name: "The Mia", address: "14305 Tandem Blvd", zip: "78728", rent: 1539, beds: "Studio–3", image: "https://photos.zillowstatic.com/fp/5a24e747bc3510b8024097bd88f3ebe0-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/the-mia/CkQ7qZ/" },
  { id: "9T5g4x", name: "Groves South Congress", address: "7400 S Congress Ave", zip: "78745", rent: 1384, beds: "Studio–3", image: "https://photos.zillowstatic.com/fp/dc4983df92aeda6c7da3521eef205540-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/groves-south-congress/9T5g4x/" },
  { id: "5Xht5h", name: "The Ridge Apartments", address: "6805 Wood Hollow Dr", zip: "78731", rent: 1110, beds: "1–2", image: "https://photos.zillowstatic.com/fp/673487c1f28e6d9e2daf4454bab9cdfb-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/the-ridge-apartments/5Xht5h/" },
  { id: "5Xht2x", name: "Cliffs at Barton Creek", address: "3050 Tamarron Blvd", zip: "78746", rent: 1547, beds: "1–2", image: "https://photos.zillowstatic.com/fp/d6b93ba556e1d2948372d334f875dc63-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/cliffs-at-barton-creek/5Xht2x/" },
  { id: "C8gzfc", name: "Alexan St. Elmo", address: "4700 Weidemar Ln", zip: "78745", rent: 1523, beds: "Studio–2", image: "https://photos.zillowstatic.com/fp/8fc8aea6ee671e7882fe5ff0e4a025f5-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/alexan-st.-elmo/C8gzfc/" },
  { id: "5XhsvH", name: "Trio", address: "2317 S Pleasant Valley Rd", zip: "78741", rent: 1059, beds: "1–2", image: "https://photos.zillowstatic.com/fp/5f93f7d41f03dc5fa0fb13acdde6ca6f-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/trio/5XhsvH/" },
  { id: "CgGpBy", name: "The Vaughan", address: "12601 Innovar Cir", zip: "78754", rent: 1547, beds: "1–3", image: "https://photos.zillowstatic.com/fp/66a07a554e987c954667bc6db19595c4-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/the-vaughan/CgGpBy/" },
  { id: "CsBcLY", name: "Citizen House East Lake", address: "12601 Citizen Way", zip: "78724", rent: 1290, beds: "1–2", image: "https://photos.zillowstatic.com/fp/33d34fa15b59edc57a6cf2c4c42eab72-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/citizen-house-east-lake/CsBcLY/" },
  { id: "CsLNK4", name: "City View at Mueller", address: "1106 Reinli St", zip: "78723", rent: 1034, beds: "Studio–2", image: "https://photos.zillowstatic.com/fp/28929573185aa2b3b4e0a10f510d6114-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/city-view-at-mueller/CsLNK4/" },
  { id: "Cgw53g", name: "Ryder Ridge", address: "9351 Decker Lake Rd", zip: "78724", rent: 1249, beds: "1–4", image: "https://photos.zillowstatic.com/fp/04d698e28dfc72977071b2a4ef9a0c11-p_e.jpg", url: "https://www.zillow.com/apartments/austin-tx/ryder-ridge/Cgw53g/" },
];

export function RentalListings() {
  const [visibleCount, setVisibleCount] = useState(10);
  return (
    <section className="bg-surface py-16 md:py-24" aria-labelledby="rental-listings-title">
      <div className="container-page">
        <SectionHeader
          eyebrow={<Badge variant="green" size="md">FOR RENT · AUSTIN, TX</Badge>}
          title="Austin Rentals"
          subtitle="Apartment communities with current starting rents. Check Zillow for live availability, floor plans, and lease details."
          className="mb-10"
        />
        <h2 id="rental-listings-title" className="sr-only">Austin rental listings</h2>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rentals.slice(0, visibleCount).map((rental) => (
            <li key={rental.id}>
              <article className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <a href={rental.url} target="_blank" rel="noreferrer" className="group block">
                  <div className="aspect-[4/3] overflow-hidden bg-elevated">
                    <img src={rental.image} alt={rental.name} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary-light">{rental.name}</h3>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" aria-hidden="true" />{rental.address}, Austin · {rental.zip}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <p className="text-xl font-bold text-foreground">${rental.rent.toLocaleString()}<span className="text-sm font-medium text-muted-foreground">+/mo</span></p>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><BedDouble className="h-4 w-4" aria-hidden="true" />{rental.beds} beds</span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Starting rent · View on Zillow</p>
                  </div>
                </a>
              </article>
            </li>
          ))}
        </ul>
        {visibleCount < rentals.length ? (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" size="lg" onClick={() => setVisibleCount((count) => count + 10)}>
              Load more rentals
            </Button>
          </div>
        ) : null}
        <p className="mt-4 text-sm text-muted-foreground">Listings retrieved from Zillow via Apify on Nov 25, 2026. Rents and availability may change.</p>
      </div>
    </section>
  );
}
