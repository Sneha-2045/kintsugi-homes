import { z } from "zod";
import {
  calculatePricePerSqft,
  calculateTargetOffer,
  calculateTotalInvestment,
  compareProperties,
  findSimilarProperties,
  getProperty,
  PropertySearchArgs,
  saveProperty,
  searchProperties,
  estimateInvestmentReturn,
  propertyDto,
} from "./property-service.ts";
import { connectMongo } from "./mongo.ts";
import { Favorite, KnowledgeBase, PropertyModel } from "./models.ts";

const number = z.number().finite();
const idSchema = z.string().trim().min(1).max(120);
const toolSchemas: Record<string, z.ZodTypeAny> = {
  search_properties: PropertySearchArgs.strict(),
  get_property_details: z.object({ propertyId: idSchema }).strict(),
  find_similar_properties: z
    .object({ propertyId: idSchema, limit: z.number().int().min(1).max(12).optional() })
    .strict(),
  search_by_location: z
    .object({
      city: z.string().trim().min(1).max(80).optional(),
      state: z.string().trim().min(2).max(30).optional(),
      limit: z.number().int().min(1).max(20).optional(),
    })
    .strict()
    .refine((value) => value.city || value.state, {
      message: "Provide a city or state to search by location.",
    }),
  search_by_budget: z
    .object({
      maxPrice: number.min(0).max(100_000_000),
      state: z.string().trim().min(2).max(30).optional(),
      city: z.string().trim().min(1).max(80).optional(),
      bedrooms: z.number().int().min(0).max(20).optional(),
      limit: z.number().int().min(1).max(20).optional(),
    })
    .strict(),
  find_upcoming_auctions: z
    .object({
      state: z.string().trim().min(2).max(30).optional(),
      city: z.string().trim().min(1).max(80).optional(),
      limit: z.number().int().min(1).max(20).optional(),
    })
    .strict(),
  compare_properties: z.object({ propertyIds: z.array(idSchema).min(2).max(5) }).strict(),
  calculate_target_offer: z
    .object({
      askingPrice: number.min(0).max(100_000_000),
      discountPercent: number.min(0).max(100),
    })
    .strict(),
  calculate_price_per_sqft: z
    .object({ price: number.min(0).max(100_000_000), areaSqft: number.min(1).max(2_000_000) })
    .strict(),
  calculate_total_investment: z
    .object({
      purchasePrice: number.min(0).max(100_000_000),
      repairCosts: number.min(0).max(100_000_000),
      closingPercent: number.min(0).max(30),
    })
    .strict(),
  estimate_investment_return: z
    .object({
      totalInvestment: number.min(1).max(100_000_000),
      annualNetIncome: number.min(0).max(100_000_000),
    })
    .strict(),
  find_properties_in_zipcode: z
    .object({
      zipCode: z.string().regex(/^\d{5}$/),
      limit: z.number().int().min(1).max(20).optional(),
    })
    .strict(),
  find_nearby_properties: z
    .object({
      propertyId: idSchema,
      radiusMiles: number.min(1).max(100).optional(),
      limit: z.number().int().min(1).max(20).optional(),
    })
    .strict(),
  get_location_information: z
    .object({ city: z.string().trim().min(1).max(80), state: z.string().trim().min(2).max(30) })
    .strict(),
  save_property: z.object({ propertyId: idSchema }).strict(),
  get_saved_properties: z.object({}).strict(),
  get_conversation_context: z.object({}).strict(),
  search_foreclosure_guides: z.object({ query: z.string().trim().min(2).max(200) }).strict(),
};

