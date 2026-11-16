import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Router, type Request, type RequestHandler, type Response } from "express";
import jwt from "jsonwebtoken";
import { connectMongo } from "./mongo.ts";
import { AuthSession, EmailVerificationToken, PasswordResetToken, User } from "./models.ts";

const router = Router();
const ACCESS_COOKIE = "rylestate_access";
const REFRESH_COOKIE = "rylestate_refresh";
const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export type AuthenticatedRequest = Request & {
  authUser?: { id: string; email: string; roles: string[] };
};

type SafeUser = { id: string; email: string; displayName?: string; roles: string[] };

class AuthError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function newToken() {
  return randomBytes(48).toString("base64url");
}

function accessSecret() {
  const secret = process.env["JWT_ACCESS_SECRET"];
  if (!secret || Buffer.byteLength(secret) < 32)
    throw new AuthError(503, "Authentication is not configured on this server.");
  return secret;
}

function baseUrl() {
  const value = process.env["APP_BASE_URL"];
  if (!value) throw new AuthError(503, "Authentication email is not configured on this server.");
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && process.env["NODE_ENV"] === "production")
      throw new Error("HTTPS required");
    return parsed.origin;
  } catch {
    throw new AuthError(503, "Authentication email is not configured on this server.");
  }
}

function safeUser(user: {
  _id: unknown;
  email: string;
  displayName?: string;
  roles?: string[];
}): SafeUser {
  return {
    id: String(user._id),
    email: user.email,
    ...(user.displayName ? { displayName: user.displayName } : {}),
    roles: user.roles ?? ["user"],
  };
}

function setCookies(response: Response, accessToken: string, refreshToken: string) {
  const secure = process.env["NODE_ENV"] === "production";
  const sameSite = secure ? "none" : "lax";
  response.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: ACCESS_TTL_MS,
  });
  response.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/api/auth",
    maxAge: REFRESH_TTL_MS,
  });
}

function clearCookies(response: Response) {
  const secure = process.env["NODE_ENV"] === "production";
  const sameSite = secure ? "none" : "lax";
  response.clearCookie(ACCESS_COOKIE, { httpOnly: true, secure, sameSite, path: "/" });
  response.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/api/auth",
  });
}

type AuthLookupRequest = Request | globalThis.Request;

