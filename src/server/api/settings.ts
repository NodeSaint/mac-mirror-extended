/** Settings API — read and update user settings persisted to disk. */

import { Router, type Request, type Response } from "express";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { STORAGE_ROOT, DEFAULT_THEME } from "../config.js";
import { logger } from "../logger.js";

const router = Router();
const settingsPath = resolve(STORAGE_ROOT, ".settings.json");

interface UserSettings {
  theme: { mode: string; wallpaper: string };
  [key: string]: unknown;
}

async function loadSettings(): Promise<UserSettings> {
  try {
    const raw = await readFile(settingsPath, "utf-8");
    return JSON.parse(raw) as UserSettings;
  } catch {
    return { theme: { ...DEFAULT_THEME } };
  }
}

async function saveSettings(settings: UserSettings): Promise<void> {
  await mkdir(dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, JSON.stringify(settings, null, 2));
}

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const settings = await loadSettings();
  res.json(settings);
});

router.put("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const current = await loadSettings();
    const updates = req.body as Record<string, unknown>;
    const merged = { ...current, ...updates };
    if (updates.theme && typeof updates.theme === "object") {
      merged.theme = { ...current.theme, ...(updates.theme as Record<string, string>) };
    }
    await saveSettings(merged as UserSettings);
    res.json(merged);
  } catch (err) {
    logger.error("Settings save error", { error: String(err) });
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
