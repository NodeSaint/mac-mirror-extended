/** Apps API — list installed applications and metadata. */

import { Router, type Request, type Response } from "express";

const router = Router();

export interface AppMeta {
  id: string;
  title: string;
  icon: string;
  category: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  allowMultiple: boolean;
}

/** Registry of all built-in apps. */
export const APP_REGISTRY: AppMeta[] = [
  {
    id: "browser",
    title: "Browser",
    icon: "🌐",
    category: "Productivity",
    defaultSize: { w: 900, h: 600 },
    minSize: { w: 400, h: 300 },
    allowMultiple: true,
  },
  {
    id: "terminal",
    title: "Terminal",
    icon: "⬛",
    category: "Productivity",
    defaultSize: { w: 700, h: 450 },
    minSize: { w: 400, h: 250 },
    allowMultiple: true,
  },
  {
    id: "notes",
    title: "Notes",
    icon: "📝",
    category: "Productivity",
    defaultSize: { w: 600, h: 400 },
    minSize: { w: 300, h: 200 },
    allowMultiple: false,
  },
  {
    id: "files",
    title: "Files",
    icon: "📁",
    category: "System",
    defaultSize: { w: 700, h: 500 },
    minSize: { w: 400, h: 300 },
    allowMultiple: false,
  },
  {
    id: "settings",
    title: "Settings",
    icon: "⚙️",
    category: "System",
    defaultSize: { w: 500, h: 400 },
    minSize: { w: 400, h: 300 },
    allowMultiple: false,
  },
  {
    id: "music",
    title: "Music",
    icon: "🎵",
    category: "Media",
    defaultSize: { w: 500, h: 400 },
    minSize: { w: 350, h: 250 },
    allowMultiple: false,
  },
  {
    id: "photos",
    title: "Photos",
    icon: "🖼️",
    category: "Media",
    defaultSize: { w: 700, h: 500 },
    minSize: { w: 400, h: 300 },
    allowMultiple: false,
  },
];

router.get("/", (_req: Request, res: Response): void => {
  res.json({ apps: APP_REGISTRY });
});

router.get("/:id", (req: Request, res: Response): void => {
  const app = APP_REGISTRY.find((a) => a.id === req.params.id);
  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }
  res.json(app);
});

export default router;
