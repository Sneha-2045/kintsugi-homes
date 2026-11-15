import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { authenticate, type AuthenticatedRequest } from "./auth-router.ts";
import { connectMongo } from "./mongo.ts";
import { Favorite, PropertyModel } from "./models.ts";
import {
  calculatePricePerSqft,
  calculateTargetOffer,
  calculateTotalInvestment,
  compareProperties,
  findSimilarProperties,
  getProperty,
  propertyDto,
  PropertySearchArgs,
  searchProperties,
} from "./property-service.ts";
import { estimateInvestmentReturn } from "./property-service.ts";

const router = Router();

function parsedQuery(request: Request) {
  const p = request.query;
  const optionalNumber = (name: string) => (p[name] === undefined ? undefined : Number(p[name]));
  return PropertySearchArgs.parse({
    ...(typeof p["city"] === "string" ? { city: p["city"] } : {}),
    ...(typeof p["state"] === "string" ? { state: p["state"] } : {}),
    ...(typeof p["zipCode"] === "string" ? { zipCode: p["zipCode"] } : {}),
    ...(optionalNumber("minPrice") !== undefined ? { minPrice: optionalNumber("minPrice") } : {}),
    ...(optionalNumber("maxPrice") !== undefined ? { maxPrice: optionalNumber("maxPrice") } : {}),
    ...(optionalNumber("bedrooms") !== undefined ? { bedrooms: optionalNumber("bedrooms") } : {}),
    ...(optionalNumber("bathrooms") !== undefined
      ? { bathrooms: optionalNumber("bathrooms") }
      : {}),
    ...(optionalNumber("minArea") !== undefined ? { minArea: optionalNumber("minArea") } : {}),
    ...(optionalNumber("minLandArea") !== undefined
      ? { minLandArea: optionalNumber("minLandArea") }
      : {}),
    ...(typeof p["propertyType"] === "string" ? { propertyType: p["propertyType"] } : {}),
    ...(typeof p["foreclosureStatus"] === "string"
      ? { foreclosureStatus: p["foreclosureStatus"] }
      : {}),
    ...(typeof p["q"] === "string" ? { q: p["q"] } : {}),
    ...(p["auctionOnly"] === "true" ? { auctionOnly: true } : {}),
    ...(optionalNumber("limit") !== undefined ? { limit: optionalNumber("limit") } : {}),
    ...(optionalNumber("offset") !== undefined ? { offset: optionalNumber("offset") } : {}),
    ...(typeof p["sortBy"] === "string" ? { sortBy: p["sortBy"] } : {}),
    ...(typeof p["sortOrder"] === "string" ? { sortOrder: p["sortOrder"] } : {}),
  });
}

function route(handler: (request: Request, response: Response) => Promise<unknown>) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      return await handler(request, response);
    } catch (error) {
      return next(error);
    }
  };
}