const declarations = [
  [
    "search_properties",
    "Search the current MongoDB property inventory using validated filters.",
    {
      type: "OBJECT",
      properties: {
        q: { type: "STRING" },
        city: { type: "STRING" },
        state: { type: "STRING" },
        zipCode: { type: "STRING" },
        minPrice: { type: "NUMBER" },
        maxPrice: { type: "NUMBER" },
        bedrooms: { type: "INTEGER" },
        bathrooms: { type: "NUMBER" },
        minArea: { type: "NUMBER" },
        minLandArea: { type: "NUMBER" },
        propertyType: { type: "STRING" },
        foreclosureStatus: { type: "STRING" },
        auctionOnly: { type: "BOOLEAN" },
        limit: { type: "INTEGER" },
        offset: { type: "INTEGER" },
        sortBy: { type: "STRING", enum: ["price", "auctionDate", "bedrooms", "area", "updatedAt"] },
        sortOrder: { type: "STRING", enum: ["asc", "desc"] },
      },
    },
  ],
  [
    "get_property_details",
    "Retrieve authoritative current property details from MongoDB by ID.",
    { type: "OBJECT", properties: { propertyId: { type: "STRING" } }, required: ["propertyId"] },
  ],
  [
    "find_similar_properties",
    "Find comparable properties in the same city/state and price range.",
    {
      type: "OBJECT",
      properties: { propertyId: { type: "STRING" }, limit: { type: "INTEGER" } },
      required: ["propertyId"],
    },
  ],
  [
    "search_by_location",
    "Search properties by city and/or state. Include at least one of city or state.",
    {
      type: "OBJECT",
      properties: {
        city: { type: "STRING" },
        state: { type: "STRING" },
        limit: { type: "INTEGER" },
      },
    },
  ],
  [
    "search_by_budget",
    "Search properties under a budget, optionally limited by location and bedrooms.",
    {
      type: "OBJECT",
      properties: {
        maxPrice: { type: "NUMBER" },
        city: { type: "STRING" },
        state: { type: "STRING" },
        bedrooms: { type: "INTEGER" },
        limit: { type: "INTEGER" },
      },
      required: ["maxPrice"],
    },
  ],
  [
    "find_upcoming_auctions",
    "Search current properties with future auction dates.",
    {
      type: "OBJECT",
      properties: {
        city: { type: "STRING" },
        state: { type: "STRING" },
        limit: { type: "INTEGER" },
      },
    },
  ],
  [
    "compare_properties",
    "Compare two to five real properties by their current stored listing fields.",
    {
      type: "OBJECT",
      properties: { propertyIds: { type: "ARRAY", items: { type: "STRING" } } },
      required: ["propertyIds"],
    },
  ],
  [
    "calculate_target_offer",
    "Calculate a user-selected discount against the current asking price.",
    {
      type: "OBJECT",
      properties: { askingPrice: { type: "NUMBER" }, discountPercent: { type: "NUMBER" } },
      required: ["askingPrice", "discountPercent"],
    },
  ],
  [
    "calculate_price_per_sqft",
    "Calculate price per square foot from the supplied price and area.",
    {
      type: "OBJECT",
      properties: { price: { type: "NUMBER" }, areaSqft: { type: "NUMBER" } },
      required: ["price", "areaSqft"],
    },
  ],
  [
    "calculate_total_investment",
    "Calculate estimated purchase, user-provided repairs and user-provided closing percent.",
    {
      type: "OBJECT",
      properties: {
        purchasePrice: { type: "NUMBER" },
        repairCosts: { type: "NUMBER" },
        closingPercent: { type: "NUMBER" },
      },
      required: ["purchasePrice", "repairCosts", "closingPercent"],
    },
  ],
  [
    "estimate_investment_return",
    "Calculate an illustrative return from user-provided total investment and annual net income.",
    {
      type: "OBJECT",
      properties: { totalInvestment: { type: "NUMBER" }, annualNetIncome: { type: "NUMBER" } },
      required: ["totalInvestment", "annualNetIncome"],
    },
  ],
  [
    "find_properties_in_zipcode",
    "Find properties for an exact five-digit US ZIP code.",
    {
      type: "OBJECT",
      properties: { zipCode: { type: "STRING" }, limit: { type: "INTEGER" } },
      required: ["zipCode"],
    },
  ],
  [
    "find_nearby_properties",
    "Find properties near a property with stored coordinates.",
    {
      type: "OBJECT",
      properties: {
        propertyId: { type: "STRING" },
        radiusMiles: { type: "NUMBER" },
        limit: { type: "INTEGER" },
      },
      required: ["propertyId"],
    },
  ],
  [
    "get_location_information",
    "Summarize the current listing coverage for a city and state from stored property records.",
    {
      type: "OBJECT",
      properties: { city: { type: "STRING" }, state: { type: "STRING" } },
      required: ["city", "state"],
    },
  ],
  [
    "save_property",
    "Save a property for the signed-in user.",
    { type: "OBJECT", properties: { propertyId: { type: "STRING" } }, required: ["propertyId"] },
  ],
  [
    "get_saved_properties",
    "List saved properties for the signed-in user.",
    { type: "OBJECT", properties: {} },
  ],
  [
    "get_conversation_context",
    "Retrieve the current conversation property and search context.",
    { type: "OBJECT", properties: {} },
  ],
  [
    "search_foreclosure_guides",
    "Search Rylestate's MongoDB foreclosure education knowledge base.",
    { type: "OBJECT", properties: { query: { type: "STRING" } }, required: ["query"] },
  ],
].map(([name, description, parameters]) => ({ name, description, parameters }));

