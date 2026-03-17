/** Server configuration — reads from config.json and environment variables. */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, "..", "..", "config.json");

interface FileConfig {
  readonly port?: number;
  readonly storage?: { root?: string };
  readonly theme?: { mode?: string; wallpaper?: string };
  readonly apps?: { enabled?: string[] };
  readonly input?: { shortcuts?: boolean };
}

function loadFileConfig(): FileConfig {
  try {
    const raw = readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as FileConfig;
  } catch {
    return {};
  }
}

const fileConfig = loadFileConfig();

export const PORT: number =
  parseInt(process.env["IPHONE_DESKTOP_PORT"] ?? "", 10) ||
  (fileConfig.port ?? 3847);

export const STORAGE_ROOT: string =
  process.env["IPHONE_DESKTOP_STORAGE"] ??
  resolve(__dirname, "..", "..", fileConfig.storage?.root ?? "./data");

export const DEFAULT_THEME = {
  mode: fileConfig.theme?.mode ?? "dark",
  wallpaper: fileConfig.theme?.wallpaper ?? "default",
};

export const ENABLED_APPS: string[] = fileConfig.apps?.enabled ?? ["*"];

export const SHORTCUTS_ENABLED: boolean = fileConfig.input?.shortcuts ?? true;
