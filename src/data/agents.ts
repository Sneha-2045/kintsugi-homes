export type Agent = {
  name: string;
  brokerage: string;
  rating?: string;
  reviews?: string;
  priceRange?: string;
  sales12?: string;
  texasCitySales?: string;
  profile: string;
  image?: string;
  team?: boolean;
};

// Directory cards currently visible on Zillow's Texas City agent page. Zillow's
// total changes frequently; profile links remain the source for current details.
export const agents: Agent[] = [
  { name: "Monica Foster", brokerage: "Monica Foster Team · eXp Realty", rating: "5.0", reviews: "1,066", priceRange: "$17K–$2.2M", sales12: "420", texasCitySales: "194", profile: "https://www.zillow.com/profile/RealtyByMonica", image: "https://photos.zillowstatic.com/fp/4fdf0c76ccf73df6d908da804305bb5c-h_l.jpg", team: true },
  { name: "Deborah Bly", brokerage: "eXp Realty · The Bly Team", rating: "5.0", reviews: "597", priceRange: "$21K–$4.5M", sales12: "252", texasCitySales: "68", profile: "https://www.zillow.com/profile/deborahbly", image: "https://photos.zillowstatic.com/fp/0487dd6e0c405be09998a3eb6b7f1fc0-h_l.jpg", team: true },
  { name: "Rosalie Stevenson", brokerage: "Rose Above Realty", rating: "5.0", reviews: "95", priceRange: "$12K–$1.2M", sales12: "4", texasCitySales: "203", profile: "https://www.zillow.com/professionals/real-estate-agent-reviews/texas-city-tx/" , team: true },
  { name: "Jim Atkinson", brokerage: "Hidden Paradise Realty Team · UTR Texas Realtors", rating: "5.0", reviews: "115", priceRange: "$49K–$933K", sales12: "43", texasCitySales: "57", profile: "https://www.zillow.com/profile/jimatkinson5", image: "https://photos.zillowstatic.com/fp/e631b8e4d532d09f6c9204a5264cc6f3-h_l.jpg", team: true },
  { name: "Melissa Castro", brokerage: "Pinnacle Realty Advisors", rating: "5.0", reviews: "35", priceRange: "$12K–$420K", texasCitySales: "21", profile: "https://www.zillow.com/profile/melissacastrorealtor" },
  { name: "Jimmy Simien", brokerage: "Simien Properties", rating: "5.0", reviews: "397", priceRange: "$30K–$2M", sales12: "216", texasCitySales: "57", profile: "https://www.zillow.com/profile/The%20Simien%20Team", image: "https://photos.zillowstatic.com/fp/f80299033355417da3ba7a0b5099fbbf-h_l.jpg", team: true },
  { name: "Christy Buck", brokerage: "Team Christy Buck · Infinity Real Estate Group", rating: "5.0", reviews: "811", priceRange: "$18K–$2M", sales12: "124", texasCitySales: "34", profile: "https://www.zillow.com/profile/ChristyBuck", image: "https://photos.zillowstatic.com/fp/9f14b6cedce7ec9ead6f1ceaf82caf9d-h_l.jpg", team: true },
  { name: "Kimberly Harding", brokerage: "Call It Closed International Realty", rating: "5.0", reviews: "164", priceRange: "$73K–$1.7M", sales12: "48", texasCitySales: "57", profile: "https://www.zillow.com/profile/Kimberly%20Harding", image: "https://photos.zillowstatic.com/fp/1a67c29065aca90b13b0cff63a537034-h_l.jpg" },
  { name: "Lisa Boland", brokerage: "Texas Home Shop Realty", rating: "5.0", reviews: "84", priceRange: "$110K–$685K", sales12: "2", texasCitySales: "30", profile: "https://www.zillow.com/profile/Lisa%20Boland", image: "https://photos.zillowstatic.com/fp/e4aee7fef6e5bd1f059635140b21714c-h_l.jpg", team: true },
  { name: "Tammi Freund", brokerage: "The Freund Group · FIV Realty", rating: "5.0", reviews: "163", priceRange: "$50K–$1.5M", sales12: "19", texasCitySales: "78", profile: "https://www.zillow.com/profile/FreundGroup", image: "https://photos.zillowstatic.com/fp/9b7be879521f4abae84af7b5301ff0ce-h_l.jpg", team: true },
  { name: "Cyndi De Palermo", brokerage: "Red Diamond Realty", rating: "5.0", reviews: "45", texasCitySales: "20", profile: "https://www.zillow.com/profile/Cyndi%20De%20Palermo" },
  { name: "Michele Crouch", brokerage: "Great Western Realty", rating: "5.0", reviews: "83", priceRange: "$69K–$24M", sales12: "14", texasCitySales: "6", profile: "https://www.zillow.com/professionals/real-estate-agent-reviews/texas-city-tx/" },
  { name: "Shannon Hall", brokerage: "Gulf Coast Realtors", rating: "5.0", reviews: "20", priceRange: "$415K–$460K", sales12: "2", texasCitySales: "8", profile: "https://www.zillow.com/profile/soldwithshannontexas", image: "https://photos.zillowstatic.com/fp/52c54f652c927299cd7ebb50b7d7c8fc-h_l.jpg" },
  { name: "Robbie Nelson", brokerage: "RE/MAX Crossroads Realty", rating: "5.0", reviews: "32", priceRange: "$26K–$669K", sales12: "1", texasCitySales: "35", profile: "https://www.zillow.com/profile/robbie%20nelson1", image: "https://photos.zillowstatic.com/fp/5a514385ad549e0cbad1c73c705e6dac-h_l.jpg" },
  { name: "Marcy AlBeirakdar", brokerage: "Houston Partners Realty, LLC", rating: "5.0", reviews: "10", texasCitySales: "18", profile: "https://www.zillow.com/profile/Marcy%20Albeirakdar", image: "https://photos.zillowstatic.com/fp/9569792d416f0f055971c2a8d23a01ce-h_l.jpg" },
];