type User = { id: string; email: string; roles: string[] } | undefined;
type Context = {
  user: User;
  propertyId: string | undefined;
  priorMessages: Array<{ role: string; content: string }>;
};
type GeminiFunctionCall = { name?: string; id?: string; args?: unknown };
type GeminiPart = { text?: string; functionCall?: GeminiFunctionCall; functionResponse?: unknown };
type GeminiResponse = { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> };

async function runTool(name: string, rawArgs: unknown, context: Context): Promise<unknown> {
  const schema = toolSchemas[name];
  if (!schema) throw new Error("Unsupported assistant tool.");
  const args = schema.parse(rawArgs) as Record<string, unknown>;
  const text = (key: string) => args[key] as string;
  const number = (key: string) => args[key] as number;
  const optionalNumber = (key: string) => args[key] as number | undefined;
  const stringList = (key: string) => args[key] as string[];
  switch (name) {
    case "search_properties":
      return searchProperties(args);
    case "get_property_details":
      return (
        (await getProperty(text("propertyId"))) ?? { found: false, propertyId: text("propertyId") }
      );
    case "find_similar_properties":
      return findSimilarProperties(text("propertyId"), optionalNumber("limit"));
    case "search_by_location":
      return searchProperties({
        city: args["city"] as string | undefined,
        state: args["state"] as string | undefined,
        limit: optionalNumber("limit") ?? 8,
      });
    case "search_by_budget":
      return searchProperties(args);
    case "find_upcoming_auctions":
      return searchProperties({
        state: args["state"] as string | undefined,
        city: args["city"] as string | undefined,
        auctionOnly: true,
        sortBy: "auctionDate",
        limit: optionalNumber("limit") ?? 8,
      });
    case "compare_properties":
      return compareProperties(stringList("propertyIds"));
    case "calculate_target_offer":
      return calculateTargetOffer(number("askingPrice"), number("discountPercent"));
    case "calculate_price_per_sqft":
      return calculatePricePerSqft(number("price"), number("areaSqft"));
    case "calculate_total_investment":
      return calculateTotalInvestment(
        number("purchasePrice"),
        number("repairCosts"),
        number("closingPercent"),
      );
    case "estimate_investment_return":
      return estimateInvestmentReturn(number("totalInvestment"), number("annualNetIncome"));
    case "find_properties_in_zipcode":
      return searchProperties({ zipCode: text("zipCode"), limit: optionalNumber("limit") ?? 8 });
    case "find_nearby_properties": {
      const origin = await getProperty(text("propertyId"));
      if (origin?.latitude == null || origin.longitude == null)
        return { message: "The property has no stored coordinates.", properties: [] };
      await connectMongo();
      const meters = (optionalNumber("radiusMiles") ?? 25) * 1609.344;
      const nearby = await PropertyModel.find({
        geoPoint: {
          $near: {
            $geometry: { type: "Point", coordinates: [origin.longitude, origin.latitude] },
            $maxDistance: meters,
          },
        },
        status: { $in: ["published", "active"] },
      })
        .limit(optionalNumber("limit") ?? 8)
        .lean();
      return { properties: nearby.map((item) => propertyDto(item)) };
    }
    case "get_location_information": {
      const found = await searchProperties({ city: text("city"), state: text("state"), limit: 1 });
      return {
        city: text("city"),
        state: text("state"),
        currentListingsInDatabase: found.total,
        message:
          "This is Rylestate inventory coverage only; it does not describe schools, safety, local services or market conditions.",
      };
    }
    case "save_property": {
      if (!context.user) throw new Error("Sign in to save properties.");
      return saveProperty(context.user.id, text("propertyId"));
    }
    case "get_saved_properties": {
      if (!context.user) throw new Error("Sign in to retrieve saved properties.");
      const saved = await Favorite.find({ userId: context.user.id })
        .sort({ updatedAt: -1 })
        .limit(50)
        .select("propertyId")
        .lean();
      const properties = await PropertyModel.find({
        _id: { $in: saved.map((item) => item.propertyId) },
        status: { $in: ["published", "active"] },
      }).lean();
      return { properties: properties.map((item) => propertyDto(item)) };
    }
    case "get_conversation_context":
      return {
        currentProperty: context.propertyId ? await getProperty(context.propertyId) : null,
        recentMessages: context.priorMessages.slice(-8),
      };
    case "search_foreclosure_guides": {
      await connectMongo();
      return {
        guides: await KnowledgeBase.find({ active: true, $text: { $search: text("query") } })
          .select("title category content sourceUrl reviewedAt")
          .limit(5)
          .lean(),
      };
    }
  }
  return { error: "This action is not supported." };
}

