/** Boot sequence — initialises all shell components in order. */

(() => {
  // 1. Theme
  ThemeManager.init();

  // Restore wallpaper
  const savedWp = DesktopStorage.get('wallpaper', 'default');
  const wallpapers = {
    default: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%)',
    midnight: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
    ocean: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 40%, #0284c7 70%, #0ea5e9 100%)',
    forest: 'linear-gradient(135deg, #052e16 0%, #065f46 40%, #047857 70%, #059669 100%)',
    sunset: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 30%, #ea580c 60%, #f97316 100%)',
  };
  if (wallpapers[savedWp]) {
    document.getElementById('wallpaper').style.background = wallpapers[savedWp];
  }

  // 2. WebSocket
  DesktopWS.connect();

  // 3. Taskbar
  Taskbar.init();

  // 4. Launcher
  Launcher.init();

  // 5. Ready
  console.log('iPhone Desktop booted');
})();