function requestHeader(request: AuthLookupRequest, name: string) {
  if (typeof (request.headers as Headers).get === "function") {
    return (request.headers as Headers).get(name) ?? undefined;
  }
  const value = (request.headers as Request["headers"])[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function cookieValue(request: AuthLookupRequest, name: string) {
  const header = requestHeader(request, "cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function accessToken(request: AuthLookupRequest) {
  const authorization = requestHeader(request, "authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();
  return cookieValue(request, ACCESS_COOKIE);
}

function signAccessToken(user: SafeUser) {
  return jwt.sign({ email: user.email, roles: user.roles }, accessSecret(), {
    algorithm: "HS256",
    subject: user.id,
    issuer: "rylestate",
    audience: "rylestate-web",
    expiresIn: "15m",
  });
}

async function issueSession(request: Request, response: Response, user: SafeUser) {
  const refreshToken = newToken();
  await AuthSession.create({
    userId: user.id,
    tokenHash: digest(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    userAgent: request.get("user-agent")?.slice(0, 1000),
    ipHash: request.ip ? digest(request.ip) : undefined,
  });
  setCookies(response, signAccessToken(user), refreshToken);
}

function requestOrigin(request: Request): string | undefined {
  const origin = request.get("origin");
  if (!origin) return undefined;
  try {
    return new URL(origin).origin;
  } catch {
    return undefined;
  }
}

router.use((request, _response, next) => {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS")
    return next();
  let expectedOrigin: string;
  try {
    expectedOrigin = baseUrl();
  } catch (error) {
    return next(error);
  }
  if (requestOrigin(request) !== expectedOrigin)
    return next(new AuthError(403, "Request origin is not allowed."));
  return next();
});

router.post("/register", async (request, response) => {
  await connectMongo();
  const email =
    typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body?.password === "string" ? request.body.password : "";
  const displayName =
    typeof request.body?.displayName === "string" ? request.body.displayName.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    throw new AuthError(400, "Enter a valid email address.");
  if (password.length < 8 || password.length > 128)
    throw new AuthError(400, "Password must be at least 8 characters.");
  if (displayName.length > 160) throw new AuthError(400, "Name is too long.");

  const existing = await User.findOne({ email }).select("+passwordHash");
  if (existing?.emailVerifiedAt)
    return response
      .status(202)
      .json({ message: "If this address can register, a verification email will be sent." });

  const user =
    existing ??
    new User({
      email,
      passwordHash: await bcrypt.hash(password, 12),
      displayName: displayName || undefined,
      roles: ["user"],
    });
  if (existing) {
    existing.passwordHash = await bcrypt.hash(password, 12);
    if (displayName) existing.displayName = displayName;
  }
  await user.save();

  const rawToken = newToken();
  await EmailVerificationToken.deleteMany({ userId: user._id, usedAt: null });
  await EmailVerificationToken.create({
    userId: user._id,
    tokenHash: digest(rawToken),
    expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
  });
  await sendAuthEmail(
    email,
    "Confirm your Rylestate account",
    `<p>Confirm your email to finish creating your account.</p><p><a href="${baseUrl()}/api/auth/verify?token=${encodeURIComponent(rawToken)}">Confirm email</a></p>`,
  );
  return response.status(202).json({ message: "Check your email to confirm your account." });
});

router.get("/verify", async (request, response) => {
  await connectMongo();
  const token = typeof request.query["token"] === "string" ? request.query["token"] : "";
  if (!token || token.length > 256) throw new AuthError(400, "This verification link is invalid.");
  const verification = await EmailVerificationToken.findOneAndUpdate(
    { tokenHash: digest(token), usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  );
  if (!verification) throw new AuthError(400, "This verification link is invalid or has expired.");
  const user = await User.findByIdAndUpdate(
    verification.userId,
    { $set: { emailVerifiedAt: new Date() } },
    { new: true },
  );
  if (!user || user.disabledAt)
    throw new AuthError(400, "This verification link is no longer valid.");
  await issueSession(request, response, safeUser(user));
  return response.redirect(303, `${baseUrl()}/admin`);
});

router.post("/login", async (request, response) => {
  await connectMongo();
  const email =
    typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body?.password === "string" ? request.body.password : "";
  const user = await User.findOne({ email }).select("+passwordHash");
  const matches = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !matches || user.disabledAt)
    throw new AuthError(401, "Email or password is incorrect.");
  if (!user.emailVerifiedAt) throw new AuthError(403, "Confirm your email before signing in.");
  const safe = safeUser(user);
  await issueSession(request, response, safe);
  return response.json({ user: safe });
});

router.post("/refresh", async (request, response) => {
  await connectMongo();
  const current = cookieValue(request, REFRESH_COOKIE);
  if (!current || current.length > 256)
    throw new AuthError(401, "Session expired. Please sign in again.");
  const replacement = newToken();
  const session = await AuthSession.findOneAndUpdate(
    { tokenHash: digest(current), revokedAt: null, expiresAt: { $gt: new Date() } },
    {
      $set: {
        tokenHash: digest(replacement),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    },
    { new: true },
  );
  if (!session) throw new AuthError(401, "Session expired. Please sign in again.");
  const user = await User.findById(session.userId);
  if (!user || user.disabledAt) {
    await AuthSession.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
    throw new AuthError(401, "Session expired. Please sign in again.");
  }
  const safe = safeUser(user);
  setCookies(response, signAccessToken(safe), replacement);
  return response.json({ user: safe });
});

router.post("/logout", async (request, response) => {
  await connectMongo();
  const refresh = cookieValue(request, REFRESH_COOKIE);
  if (refresh) {
    await AuthSession.updateOne(
      { tokenHash: digest(refresh), revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }
  clearCookies(response);
  return response.status(204).end();
});

router.get("/me", authenticate, (request, response) => {
  const user = (request as AuthenticatedRequest).authUser!;
  return response.json({ user });
});

router.post("/password-reset/request", async (request, response) => {
  await connectMongo();
  const email =
    typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254) {
    const user = await User.findOne({ email, disabledAt: null });
    if (user) {
      const rawToken = newToken();
      await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });
      await PasswordResetToken.create({
        userId: user._id,
        tokenHash: digest(rawToken),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      });
      await sendAuthEmail(
        email,
        "Reset your Rylestate password",
        `<p>Use this link to set a new password. It expires in 30 minutes.</p><p><a href="${baseUrl()}/login?reset=${encodeURIComponent(rawToken)}">Reset password</a></p>`,
      );
    }
  }
  return response
    .status(202)
    .json({ message: "If an account matches that address, a reset email will be sent." });
});

router.post("/password-reset/confirm", async (request, response) => {
  await connectMongo();
  const token = typeof request.body?.token === "string" ? request.body.token : "";
  const password = typeof request.body?.password === "string" ? request.body.password : "";
  if (!token || token.length > 256)
    throw new AuthError(400, "This reset link is invalid or expired.");
  if (password.length < 8 || password.length > 128)
    throw new AuthError(400, "Password must be at least 8 characters.");
  const reset = await PasswordResetToken.findOneAndUpdate(
    { tokenHash: digest(token), usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  );
  if (!reset) throw new AuthError(400, "This reset link is invalid or expired.");
  const user = await User.findById(reset.userId).select("+passwordHash");
  if (!user || user.disabledAt) throw new AuthError(400, "This reset link is invalid or expired.");
  user.passwordHash = await bcrypt.hash(password, 12);
  await user.save();
  await AuthSession.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  clearCookies(response);
  return response.json({ message: "Password updated. Sign in with your new password." });
});

export async function resolveAuthUser(request: AuthLookupRequest) {
  await connectMongo();
  const token = accessToken(request);
  if (!token) return undefined;
  const claims = jwt.verify(token, accessSecret(), {
    algorithms: ["HS256"],
    issuer: "rylestate",
    audience: "rylestate-web",
  });
  if (typeof claims === "string" || typeof claims.sub !== "string") return undefined;
  const user = await User.findById(claims.sub).select("email roles disabledAt");
  if (!user || user.disabledAt) return undefined;
  return {
    id: String(user._id),
    email: user.email,
    roles: user.roles ?? ["user"],
  };
}

export async function authenticate(
  request: Request,
  _response: Response,
  next: (error?: unknown) => void,
) {
  try {
    const user = await resolveAuthUser(request);
    if (!user) throw new AuthError(401, "Sign in to continue.");
    (request as AuthenticatedRequest).authUser = user;
    return next();
  } catch (error) {
    if (error instanceof AuthError) return next(error);
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError)
      return next(new AuthError(401, "Sign in to continue."));
    return next(error);
  }
}

export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (request, _response, next) => {
    const user = (request as AuthenticatedRequest).authUser;
    if (!user) return next(new AuthError(401, "Sign in to continue."));
    if (!user.roles.some((role) => allowedRoles.includes(role)))
      return next(new AuthError(403, "You do not have permission to do this."));
    return next();
  };
}

async function sendAuthEmail(to: string, subject: string, html: string) {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["ALERT_FROM_EMAIL"];
  if (!apiKey || !from)
    throw new AuthError(503, "Email delivery is not configured on this server.");
  const result = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
    signal: AbortSignal.timeout(15000),
  });
  if (!result.ok) throw new AuthError(503, "Email delivery is temporarily unavailable.");
}

export const authRouter = router;
