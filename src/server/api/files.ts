/** File system API — browse, read, write, delete files in the storage root. */

import { Router, type Request, type Response } from "express";
import {
  readdir,
  stat,
  readFile,
  writeFile,
  mkdir,
  unlink,
  rename,
  rm,
} from "node:fs/promises";
import { resolve, join, relative, extname, basename, dirname } from "node:path";
import { STORAGE_ROOT } from "../config.js";
import { logger } from "../logger.js";

const router = Router();

/** Resolve a user path to an absolute path, ensuring it stays within STORAGE_ROOT. */
function safePath(userPath: string): string | null {
  const resolved = resolve(STORAGE_ROOT, userPath.replace(/^\/+/, ""));
  if (!resolved.startsWith(STORAGE_ROOT)) return null;
  return resolved;
}

function mimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".pdf": "application/pdf",
  };
  return map[ext] ?? "application/octet-stream";
}

/** GET /api/v1/files/* — list directory or read file */
router.get("{/*path}", async (req: Request, res: Response): Promise<void> => {
  const rawPath = (req.params as Record<string, unknown>)["path"];
  const userPath = Array.isArray(rawPath) ? rawPath.join("/") : String(rawPath || "");
  const absPath = safePath(userPath);
  if (!absPath) {
    res.status(403).json({ error: "Path outside storage root" });
    return;
  }

  try {
    const s = await stat(absPath);
    if (s.isDirectory()) {
      const entries = await readdir(absPath, { withFileTypes: true });
      const items = await Promise.all(
        entries
          .filter((e) => !e.name.startsWith("."))
          .map(async (e) => {
            const entryPath = join(absPath, e.name);
            const entryStat = await stat(entryPath).catch(() => null);
            return {
              name: e.name,
              type: e.isDirectory() ? "directory" : "file",
              size: entryStat?.size ?? 0,
              modified: entryStat?.mtime.toISOString() ?? null,
              mime: e.isFile() ? mimeType(e.name) : null,
            };
          })
      );
      items.sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      res.json({
        path: "/" + (userPath || ""),
        type: "directory",
        items,
      });
    } else {
      const download = req.query["download"] === "true";
      if (download) {
        res.setHeader("Content-Disposition", `attachment; filename="${basename(absPath)}"`);
      }
      res.setHeader("Content-Type", mimeType(absPath));
      const content = await readFile(absPath);
      res.send(content);
    }
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      res.status(404).json({ error: "Not found" });
    } else {
      logger.error("File read error", { error: String(err), path: userPath });
      res.status(500).json({ error: "Internal error" });
    }
  }
});

/** POST /api/v1/files/* — create file or directory */
router.post("{/*path}", async (req: Request, res: Response): Promise<void> => {
  const rawPath = (req.params as Record<string, unknown>)["path"];
  const userPath = Array.isArray(rawPath) ? rawPath.join("/") : String(rawPath || "");
  const absPath = safePath(userPath);
  if (!absPath) {
    res.status(403).json({ error: "Path outside storage root" });
    return;
  }

  try {
    const isDir = req.query["type"] === "directory";
    if (isDir) {
      await mkdir(absPath, { recursive: true });
      res.json({ ok: true, path: "/" + userPath, type: "directory" });
    } else {
      await mkdir(dirname(absPath), { recursive: true });
      const body = req.body as Buffer;
      await writeFile(absPath, body);
      res.json({ ok: true, path: "/" + userPath, type: "file", size: body.length });
    }
  } catch (err) {
    logger.error("File write error", { error: String(err), path: userPath });
    res.status(500).json({ error: "Internal error" });
  }
});

/** PUT /api/v1/files/* — rename/move file */
router.put("{/*path}", async (req: Request, res: Response): Promise<void> => {
  const rawPath = (req.params as Record<string, unknown>)["path"];
  const userPath = Array.isArray(rawPath) ? rawPath.join("/") : String(rawPath || "");
  const absPath = safePath(userPath);
  if (!absPath) {
    res.status(403).json({ error: "Path outside storage root" });
    return;
  }

  try {
    const body = req.body as { destination?: string };
    if (!body.destination) {
      res.status(400).json({ error: "Missing destination" });
      return;
    }
    const destPath = safePath(body.destination);
    if (!destPath) {
      res.status(403).json({ error: "Destination outside storage root" });
      return;
    }
    await mkdir(dirname(destPath), { recursive: true });
    await rename(absPath, destPath);
    res.json({ ok: true, from: "/" + userPath, to: body.destination });
  } catch (err) {
    logger.error("File rename error", { error: String(err), path: userPath });
    res.status(500).json({ error: "Internal error" });
  }
});

/** DELETE /api/v1/files/* — delete file or directory */
router.delete("{/*path}", async (req: Request, res: Response): Promise<void> => {
  const rawPath = (req.params as Record<string, unknown>)["path"];
  const userPath = Array.isArray(rawPath) ? rawPath.join("/") : String(rawPath || "");
  const absPath = safePath(userPath);
  if (!absPath) {
    res.status(403).json({ error: "Path outside storage root" });
    return;
  }

  if (absPath === STORAGE_ROOT) {
    res.status(403).json({ error: "Cannot delete storage root" });
    return;
  }

  try {
    const s = await stat(absPath);
    if (s.isDirectory()) {
      await rm(absPath, { recursive: true });
    } else {
      await unlink(absPath);
    }
    res.json({ ok: true, path: "/" + userPath });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      res.status(404).json({ error: "Not found" });
    } else {
      logger.error("File delete error", { error: String(err), path: userPath });
      res.status(500).json({ error: "Internal error" });
    }
  }
});

export default router;
