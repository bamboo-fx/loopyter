// Conditionally import Vibecode proxy only if in Vibecode environment
// Use dynamic import to avoid errors when package is not available
if (process.env.VIBECODE_PROJECT_ID) {
  import("@vibecodeapp/proxy").catch(() => {
    // Silently fail if Vibecode proxy is not available (e.g., in production outside Vibecode)
    console.warn("[Warning] Vibecode proxy not available, continuing without it");
  });
}

import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { sampleRouter } from "./routes/sample";
import { sessionsRouter } from "./routes/sessions";
import { runsRouter } from "./routes/runs";
import { aiRouter } from "./routes/ai";
import { logger } from "hono/logger";
import { auth } from "./lib/auth";
import { env } from "./env";

const app = new Hono();

// CORS middleware - validates origin against allowlist
// Default origins for development and Vibecode platform
const defaultAllowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
];

// Parse custom allowed origins from environment variable
// Format: "https://example.com,https://*.example.com" (comma-separated)
let customAllowed: RegExp[] = [];
if (env.ALLOWED_ORIGINS) {
  customAllowed = env.ALLOWED_ORIGINS.split(",").map((origin) => {
    const trimmed = origin.trim();
    // Convert wildcard patterns to regex
    // "https://*.example.com" -> /^https:\/\/[^/]+\.example\.com$/
    const regexPattern = trimmed
      .replace(/\./g, "\\.")
      .replace(/\*/g, "[^/]+")
      .replace(/^/, "^")
      .replace(/$/, "$");
    return new RegExp(regexPattern);
  });
}

const allowed = [...defaultAllowed, ...customAllowed];

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return null;
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (origin === "null" || origin === "file://") return origin;
      return allowed.some((re) => re.test(origin)) ? origin : null;
    },
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Better Auth routes - handle all /api/auth/* requests
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/sessions", sessionsRouter);
app.route("/api/runs", runsRouter);
app.route("/api/ai", aiRouter);

const port = Number(env.PORT) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0"; // Bind to all interfaces for production

export default {
  port,
  hostname,
  fetch: app.fetch,
};
