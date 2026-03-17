/** System API — server info, uptime, storage stats. */

import { Router, type Request, type Response } from "express";
import { statfs } from "node:fs/promises";
import { STORAGE_ROOT } from "../config.js";

const router = Router();
const startTime = Date.now();

router.get("/info", async (_req: Request, res: Response): Promise<void> => {
  let storageInfo = { total: 0, free: 0, used: 0 };
  try {
    const fs = await statfs(STORAGE_ROOT);
    const total = fs.blocks * fs.bsize;
    const free = fs.bfree * fs.bsize;
    storageInfo = { total, free, used: total - free };
  } catch {
    // statfs not available on all platforms
  }

  res.json({
    uptime: Math.round((Date.now() - startTime) / 1000),
    platform: process.platform,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage().heapUsed,
    storage: storageInfo,
  });
});

export default router;
