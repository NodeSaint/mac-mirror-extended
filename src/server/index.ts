/** iPhone Desktop — Server entry point.
 *
 * Express + WebSocket on a single port. Serves the desktop shell as static
 * HTML/JS/CSS at /. Provides REST API for files, apps, settings, clipboard.
 * WebSocket at /ws for live updates.
 */

import express from "express";
import { createServer } from "node:http";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import { WebSocketServer } from "ws";
import { PORT, STORAGE_ROOT } from "./config.js";
import { logger } from "./logger.js";
import { addWsClient } from "./ws/handler.js";
import filesRouter from "./api/files.js";
import appsRouter from "./api/apps.js";
import settingsRouter from "./api/settings.js";
import clipboardRouter from "./api/clipboard.js";
import systemRouter from "./api/system.js";

// Ensure storage directory exists
mkdirSync(STORAGE_ROOT, { recursive: true });

const __dirname = dirname(fileURLToPath(import.meta.url));
const desktopPath = resolve(__dirname, "..", "desktop");

const app = express();

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.raw({ type: "application/octet-stream", limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// CORS headers for dev
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

// API routes
app.use("/api/v1/files", filesRouter);
app.use("/api/v1/apps", appsRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/clipboard", clipboardRouter);
app.use("/api/v1/system", systemRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()) });
});

// Serve desktop shell static files
app.use(express.static(desktopPath));

// Fallback: serve index.html for the root
app.get("/", (_req, res) => {
  res.sendFile(resolve(desktopPath, "index.html"));
});

const httpServer = createServer(app);

// WebSocket
const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (pathname === "/ws") {
    wss.handleUpgrade(req, socket, head, (ws) => {
      addWsClient(ws);
    });
  } else {
    socket.destroy();
  }
});

// Start
httpServer.listen(PORT, "0.0.0.0", () => {
  logger.info("iPhone Desktop server listening", { port: PORT, host: "0.0.0.0" });
  logger.info("Storage root", { path: STORAGE_ROOT });
  logger.info("Desktop shell", { path: desktopPath });
});

// Graceful shutdown
function shutdown(): void {
  logger.info("Shutting down...");
  wss.close();
  httpServer.close(() => {
    logger.info("Server stopped");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
