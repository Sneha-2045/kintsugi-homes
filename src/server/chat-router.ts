import { createHash, randomBytes } from "node:crypto";
import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { resolveAuthUser } from "./auth-router.ts";
import { answerWithGemini } from "./gemini-service.ts";
import { connectMongo, isMongoConnectivityError, safeMongoError } from "./mongo.ts";
import { ApiRateLimit, ChatMessage, ChatSession } from "./models.ts";

const router = Router();
const guestCookie = "rylestate_visitor";
const uuidSchema = z.string().regex(/^[A-Za-z0-9_-]{32,64}$/);
const conversationIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
const messageSchema = z
  .object({
    message: z.string().trim().min(1).max(4000),
    propertyId: z.string().trim().min(1).max(120).optional(),
    sessionId: conversationIdSchema.optional(),
  })
  .strict();

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function cookie(request: Request, name: string) {
  const part = request.headers.cookie
    ?.split(";")
    .find((item) => item.trim().startsWith(name + "="));
  if (!part) return undefined;
  try {
    return decodeURIComponent(part.slice(part.indexOf("=") + 1).trim());
  } catch {
    return undefined;
  }
}

async function identity(request: Request, response: Response) {
  let user;
  try {
    user = await resolveAuthUser(request);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("name" in error) ||
      !["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)
    )
      throw error;
  }
  let visitorId = cookie(request, guestCookie);
  if (!visitorId || !uuidSchema.safeParse(visitorId).success) {
    visitorId = randomBytes(32).toString("base64url");
    const crossSite = Boolean(
      process.env["CLIENT_URL"] &&
      new URL(process.env["CLIENT_URL"]!).hostname !== request.hostname,
    );
    response.cookie(guestCookie, visitorId, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: crossSite ? "none" : "lax",
      path: "/api",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }
  return { user, visitorId };
}

function ownerFilter(
  sessionId: string,
  identity: { user: { id: string } | undefined; visitorId: string },
) {
  const owners: Record<string, unknown>[] = [{ visitorId: identity.visitorId }];
  if (identity.user) owners.push({ userId: identity.user.id });
  return { _id: sessionId, expiresAt: { $gt: new Date() }, $or: owners };
}

async function ensureConversation(
  sessionId: string | undefined,
  identity: { user: { id: string } | undefined; visitorId: string },
) {
  if (sessionId) {
    const found = await ChatSession.findOne(ownerFilter(sessionId, identity));
    if (found) return found;
  }
  return ChatSession.create({
    ...(identity.user ? { userId: identity.user.id } : {}),
    visitorId: identity.visitorId,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });
}

router.get("/session", async (request, response, next) => {
  try {
    await connectMongo();
    const who = await identity(request, response);
    const existing = await ChatSession.findOne({
      visitorId: who.visitorId,
      expiresAt: { $gt: new Date() },
    })
      .sort({ updatedAt: -1 })
      .select("_id")
      .lean();
    return response.json({ sessionId: existing ? String(existing._id) : null });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const body = messageSchema.parse(request.body);
    await connectMongo();
    const who = await identity(request, response);
    const conversation = await ensureConversation(body.sessionId, who);
    const contextPropertyId = body.propertyId ?? conversation.currentPropertyId;
    let currentProperty;
    if (contextPropertyId) {
      const { getProperty } = await import("./property-service.ts");
      currentProperty = await getProperty(contextPropertyId);
    }
    const priorRows = await ChatMessage.find({ sessionId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(16)
      .lean();
    const prior = priorRows.reverse().map((item) => ({
      role: item.role,
      content:
        item.role === "assistant" && item.metadata?.toolResults?.length
          ? item.content +
            "\nVerified database tool results from that turn: " +
            JSON.stringify(item.metadata.toolResults).slice(0, 5000)
          : item.content,
    }));
    const result = await answerWithGemini({
      message:
        contextPropertyId && !currentProperty
          ? body.message +
            "\n\nSystem note: the current property ID could not be found in the Rylestate MongoDB inventory. Explain that its current listing record is unavailable and do not state property-specific details."
          : body.message,
      history: prior,
      context: {
        user: who.user,
        propertyId: currentProperty ? contextPropertyId : undefined,
        priorMessages: prior,
      },
    });
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    if (!conversation.title) conversation.title = body.message.slice(0, 120);
    conversation.currentPropertyId = currentProperty ? contextPropertyId : undefined;
    conversation.expiresAt = expiresAt;
    await ChatMessage.insertMany([
      {
        sessionId: conversation._id,
        role: "user",
        content: body.message,
        metadata: body.propertyId ? { propertyId: body.propertyId } : {},
        expiresAt,
      },
      {
        sessionId: conversation._id,
        role: "assistant",
        content: result.content,
        toolCalls: result.toolCalls,
        metadata: {
          properties: result.properties,
          toolResults: result.toolResults,
          propertyId: currentProperty ? contextPropertyId : undefined,
        },
        expiresAt,
      },
    ]);
    await conversation.save();
    return response.json({
      sessionId: String(conversation._id),
      message: {
        role: "assistant",
        content: result.content,
        properties: result.properties,
        toolCalls: result.toolCalls,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/history/:sessionId", async (request, response, next) => {
  try {
    await connectMongo();
    const who = await identity(request, response);
    const id = conversationIdSchema.safeParse(request.params["sessionId"]);
    if (!id.success) return response.status(400).json({ error: "Invalid conversation ID." });
    const found = await ChatSession.findOne(ownerFilter(id.data, who)).lean();
    if (!found) return response.status(404).json({ error: "Conversation not found." });
    const messages = await ChatMessage.find({ sessionId: found._id })
      .sort({ createdAt: 1 })
      .limit(40)
      .lean();
    return response.json({
      sessionId: String(found._id),
      messages: messages.map((item) => ({
        role: item.role,
        content: item.content,
        createdAt: item.createdAt,
        properties: item.metadata?.properties ?? [],
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/history/:sessionId", async (request, response, next) => {
  try {
    await connectMongo();
    const who = await identity(request, response);
    const id = conversationIdSchema.safeParse(request.params["sessionId"]);
    if (!id.success) return response.status(400).json({ error: "Invalid conversation ID." });
    const session = await ChatSession.findOne(ownerFilter(id.data, who)).select("_id");
    if (!session) return response.status(404).json({ error: "Conversation not found." });
    await ChatMessage.deleteMany({ sessionId: session._id });
    await session.deleteOne();
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export async function mongoRateLimit(request: Request, response: Response, next: NextFunction) {
  try {
    await connectMongo();
    const client = process.env["CLIENT_URL"];
    if (
      client &&
      request.get("origin") &&
      new URL(request.get("origin")!).origin !== new URL(client).origin
    )
      return response.status(403).json({ error: "Origin not allowed." });
    const windowMs = 60_000;
    const startMs = Math.floor(Date.now() / windowMs) * windowMs;
    const routeKey = request.baseUrl.includes("/auth")
      ? request.baseUrl + request.path
      : request.baseUrl;
    const key = digest((request.ip || "unknown") + "|" + routeKey);
    let record;
    try {
      record = await ApiRateLimit.findOneAndUpdate(
        { key, windowStart: new Date(startMs) },
        { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(startMs + 2 * windowMs) } },
        { upsert: true, new: true },
      ).lean();
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== 11000)
        throw error;
      record = await ApiRateLimit.findOneAndUpdate(
        { key, windowStart: new Date(startMs) },
        { $inc: { count: 1 } },
        { new: true },
      ).lean();
    }
    const max = request.baseUrl.includes("/chat")
      ? 15
      : request.baseUrl.includes("/auth") && request.path.includes("password-reset")
        ? 5
        : request.baseUrl.includes("/auth") && request.path === "/login"
          ? 10
          : request.baseUrl.includes("/auth") && request.path === "/register"
            ? 8
            : 120;
    if ((record?.count ?? 0) > max) {
      response.setHeader("Retry-After", "60");
      return response.status(429).json({ error: "Please wait a minute before trying again." });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

export function apiErrorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  const databaseUnavailable = isMongoConnectivityError(error);
  const errorStatus =
    error && typeof error === "object" && "status" in error ? error.status : undefined;
  const status = databaseUnavailable
    ? 503
    : typeof errorStatus === "number" && Number.isInteger(errorStatus)
      ? errorStatus
      : error instanceof z.ZodError
        ? 400
        : 500;
  if (databaseUnavailable) {
    console.error("[API] database connection unavailable", {
      route: _request.path,
      ...safeMongoError(error),
    });
  } else if (status >= 500) {
    console.error("[API] request failed", { route: _request.path, status });
  }
  return response.status(status).json({
    error: databaseUnavailable
      ? "The database is temporarily unavailable. Please retry shortly."
      : status >= 500
        ? "The service is temporarily unavailable."
        : error instanceof Error
          ? error.message
          : "Invalid request.",
    ...(databaseUnavailable ? { code: "DATABASE_UNAVAILABLE" } : {}),
  });
}

export const chatRouter = router;
