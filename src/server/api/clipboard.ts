/** Clipboard API — simple in-memory clipboard with WebSocket broadcast. */

import { Router, type Request, type Response } from "express";

const router = Router();

let clipboardContent = "";
let clipboardUpdated = Date.now();

export function getClipboard(): { content: string; updated: number } {
  return { content: clipboardContent, updated: clipboardUpdated };
}

export function setClipboard(content: string): void {
  clipboardContent = content;
  clipboardUpdated = Date.now();
}

router.get("/", (_req: Request, res: Response): void => {
  res.json({ content: clipboardContent, updated: new Date(clipboardUpdated).toISOString() });
});

router.post("/", (req: Request, res: Response): void => {
  const body = req.body as { content?: string };
  if (typeof body.content !== "string") {
    res.status(400).json({ error: "Missing content field" });
    return;
  }
  setClipboard(body.content);
  res.json({ ok: true, updated: new Date(clipboardUpdated).toISOString() });
});

export default router;
