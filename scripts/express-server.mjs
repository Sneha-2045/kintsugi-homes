import express from "express";
import { middleware } from "../.output/server/index.mjs";
import { authRouter } from "../src/server/auth-router.ts";
import { chatRouter, mongoRateLimit } from "../src/server/chat-router.ts";
import { propertyRouter } from "../src/server/property-router.ts";
import { initializeMongo } from "../src/server/mongo.ts";
import { seedKnowledgeBase } from "../src/server/knowledge-base.ts";
import mongoose from "mongoose";
import { apiErrorHandler } from "../src/server/chat-router.ts";

const app = express();
const port = Number.parseInt(process.env["PORT"] ?? "3000", 10);
const host = process.env["HOST"] ?? "0.0.0.0";

await initializeMongo();
await seedKnowledgeBase();

app.disable("x-powered-by");
app.set("trust proxy", 1);
const clientOrigin = process.env["CLIENT_URL"]
  ? new URL(process.env["CLIENT_URL"]).origin
  : undefined;
if (process.env["NODE_ENV"] === "production" && !clientOrigin)
  throw new Error("CLIENT_URL is required in production.");
app.use("/api", (request, response, next) => {
  const origin = request.get("origin");
  if (origin && clientOrigin && origin === clientOrigin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    response.setHeader("Vary", "Origin");
  }
  if (request.method === "OPTIONS") return response.sendStatus(origin === clientOrigin ? 204 : 403);
  if (origin && clientOrigin && origin !== clientOrigin)
    return response.status(403).json({ error: "Origin not allowed." });
  return next();
});
app.get("/__health", (_request, response) => {
  const ok = mongoose.connection.readyState === 1;
  return response.status(ok ? 200 : 503).json({ ok });
});
app.use("/api/auth", express.json({ limit: "32kb" }), mongoRateLimit, authRouter);
app.use("/api/chat", express.json({ limit: "32kb" }), mongoRateLimit, chatRouter);
app.use("/api/properties", express.json({ limit: "32kb" }), mongoRateLimit, propertyRouter);
app.use((error, request, response, next) => {
  if (!request.path.startsWith("/api/")) return next(error);
  if (!request.path.startsWith("/api/auth")) return apiErrorHandler(error, request, response, next);
  const status =
    Number.isInteger(error?.status) && error.status >= 400 && error.status < 600
      ? error.status
      : error?.name === "ZodError"
        ? 400
        : 500;
  response.status(status).json({
    error: status < 500 ? error.message : "Request failed. Please try again.",
  });
});

// Nitro's Node middleware adapter serves the TanStack Start SSR app and its
// server routes. Keep request bodies untouched so streaming server functions
// and multipart endpoints continue to work.
app.use(middleware);

const server = app.listen(port, host, () => {
  console.log(`Rylestate Express server listening on ${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
