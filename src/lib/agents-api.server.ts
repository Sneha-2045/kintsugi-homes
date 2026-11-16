import { z } from "zod";
import {
  getStoredAgent,
  searchStoredAgents,
  syncAgentsForLocation,
} from "../server/agent-service.ts";
import { resolveAuthUser } from "../server/auth-router.ts";
import { connectMongo } from "../server/mongo.ts";

// Start the first Atlas connection while the server is initializing so a page
// visit does not pay the cold-connection cost.
if (process.env["MONGODB_URI"]) {
  void connectMongo().catch((error: unknown) => {
    console.error(
      "[agents] MongoDB warm-up failed",
      error instanceof Error ? error.name : "UnknownError",
    );
  });
}

function searchArgs(url: URL, forceQuery?: string) {
  const query = url.searchParams;
  const integer = (name: string, fallback: number) => {
    const parsed = Number(query.get(name));
    return Number.isInteger(parsed) ? parsed : fallback;
  };
  return {
    ...(query.has("city") ? { city: query.get("city")! } : {}),
    ...(query.has("state") ? { state: query.get("state")! } : {}),
    ...(query.has("zipCode") ? { zipCode: query.get("zipCode")! } : {}),
    ...(query.has("location") ? { location: query.get("location")! } : {}),
    ...((forceQuery ?? query.get("q")) ? { q: forceQuery ?? query.get("q")! } : {}),
    page: Math.max(1, integer("page", 1)),
    limit: Math.min(100, Math.max(1, integer("limit", 24))),
    sortBy: query.get("sortBy") === "sales" ? ("sales" as const) : ("rating" as const),
    sortOrder: query.get("sortOrder") === "asc" ? ("asc" as const) : ("desc" as const),
  };
}

export async function listAgents(request: Request, forceQuery?: string) {
  try {
    return Response.json(await searchStoredAgents(searchArgs(new URL(request.url), forceQuery)), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error(
      "[agents] Directory request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return Response.json({ error: "Agent search is temporarily unavailable." }, { status: 503 });
  }
}

export async function readAgent(id: string) {
  try {
    const agent = await getStoredAgent(id);
    if (!agent) return Response.json({ error: "Agent not found." }, { status: 404 });
    return Response.json({ agent }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Agent search is temporarily unavailable." }, { status: 503 });
  }
}

const syncSchema = z
  .object({
    locations: z.array(z.string().trim().min(2).max(120)).min(1).max(20).optional(),
    location: z.string().trim().min(2).max(120).optional(),
  })
  .refine((value) => Boolean(value.location || value.locations?.length), {
    message: "Provide a location or a list of locations.",
  });

export async function syncAgents(request: Request) {
  let user;
  try {
    user = await resolveAuthUser(request);
  } catch {
    return Response.json({ error: "Sign in as an administrator to sync agents." }, { status: 401 });
  }
  if (!user)
    return Response.json({ error: "Sign in as an administrator to sync agents." }, { status: 401 });
  if (!user.roles.includes("admin")) {
    return Response.json({ error: "You do not have permission to sync agents." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Provide valid JSON." }, { status: 400 });
  }
  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid sync request." },
      { status: 400 },
    );
  }
  const locations = parsed.data.locations ?? (parsed.data.location ? [parsed.data.location] : []);
  try {
    const results = [];
    for (const location of [...new Set(locations)]) {
      results.push(await syncAgentsForLocation(location));
    }
    return Response.json({ results }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Agent sync failed. Check the sync log for details." },
      { status: 503 },
    );
  }
}
