/** Settings app — system settings for theme, wallpaper, display, input. */

(() => {
  AppRegistry.register({
    id: 'settings',
    title: 'Settings',
    icon: '⚙️',
    category: 'System',
    defaultSize: { w: 500, h: 400 },
    minSize: { w: 400, h: 300 },
    allowMultiple: false,

    init(contentEl) {
      contentEl.style.cssText = 'padding:20px;overflow-y:auto;height:100%;';

      const currentMode = ThemeManager.getMode();

      contentEl.innerHTML = `
        <h2 style="font-size:18px;font-weight:600;margin-bottom:20px;color:var(--text-primary);">Settings</h2>

        <div class="settings-section">
          <h3 style="font-size:14px;font-weight:500;color:var(--text-secondary);margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">Appearance</h3>

          <div class="settings-row" style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
            <div>
              <div style="font-size:14px;color:var(--text-primary);">Theme Mode</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Switch between dark and light</div>
            </div>
            <select class="settings-theme" style="padding:6px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:13px;">
              <option value="dark" ${currentMode === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="light" ${currentMode === 'light' ? 'selected' : ''}>Light</option>
            </select>
          </div>

          <div class="settings-row" style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
            <div>
              <div style="font-size:14px;color:var(--text-primary);">Wallpaper</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Choose a desktop background</div>
            </div>
            <select class="settings-wallpaper" style="padding:6px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:13px;">
              <option value="default">Default Gradient</option>
              <option value="midnight">Midnight</option>
              <option value="ocean">Ocean</option>
              <option value="forest">Forest</option>
              <option value="sunset">Sunset</option>
            </select>
          </div>
        </div>

        <div class="settings-section" style="margin-top:24px;">
          <h3 style="font-size:14px;font-weight:500;color:var(--text-secondary);margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">System</h3>

          <div class="settings-row" style="padding:12px 0;border-bottom:1px solid var(--border);">
            <div style="font-size:14px;color:var(--text-primary);margin-bottom:8px;">System Information</div>
            <div class="settings-sysinfo" style="font-size:12px;color:var(--text-muted);font-family:var(--font-mono);">Loading...</div>
          </div>

          <div class="settings-row" style="padding:12px 0;border-bottom:1px solid var(--border);">
            <div style="font-size:14px;color:var(--text-primary);margin-bottom:8px;">Storage</div>
            <button class="settings-clear-storage app-btn" style="font-size:12px;">Clear Local Storage</button>
          </div>
        </div>

        <div style="margin-top:24px;text-align:center;color:var(--text-muted);font-size:12px;">
          iPhone Desktop v1.0
        </div>
      `;

      const themeSelect = contentEl.querySelector('.settings-theme');
      const wallpaperSelect = contentEl.querySelector('.settings-wallpaper');
      const sysinfoEl = contentEl.querySelector('.settings-sysinfo');
      const clearBtn = contentEl.querySelector('.settings-clear-storage');

      themeSelect.addEventListener('change', () => {
        ThemeManager.setMode(themeSelect.value);
        DesktopAPI.updateSettings({ theme: { mode: themeSelect.value } }).catch(() => {});
      });

      const wallpapers = {
        default: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%)',
        midnight: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
        ocean: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 40%, #0284c7 70%, #0ea5e9 100%)',
        forest: 'linear-gradient(135deg, #052e16 0%, #065f46 40%, #047857 70%, #059669 100%)',
        sunset: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 30%, #ea580c 60%, #f97316 100%)',
      };

      wallpaperSelect.addEventListener('change', () => {
        const wp = wallpaperSelect.value;
        document.getElementById('wallpaper').style.background = wallpapers[wp] || wallpapers.default;
        DesktopStorage.set('wallpaper', wp);
        DesktopAPI.updateSettings({ theme: { wallpaper: wp } }).catch(() => {});
      });

      // Restore saved wallpaper
      const savedWp = DesktopStorage.get('wallpaper', 'default');
      wallpaperSelect.value = savedWp;
      if (wallpapers[savedWp]) {
        document.getElementById('wallpaper').style.background = wallpapers[savedWp];
      }

      clearBtn.addEventListener('click', () => {
        if (confirm('Clear all local storage data?')) {
          DesktopStorage.clear();
          location.reload();
        }
      });

      // Load system info
      DesktopAPI.getSystemInfo().then(info => {
        sysinfoEl.textContent = [
          `Platform: ${info.platform}`,
          `Node: ${info.nodeVersion}`,
          `Memory: ${(info.memoryUsage / 1024 / 1024).toFixed(1)} MB`,
          `Uptime: ${info.uptime}s`,
        ].join('\n');
        sysinfoEl.style.whiteSpace = 'pre-wrap';
      }).catch(() => {
        sysinfoEl.textContent = 'Unable to load system info';
      });

      // Stop keyboard shortcuts in selects
      contentEl.querySelectorAll('select').forEach(s => {
        s.addEventListener('keydown', (e) => e.stopPropagation());
      });
    },

    destroy() {},
  });
})();