function pathParam(request: Request, key: string) {
  const value = request.params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

router.get(
  "/search",
  route(async (request, response) => {
    const result = await searchProperties(parsedQuery(request));
    const offset = parsedQuery(request).offset ?? 0;
    return response.json({
      ...result,
      offset,
      nextOffset: result.hasMore ? offset + (parsedQuery(request).limit ?? 8) : null,
    });
  }),
);

router.get(
  "/upcoming-auctions",
  route(async (request, response) => {
    const state = typeof request.query["state"] === "string" ? request.query["state"] : undefined;
    const city = typeof request.query["city"] === "string" ? request.query["city"] : undefined;
    const limit = Number(request.query["limit"] ?? 20);
    return response.json(
      await searchProperties({
        ...(state ? { state } : {}),
        ...(city ? { city } : {}),
        auctionOnly: true,
        sortBy: "auctionDate",
        limit,
      }),
    );
  }),
);

router.get(
  "/similar/:id",
  route(async (request, response) => {
    return response.json(await findSimilarProperties(pathParam(request, "id")));
  }),
);

router.get(
  "/saved",
  authenticate,
  route(async (request, response) => {
    const user = (request as AuthenticatedRequest).authUser!;
    await connectMongo();
    const saved = await Favorite.find({ userId: user.id })
      .sort({ updatedAt: -1 })
      .limit(100)
      .select("propertyId")
      .lean();
    const properties = await PropertyModel.find({
      _id: { $in: saved.map((item) => item.propertyId) },
      status: { $in: ["published", "active"] },
    }).lean();
    return response.json({ properties: properties.map((item) => propertyDto(item)) });
  }),
);

router.post(
  "/save",
  authenticate,
  route(async (request, response) => {
    const user = (request as AuthenticatedRequest).authUser!;
    const body = z
      .object({ propertyId: z.string().min(1).max(120) })
      .strict()
      .parse(request.body);
    await connectMongo();
    const clauses: Record<string, unknown>[] = [
      { legacyId: body.propertyId },
      { sourceListingId: body.propertyId },
    ];
    if (/^[a-f\d]{24}$/i.test(body.propertyId)) clauses.push({ _id: body.propertyId });
    const property = await PropertyModel.findOne({
      $or: clauses,
      status: { $in: ["published", "active"] },
    })
      .select("_id")
      .lean();
    if (!property) return response.status(404).json({ error: "Property not found." });
    await Favorite.updateOne(
      { userId: user.id, propertyId: property._id },
      { $setOnInsert: { userId: user.id, propertyId: property._id } },
      { upsert: true },
    );
    return response.status(201).json({ saved: true });
  }),
);

router.delete(
  "/save/:id",
  authenticate,
  route(async (request, response) => {
    const user = (request as AuthenticatedRequest).authUser!;
    await connectMongo();
    const id = pathParam(request, "id");
    const clauses: Record<string, unknown>[] = [{ legacyId: id }, { sourceListingId: id }];
    if (/^[a-f\d]{24}$/i.test(id)) clauses.push({ _id: id });
    const property = await PropertyModel.findOne({
      $or: clauses,
      status: { $in: ["published", "active"] },
    })
      .select("_id")
      .lean();
    if (!property) return response.status(404).json({ error: "Property not found." });
    await Favorite.deleteOne({ userId: user.id, propertyId: property._id });
    return response.status(204).end();
  }),
);

router.post(
  "/compare",
  route(async (request, response) => {
    const body = z
      .object({ propertyIds: z.array(z.string().min(1).max(120)).min(2).max(5) })
      .strict()
      .parse(request.body);
    const properties = await compareProperties(body.propertyIds);
    return response.json({ properties });
  }),
);

router.post(
  "/calculate-offer",
  route(async (request, response) => {
    const body = z
      .object({
        askingPrice: z.number().finite().min(0).max(100_000_000),
        discountPercent: z.number().finite().min(0).max(100),
      })
      .strict()
      .parse(request.body);
    return response.json(calculateTargetOffer(body.askingPrice, body.discountPercent));
  }),
);

router.post(
  "/investment-analysis",
  route(async (request, response) => {
    const body = z
      .object({
        purchasePrice: z.number().finite().min(0).max(100_000_000),
        repairCosts: z.number().finite().min(0).max(100_000_000).default(0),
        closingPercent: z.number().finite().min(0).max(30).default(3),
        annualNetIncome: z.number().finite().min(0).max(100_000_000).optional(),
      })
      .strict()
      .parse(request.body);
    const total = calculateTotalInvestment(
      body.purchasePrice,
      body.repairCosts,
      body.closingPercent,
    );
    return response.json({
      ...total,
      ...(body.annualNetIncome !== undefined
        ? estimateInvestmentReturn(total.estimatedTotalInvestment, body.annualNetIncome)
        : {}),
    });
  }),
);

router.get(
  "/:id",
  route(async (request, response) => {
    const property = await getProperty(pathParam(request, "id"));
    return property
      ? response.json(property)
      : response.status(404).json({ error: "Property not found in the current inventory." });
  }),
);

export const propertyRouter = router;
