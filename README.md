# iPhone Desktop

A web-based desktop environment that turns your iPhone into a full desktop computer when connected to an external monitor. Open it in Safari, go fullscreen, and you've got a windowed desktop with apps — no jailbreak, no native app, just a web page.

**This is NOT a remote desktop.** The desktop runs entirely in the browser. The server provides the shell, built-in apps, file storage, and API layer. Your iPhone is the computer; the monitor is just the display.

## How It Works with iPhone

### What You Need

- **iPhone 15 or later** (USB-C) with a USB-C to HDMI adapter, OR **any iPhone** via AirPlay to a TV/monitor
- A **Bluetooth mouse and keyboard** paired to your iPhone
- A Mac/PC/server running this project on your local network (ideally via [Tailscale](https://tailscale.com))

### Setup

1. **Start the server** on any machine (Mac, Linux, Raspberry Pi, etc.):

   ```bash
   ./start.sh        # dev mode
   ./start-prod.sh   # production mode
   ```

2. **Connect your iPhone to the external monitor:**
   - **USB-C to HDMI:** Plug in the adapter and HDMI cable. iPhone mirrors to the monitor automatically.
   - **AirPlay:** Swipe into Control Centre → Screen Mirroring → select your AirPlay display.

3. **Pair a Bluetooth mouse and keyboard** to your iPhone:
   - Settings → Bluetooth → pair your mouse and keyboard
   - Settings → Accessibility → Touch → AssistiveTouch → turn ON (this enables the mouse cursor on screen)

4. **Open Safari on your iPhone** and go to:

   ```
   http://<your-server-ip>:3847
   ```

   If you're using Tailscale, use your Tailscale IP. If the server is on the same Wi-Fi, use the local IP.

5. **Go fullscreen:** Tap the `Aa` menu in Safari's address bar → Hide Toolbar. The desktop now fills your external monitor.

That's it. You now have a desktop environment with a taskbar, window manager, and apps — all driven by your iPhone with a mouse and keyboard.

### How the Display Works

When an iPhone is connected to an external monitor, Safari renders on the external display. Your iPhone screen shows Safari controls, but the actual page content appears on the monitor. With the toolbar hidden, the monitor shows nothing but the desktop.

Touch still works on the iPhone screen as a fallback, but the primary input is your Bluetooth mouse and keyboard. All standard interactions work: click, drag, right-click, scroll, keyboard shortcuts.

## Running

```bash
./start.sh               # Dev: start server with auto-reload
./start-prod.sh           # Production: build TypeScript, start server
npm run server            # Server only (no watch)
npm run dev               # Server with watch
```

Server runs on port **3847** by default. Change it in `config.json` or set `IPHONE_DESKTOP_PORT=XXXX`.

## Features

### Desktop Shell

- **Window Manager** — drag, resize, minimise, maximise, snap to left/right half, z-index stacking
- **Taskbar** — bottom bar with app launcher, running app indicators, clock, connection status
- **App Launcher** — searchable grid of all apps, grouped by category
- **Dark/Light theme** — with 5 wallpaper options
- **Keyboard shortcuts:**
  - `Cmd+Q` — close window
  - `Cmd+Tab` — cycle windows
  - `Cmd+M` — minimise
  - `Cmd+Space` — open launcher
  - `F11` — toggle maximise
  - `Cmd+Shift+←/→` — snap left/right
- **Right-click context menu** (two-finger tap on trackpad, long-press on touch)

### Built-in Apps

| App | Description |
|-----|-------------|
| 🌐 Browser | Iframe-based web browser with URL bar, navigation, Google search |
| ⬛ Terminal | Command shell — ls, cat, mkdir, rm, sysinfo, uptime, theme toggle |
| 📝 Notes | Markdown editor with save/load to server storage |
| 📁 Files | File manager — browse, upload, download, create folders |
| ⚙️ Settings | Theme, wallpaper, system info, storage management |
| 🎵 Music | Audio player — upload and play music files |
| 🖼️ Photos | Image gallery — upload, browse thumbnails, fullscreen viewer |

### Server API

All endpoints under `/api/v1/`:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/files/{path}` | List directory or read file |
| POST | `/files/{path}` | Upload/create file |
| PUT | `/files/{path}` | Rename/move file |
| DELETE | `/files/{path}` | Delete file or directory |
| GET | `/apps` | List installed apps |
| GET/PUT | `/settings` | Read/update user settings |
| GET/POST | `/clipboard` | Get/set clipboard |
| GET | `/system/info` | Server uptime, memory, storage |

WebSocket at `/ws` for live updates and clipboard sync.

## Project Structure

```
src/
├── server/              — Express 5 + WebSocket server
│   ├── index.ts         — Server entry point
│   ├── config.ts        — Config from config.json + env vars
│   ├── logger.ts        — Structured JSON logging
│   ├── api/             — REST endpoints (files, apps, settings, clipboard, system)
│   └── ws/              — WebSocket handler
├── desktop/             — Desktop shell (vanilla HTML/JS/CSS, no build step)
│   ├── index.html       — Shell entry point (served at /)
│   ├── shell/           — Taskbar, launcher, window manager, theme, app registry
│   ├── apps/            — 7 built-in apps (browser, terminal, notes, files, settings, music, photos)
│   ├── input/           — Mouse, keyboard, and touch input handlers
│   └── lib/             — API client, WebSocket client, localStorage wrapper
├── config.json          — Port, theme, storage config
└── data/                — File storage root (created automatically)
```

## Configuration

`config.json` at project root:

```json
{
  "port": 3847,
  "storage": { "root": "./data" },
  "theme": { "mode": "dark", "wallpaper": "default" },
  "apps": { "enabled": ["*"] },
  "input": { "shortcuts": true }
}
```

Environment variable overrides: `IPHONE_DESKTOP_PORT`, `IPHONE_DESKTOP_STORAGE`.

## Stack

- **Server:** Node.js 20+, TypeScript, Express 5, ws
- **Desktop:** Vanilla HTML/CSS/JS (no React, no build step — intentional, see [mac-mirror Known Issues](https://github.com/NodeSaint/mac-mirror))
- **Networking:** Tailscale recommended (network = auth, no login needed)

## Ancestry

Built on patterns from [mac-mirror](https://github.com/NodeSaint/mac-mirror): single-port Express+ws server, standalone HTML viewer, touch input handling, structured logging, Tailscale networking. What's different: mac-mirror captures and relays a remote screen; iPhone Desktop renders its own desktop environment.