const SYSTEM_INSTRUCTION = `You are Rylestate's helpful US real estate discovery assistant. Use function tools for all current listing facts, searches, comparisons, and calculations. Never invent or extrapolate listing facts, auction dates, prices, images, or market data. When no record supports an answer, say the listing is not currently available in Rylestate's connected inventory. Make the number of matches and result limits clear. When results are returned, describe a few accurately and let the UI show listing cards. Ask a concise follow-up only when key search criteria are missing. Clearly label user-entered repair, closing, income, discount, and ROI assumptions as estimates. Never guarantee returns or acceptance of an offer. Foreclosure and auction laws vary by jurisdiction; give general educational information only and recommend title, lien, occupancy, condition, redemption-period, deposit, and sale-terms checks with qualified local professionals. Do not give legal or financial guarantees. If asked about schools, safety, local services, neighborhood conditions, or rent/valuation data unavailable in the listing record or Rylestate knowledge base, say it is not verified here.`;

function apiConfig() {
  const key = process.env["GEMINI_API_KEY"]?.trim();
  if (!key)
    throw Object.assign(
      new Error(
        "The AI assistant is not configured. Add GEMINI_API_KEY to the server environment.",
      ),
      { status: 503 },
    );
  const model = process.env["GEMINI_MODEL"]?.trim() || "gemini-2.5-flash";
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(model))
    throw Object.assign(new Error("Invalid Gemini model configuration."), { status: 500 });
  return { key, model };
}

export async function answerWithGemini(input: {
  message: string;
  history: Array<{ role: string; content: string }>;
  context: Context;
}) {
  const { key, model } = apiConfig();
  const collectedProperties: ReturnType<typeof propertyDto>[] = [];
  const toolResults: Array<{ name: string; result: unknown }> = [];
  const contents: unknown[] = input.history.slice(-16).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content.slice(0, 6000) }],
  }));
  const currentProperty = input.context.propertyId
    ? await getProperty(input.context.propertyId)
    : null;
  const contextualMessage = currentProperty
    ? input.message +
      "\n\nVerified current listing context from Rylestate MongoDB (only use these available facts): " +
      JSON.stringify(currentProperty)
    : input.message;
  contents.push({ role: "user", parts: [{ text: contextualMessage }] });
  const tools: string[] = [];
  for (let turn = 0; turn < 5; turn += 1) {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
          tools: [{ functionDeclarations: declarations }],
          toolConfig: { functionCallingConfig: { mode: "AUTO" } },
          generationConfig: { temperature: 0.2, maxOutputTokens: 900 },
        }),
        signal: AbortSignal.timeout(25000),
      },
    );
    if (!response.ok) {
      console.error("[Gemini] request failed", { status: response.status });
      throw Object.assign(
        new Error(
          response.status === 429
            ? "The assistant is busy. Please try again shortly."
            : "The assistant could not complete this request right now.",
        ),
        { status: response.status === 429 ? 429 : 503 },
      );
    }
    const data = (await response.json()) as GeminiResponse;
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts))
      throw Object.assign(new Error("The assistant returned an empty response."), { status: 502 });
    const calls = parts.filter((part): part is GeminiPart & { functionCall: GeminiFunctionCall } =>
      Boolean(part.functionCall),
    );
    if (!calls.length) {
      const content = parts
        .map((part) => (typeof part.text === "string" ? part.text : ""))
        .join("")
        .trim();
      if (!content)
        throw Object.assign(new Error("The assistant returned an empty response."), {
          status: 502,
        });
      return {
        content,
        properties: [
          ...new Map(collectedProperties.map((property) => [property.id, property])).values(),
        ],
        toolCalls: tools,
        toolResults,
      };
    }
    contents.push({ role: "model", parts });
    const functionResponses: GeminiPart[] = [];
    for (const part of calls) {
      const name = String(part.functionCall.name ?? "");
      let result: unknown;
      try {
        result = await runTool(name, part.functionCall.args ?? {}, input.context);
        tools.push(name);
        toolResults.push({ name, result });
        if (result && typeof result === "object" && "properties" in result) {
          const properties = (result as { properties?: unknown }).properties;
          if (Array.isArray(properties))
            collectedProperties.push(...(properties as ReturnType<typeof propertyDto>[]));
        } else if (Array.isArray(result) && name === "compare_properties")
          collectedProperties.push(...(result as ReturnType<typeof propertyDto>[]));
      } catch (error) {
        result = {
          error: error instanceof Error ? error.message : "Unable to run this property action.",
        };
      }
      functionResponses.push({
        functionResponse: {
          name,
          ...(part.functionCall.id ? { id: part.functionCall.id } : {}),
          response: { result },
        },
      });
    }
    contents.push({ role: "user", parts: functionResponses });
  }
  return {
    content:
      "I found some information, but could not complete the response in time. Please narrow the request and try again.",
    properties: collectedProperties,
    toolCalls: tools,
    toolResults,
  };
}
