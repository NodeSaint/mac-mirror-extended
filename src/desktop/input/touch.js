/** Touch input fallback — tap, long-press for context menu. */

(() => {
  let longPressTimer = null;
  const LONG_PRESS_MS = 600;

  document.getElementById('desktop').addEventListener('touchstart', (e) => {
    // Long press = context menu
    if (e.touches.length === 1) {
      const t = e.touches[0];
      longPressTimer = setTimeout(() => {
        const ctx = document.getElementById('context-menu');
        if (!ctx) return;

        const windowEl = t.target.closest('.window');
        if (windowEl) {
          ctx.dataset.targetWindow = windowEl.dataset.windowId;
        } else {
          delete ctx.dataset.targetWindow;
        }

        ctx.style.left = Math.min(t.clientX, window.innerWidth - 200) + 'px';
        ctx.style.top = Math.min(t.clientY, window.innerHeight - 200) + 'px';
        ctx.classList.remove('hidden');
      }, LONG_PRESS_MS);
    }
  }, { passive: true });

  document.getElementById('desktop').addEventListener('touchmove', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }, { passive: true });

  document.getElementById('desktop').addEventListener('touchend', () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }, { passive: true });

  // Close context menu on tap outside
  document.addEventListener('touchstart', (e) => {
    const ctx = document.getElementById('context-menu');
    if (ctx && !ctx.classList.contains('hidden') && !ctx.contains(e.target)) {
      ctx.classList.add('hidden');
    }
  }, { passive: true });
})();
