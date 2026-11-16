import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "./auth-router.ts";
import { getStoredAgent, searchStoredAgents, syncAgentsForLocation } from "./agent-service.ts";

export const agentRouter = Router();
export const adminAgentRouter = Router();

function route(handler: (request: Request, response: Response) => Promise<unknown>) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      return await handler(request, response);
    } catch (error) {
      return next(error);
    }
  };
}

function params(request: Request) {
  const query = request.query;
  const number = (value: unknown, fallback: number) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : fallback;
  };
  return {
    ...(typeof query["city"] === "string" ? { city: query["city"].trim() } : {}),
    ...(typeof query["state"] === "string" ? { state: query["state"].trim() } : {}),
    ...(typeof query["zipCode"] === "string" ? { zipCode: query["zipCode"].trim() } : {}),
    ...(typeof query["location"] === "string" ? { location: query["location"].trim() } : {}),
    ...(typeof query["q"] === "string" ? { q: query["q"].trim() } : {}),
    page: Math.max(1, number(query["page"], 1)),
    limit: Math.min(100, Math.max(1, number(query["limit"], 24))),
    sortBy: query["sortBy"] === "sales" ? ("sales" as const) : ("rating" as const),
    sortOrder: query["sortOrder"] === "asc" ? ("asc" as const) : ("desc" as const),
  };
}

agentRouter.get(
  "/search",
  route(async (request, response) => {
    const query = typeof request.query["q"] === "string" ? request.query["q"].trim() : "";
    if (!query)
      return response.status(400).json({ error: "Enter an agent name or brokerage to search." });
    return response.json(await searchStoredAgents({ ...params(request), q: query }));
  }),
);

agentRouter.get(
  "/",
  route(async (request, response) => response.json(await searchStoredAgents(params(request)))),
);

agentRouter.get(
  "/:id",
  route(async (request, response) => {
    const id = Array.isArray(request.params["id"]) ? request.params["id"][0] : request.params["id"];
    const agent = await getStoredAgent(id ?? "");
    if (!agent) return response.status(404).json({ error: "Agent not found." });
    return response.json({ agent });
  }),
);

adminAgentRouter.post(
  "/sync",
  authenticate,
  requireRole("admin"),
  route(async (request, response) => {
    const body = z
      .object({
        locations: z.array(z.string().trim().min(2).max(120)).min(1).max(20).optional(),
        location: z.string().trim().min(2).max(120).optional(),
      })
      .refine((value) => Boolean(value.location || value.locations?.length), {
        message: "Provide a location or a list of locations.",
      })
      .parse(request.body);
    const locations = body.locations ?? (body.location ? [body.location] : []);
    const results = [];
    for (const location of [...new Set(locations)]) {
      results.push(await syncAgentsForLocation(location));
    }
    return response.json({ results });
  }),
);
