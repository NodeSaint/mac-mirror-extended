/** Mouse/trackpad input — click, right-click, context menu handling. */

(() => {
  // Close context menu on any click
  document.addEventListener('mousedown', (e) => {
    const ctx = document.getElementById('context-menu');
    if (ctx && !ctx.contains(e.target)) {
      ctx.classList.add('hidden');
    }
    // Close launcher on click outside
    if (Launcher.isVisible()) {
      const launcher = document.getElementById('launcher');
      if (!launcher.contains(e.target) && e.target.id !== 'launcher-btn') {
        Launcher.hide();
      }
    }
  });

  // Right-click context menu on desktop
  document.getElementById('desktop').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const ctx = document.getElementById('context-menu');
    if (!ctx) return;

    // Check if right-clicking on a window
    const windowEl = e.target.closest('.window');
    if (windowEl) {
      const windowId = windowEl.dataset.windowId;
      ctx.dataset.targetWindow = windowId;
    } else {
      delete ctx.dataset.targetWindow;
    }

    ctx.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
    ctx.style.top = Math.min(e.clientY, window.innerHeight - 200) + 'px';
    ctx.classList.remove('hidden');
  });

  // Context menu actions
  document.getElementById('context-menu').addEventListener('click', (e) => {
    const item = e.target.closest('.ctx-item');
    if (!item) return;
    const action = item.dataset.action;
    const ctx = document.getElementById('context-menu');
    const targetWindowId = ctx.dataset.targetWindow;
    ctx.classList.add('hidden');

    const targetId = targetWindowId || WM.getFocusedId();

    switch (action) {
      case 'close':
        if (targetId) WM.close(targetId);
        break;
      case 'minimise':
        if (targetId) WM.minimise(targetId);
        break;
      case 'maximise':
        if (targetId) WM.toggleMaximise(targetId);
        break;
      case 'close-all':
        WM.closeAll();
        break;
    }
  });
})();
