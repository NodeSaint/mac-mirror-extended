/** Taskbar — bottom bar with app launcher button, open app icons, system tray. */

// eslint-disable-next-line no-unused-vars
const Taskbar = (() => {
  const centreEl = () => document.getElementById('taskbar-centre');
  const clockEl = () => document.getElementById('tray-clock');
  const connEl = () => document.getElementById('tray-connection');
  let clockTimer = null;

  function init() {
    updateClock();
    clockTimer = setInterval(updateClock, 15000);

    // Settings button opens settings app
    document.getElementById('tray-settings').addEventListener('click', () => {
      if (typeof AppRegistry !== 'undefined') {
        const app = AppRegistry.get('settings');
        if (app) WM.open(app);
      }
    });

    // Connection status
    DesktopWS.on('open', () => {
      connEl().style.color = 'var(--success)';
      connEl().title = 'Connected';
    });
    DesktopWS.on('close', () => {
      connEl().style.color = 'var(--danger)';
      connEl().title = 'Disconnected';
    });
  }

  function updateClock() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const el = clockEl();
    if (el) el.textContent = h + ':' + m;
  }

  /** Rebuild the centre section with buttons for open apps. */
  function update() {
    const centre = centreEl();
    if (!centre) return;
    centre.innerHTML = '';

    const windows = WM.getWindows();
    const focusedId = WM.getFocusedId();

    // Group by app ID
    const appGroups = new Map();
    for (const [id, win] of windows) {
      if (!appGroups.has(win.app.id)) {
        appGroups.set(win.app.id, []);
      }
      appGroups.get(win.app.id).push({ id, win });
    }

    for (const [appId, group] of appGroups) {
      const app = group[0].win.app;
      const btn = document.createElement('button');
      btn.className = 'taskbar-app';
      const isFocused = group.some(g => g.id === focusedId);
      if (isFocused) btn.classList.add('active');
      btn.innerHTML = `<span>${app.icon}</span><span class="dot"></span>`;
      btn.title = app.title;

      btn.addEventListener('click', () => {
        if (group.length === 1) {
          const { id, win } = group[0];
          if (win.state.minimised) {
            WM.unminimise(id);
          } else if (id === focusedId) {
            WM.minimise(id);
          } else {
            WM.focus(id);
          }
        } else {
          // Multiple windows — focus next in group
          const focusedIdx = group.findIndex(g => g.id === focusedId);
          const nextIdx = (focusedIdx + 1) % group.length;
          const { id, win } = group[nextIdx];
          if (win.state.minimised) {
            WM.unminimise(id);
          } else {
            WM.focus(id);
          }
        }
      });

      centre.appendChild(btn);
    }
  }

  function destroy() {
    if (clockTimer) clearInterval(clockTimer);
  }

  return { init, update, destroy };
})();
