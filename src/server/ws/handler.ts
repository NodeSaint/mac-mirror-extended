/** WebSocket handler — live updates, notifications, clipboard sync. */

import { WebSocket } from "ws";
import { logger } from "../logger.js";

const clients = new Set<WebSocket>();

export function addWsClient(ws: WebSocket): void {
  clients.add(ws);
  logger.info("WebSocket client connected", { clientCount: clients.size });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(String(raw)) as Record<string, unknown>;
      const type = msg["type"] as string | undefined;

      if (type === "heartbeat") {
        ws.send(JSON.stringify({ type: "heartbeat", ts: Date.now() }));
      } else if (type === "clipboard") {
        // Broadcast clipboard to all other clients
        broadcastToOthers(ws, JSON.stringify(msg));
      }
    } catch {
      logger.warn("Malformed WebSocket message");
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    logger.info("WebSocket client disconnected", { clientCount: clients.size });
  });

  ws.on("error", (err) => {
    logger.error("WebSocket client error", { error: String(err) });
  });

  // Send welcome
  ws.send(JSON.stringify({ type: "connected", clientCount: clients.size }));
}

export function broadcast(msg: string): void {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

function broadcastToOthers(sender: WebSocket, msg: string): void {
  for (const client of clients) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

export function wsClientCount(): number {
  return clients.size;
}
