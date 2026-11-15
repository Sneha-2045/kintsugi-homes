import { KnowledgeBase } from "./models.ts";

const guides = [
  {
    slug: "foreclosure-basics",
    title: "Foreclosure basics",
    category: "foreclosure",
    content:
      "A foreclosure is a legal process that may allow a lender or other secured creditor to recover debt using real property as collateral. The process, notices, timelines, redemption rights, and sale rules vary by state and case. Confirm the current status directly with the court, trustee, servicer, or official sale source. A Rylestate listing is a research starting point, not a legal status confirmation.",
  },
  {
    slug: "auction-due-diligence",
    title: "Foreclosure auction due diligence",
    category: "auction",
    content:
      "Before bidding, read the official sale terms and confirm the sale is still scheduled. Investigate title, liens and priority, occupancy, access, condition, taxes, utilities, deposits, payment deadlines, buyer premiums, and any inspection restrictions. A property may be sold as-is and interior access may be unavailable. Rules and buyer obligations vary; obtain title and legal advice for the property and jurisdiction.",
  },
  {
    slug: "title-search-and-liens",
    title: "Title searches and liens",
    category: "due-diligence",
    content:
      "A title search reviews public records to identify ownership, recorded interests, and possible encumbrances. The effect and priority of a lien depend on the documents, facts, and applicable law. Do not assume a foreclosure removes every lien or obligation. Ask a qualified title professional and local real-estate attorney to review the exact parcel and sale documents.",
  },
  {
    slug: "auction-deposits-and-payment",
    title: "Auction deposits and payment deadlines",
    category: "auction",
    content:
      "Auction terms may require a deposit, proof of funds, or payment soon after a winning bid. Amounts, acceptable payment methods, forfeiture conditions, and closing dates are set by the official sale terms and can differ by county, trustee, and auction platform. Verify current written terms directly before bidding; never rely on a general estimate.",
  },
  {
    slug: "property-condition-and-occupancy",
    title: "Property condition and occupancy checks",
    category: "due-diligence",
    content:
      "Foreclosure listings may provide limited condition information, and an interior inspection may not be possible before sale. Verify access rights, occupancy, local procedures, repair scope, and any steps required after purchase with qualified local professionals. Do not infer condition, vacancy, or possession status from photos or listing text alone.",
  },
  {
    slug: "foreclosure-costs",
    title: "Costs to plan for in a foreclosure purchase",
    category: "investment",
    content:
      "Potential costs can include the purchase price, required deposits, title and recording fees, taxes, insurance, utilities, repairs, secured obligations, occupancy-related expenses, financing, and holding costs. Which costs apply depends on the property and sale terms. Use written quotes and verified records. Rylestate calculations only reflect inputs provided by the user and do not establish actual costs or returns.",
  },
];

export async function seedKnowledgeBase() {
  await Promise.all(
    guides.map((guide) =>
      KnowledgeBase.updateOne(
        { slug: guide.slug },
        { $setOnInsert: { ...guide, active: true, reviewedAt: new Date() } },
        { upsert: true },
      ),
    ),
  );
}
