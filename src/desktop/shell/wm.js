/** Window Manager — open, close, minimise, maximise, resize, drag, snap, z-index. */

// eslint-disable-next-line no-unused-vars
const WM = (() => {
  const windows = new Map(); // id -> { el, app, state }
  let zCounter = 100;
  let focusedId = null;
  let instanceCounter = 0;
  const windowsContainer = () => document.getElementById('windows');

  /** Get desktop bounds (area above taskbar). */
  function desktopBounds() {
    const tb = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height')) || 48;
    return {
      x: 0, y: 0,
      w: window.innerWidth,
      h: window.innerHeight - tb,
    };
  }

  /** Create a window for an app. */
  function open(app) {
    // Check single instance
    if (!app.allowMultiple) {
      for (const [id, win] of windows) {
        if (win.app.id === app.id) {
          focus(id);
          if (win.state.minimised) unminimise(id);
          return id;
        }
      }
    }

    const id = app.id + '-' + (++instanceCounter);
    const bounds = desktopBounds();

    // Calculate position — cascade from top-left
    const openCount = windows.size;
    const offsetX = 40 + (openCount % 8) * 30;
    const offsetY = 40 + (openCount % 8) * 30;

    const w = Math.min(app.defaultSize.w, bounds.w - 20);
    const h = Math.min(app.defaultSize.h, bounds.h - 20);
    const x = Math.min(offsetX, bounds.w - w - 10);
    const y = Math.min(offsetY, bounds.h - h - 10);

    const state = {
      x, y, w, h,
      minimised: false,
      maximised: false,
      prevBounds: null, // for unmaximise
    };

    const el = createWindowEl(id, app, state);
    windowsContainer().appendChild(el);

    const win = { el, app, state };
    windows.set(id, win);

    // Init the app
    const contentEl = el.querySelector('.window-content');
    if (app.init) {
      try { app.init(contentEl, id); } catch (err) { console.error('App init error:', err); }
    }

    focus(id);
    saveWindowState();
    if (typeof Taskbar !== 'undefined') Taskbar.update();

    return id;
  }

  /** Create the DOM element for a window. */
  function createWindowEl(id, app, state) {
    const el = document.createElement('div');
    el.className = 'window';
    el.dataset.windowId = id;
    el.style.left = state.x + 'px';
    el.style.top = state.y + 'px';
    el.style.width = state.w + 'px';
    el.style.height = state.h + 'px';

    el.innerHTML = `
      <div class="window-titlebar">
        <div class="window-controls">
          <button class="window-ctrl close" data-action="close" title="Close"></button>
          <button class="window-ctrl minimise" data-action="minimise" title="Minimise"></button>
          <button class="window-ctrl maximise" data-action="maximise" title="Maximise"></button>
        </div>
        <span class="window-icon">${app.icon}</span>
        <span class="window-title">${app.title}</span>
      </div>
      <div class="window-content"></div>
      <div class="resize-handle n"></div>
      <div class="resize-handle s"></div>
      <div class="resize-handle e"></div>
      <div class="resize-handle w"></div>
      <div class="resize-handle ne"></div>
      <div class="resize-handle nw"></div>
      <div class="resize-handle se"></div>
      <div class="resize-handle sw"></div>
    `;

    // Titlebar button actions
    el.querySelector('.window-ctrl.close').addEventListener('click', (e) => {
      e.stopPropagation();
      close(id);
    });
    el.querySelector('.window-ctrl.minimise').addEventListener('click', (e) => {
      e.stopPropagation();
      minimise(id);
    });
    el.querySelector('.window-ctrl.maximise').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMaximise(id);
    });

    // Titlebar double-click = maximise toggle
    el.querySelector('.window-titlebar').addEventListener('dblclick', (e) => {
      if (e.target.classList.contains('window-ctrl')) return;
      toggleMaximise(id);
    });

    // Focus on click
    el.addEventListener('mousedown', () => focus(id));
    el.addEventListener('touchstart', () => focus(id), { passive: true });

    // Drag setup
    setupDrag(el, id);

    // Resize setup
    setupResize(el, id);

    return el;
  }

  /** Drag a window by its titlebar. */
  function setupDrag(el, id) {
    const titlebar = el.querySelector('.window-titlebar');
    let dragData = null;

    function onStart(clientX, clientY) {
      const win = windows.get(id);
      if (!win || win.state.maximised) return null;
      focus(id);
      return {
        startX: clientX,
        startY: clientY,
        origX: win.state.x,
        origY: win.state.y,
      };
    }

    function onMove(clientX, clientY) {
      if (!dragData) return;
      const dx = clientX - dragData.startX;
      const dy = clientY - dragData.startY;
      const win = windows.get(id);
      if (!win) return;

      win.state.x = dragData.origX + dx;
      win.state.y = dragData.origY + dy;
      win.el.style.left = win.state.x + 'px';
      win.el.style.top = win.state.y + 'px';

      // Snap preview
      showSnapPreview(clientX, clientY);
    }

    function onEnd(clientX, clientY) {
      hideSnapPreview();
      if (!dragData) return;

      const bounds = desktopBounds();
      const snapZone = 20;

      // Snap to edges
      if (clientX <= snapZone) {
        snapLeft(id);
      } else if (clientX >= bounds.w - snapZone) {
        snapRight(id);
      } else if (clientY <= snapZone) {
        maximise(id);
      }

      dragData = null;
      saveWindowState();
    }

    // Mouse
    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('window-ctrl')) return;
      e.preventDefault();
      dragData = onStart(e.clientX, e.clientY);
      if (!dragData) return;

      function mouseMove(e) { onMove(e.clientX, e.clientY); }
      function mouseUp(e) {
        onEnd(e.clientX, e.clientY);
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', mouseUp);
      }
      document.addEventListener('mousemove', mouseMove);
      document.addEventListener('mouseup', mouseUp);
    });

    // Touch
    titlebar.addEventListener('touchstart', (e) => {
      if (e.target.classList.contains('window-ctrl')) return;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      dragData = onStart(t.clientX, t.clientY);
    }, { passive: true });

    titlebar.addEventListener('touchmove', (e) => {
      if (!dragData || e.touches.length !== 1) return;
      e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: false });

    titlebar.addEventListener('touchend', (e) => {
      if (!dragData) return;
      const t = e.changedTouches[0];
      onEnd(t.clientX, t.clientY);
    });
  }

  /** Resize a window via edge/corner handles. */
  function setupResize(el, id) {
    el.querySelectorAll('.resize-handle').forEach(handle => {
      let resizeData = null;
      const dirs = handle.className.replace('resize-handle ', '').trim();

      function onStart(clientX, clientY) {
        const win = windows.get(id);
        if (!win || win.state.maximised) return null;
        focus(id);
        return {
          startX: clientX, startY: clientY,
          origX: win.state.x, origY: win.state.y,
          origW: win.state.w, origH: win.state.h,
        };
      }

      function onMove(clientX, clientY) {
        if (!resizeData) return;
        const win = windows.get(id);
        if (!win) return;

        const dx = clientX - resizeData.startX;
        const dy = clientY - resizeData.startY;
        const minW = win.app.minSize.w;
        const minH = win.app.minSize.h;

        if (dirs.includes('e')) {
          win.state.w = Math.max(minW, resizeData.origW + dx);
        }
        if (dirs.includes('w')) {
          const newW = Math.max(minW, resizeData.origW - dx);
          win.state.x = resizeData.origX + (resizeData.origW - newW);
          win.state.w = newW;
        }
        if (dirs.includes('s')) {
          win.state.h = Math.max(minH, resizeData.origH + dy);
        }
        if (dirs.includes('n')) {
          const newH = Math.max(minH, resizeData.origH - dy);
          win.state.y = resizeData.origY + (resizeData.origH - newH);
          win.state.h = newH;
        }

        win.el.style.left = win.state.x + 'px';
        win.el.style.top = win.state.y + 'px';
        win.el.style.width = win.state.w + 'px';
        win.el.style.height = win.state.h + 'px';
      }

      function onEnd() {
        resizeData = null;
        saveWindowState();
      }

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resizeData = onStart(e.clientX, e.clientY);
        if (!resizeData) return;

        function mouseMove(e) { onMove(e.clientX, e.clientY); }
        function mouseUp() {
          onEnd();
          document.removeEventListener('mousemove', mouseMove);
          document.removeEventListener('mouseup', mouseUp);
        }
        document.addEventListener('mousemove', mouseMove);
        document.addEventListener('mouseup', mouseUp);
      });

      handle.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        if (e.touches.length !== 1) return;
        const t = e.touches[0];
        resizeData = onStart(t.clientX, t.clientY);
      }, { passive: true });

      handle.addEventListener('touchmove', (e) => {
        if (!resizeData || e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        onMove(t.clientX, t.clientY);
      }, { passive: false });

      handle.addEventListener('touchend', () => onEnd());
    });
  }

  /** Snap preview overlay. */
  let snapPreviewEl = null;
  function getSnapPreview() {
    if (!snapPreviewEl) {
      snapPreviewEl = document.getElementById('snap-preview');
      if (!snapPreviewEl) {
        snapPreviewEl = document.createElement('div');
        snapPreviewEl.id = 'snap-preview';
        document.body.appendChild(snapPreviewEl);
      }
    }
    return snapPreviewEl;
  }

  function showSnapPreview(clientX, clientY) {
    const bounds = desktopBounds();
    const snapZone = 20;
    const preview = getSnapPreview();

    if (clientX <= snapZone) {
      preview.style.display = 'block';
      preview.style.left = '0';
      preview.style.top = '0';
      preview.style.width = (bounds.w / 2) + 'px';
      preview.style.height = bounds.h + 'px';
    } else if (clientX >= bounds.w - snapZone) {
      preview.style.display = 'block';
      preview.style.left = (bounds.w / 2) + 'px';
      preview.style.top = '0';
      preview.style.width = (bounds.w / 2) + 'px';
      preview.style.height = bounds.h + 'px';
    } else if (clientY <= snapZone) {
      preview.style.display = 'block';
      preview.style.left = '0';
      preview.style.top = '0';
      preview.style.width = bounds.w + 'px';
      preview.style.height = bounds.h + 'px';
    } else {
      preview.style.display = 'none';
    }
  }

  function hideSnapPreview() {
    const preview = getSnapPreview();
    preview.style.display = 'none';
  }

  function snapLeft(id) {
    const win = windows.get(id);
    if (!win) return;
    const bounds = desktopBounds();
    win.state.prevBounds = { x: win.state.x, y: win.state.y, w: win.state.w, h: win.state.h };
    win.state.x = 0;
    win.state.y = 0;
    win.state.w = bounds.w / 2;
    win.state.h = bounds.h;
    win.state.maximised = false;
    applyState(id);
    win.el.classList.add('snapped-left');
    win.el.classList.remove('snapped-right', 'maximised');
  }

  function snapRight(id) {
    const win = windows.get(id);
    if (!win) return;
    const bounds = desktopBounds();
    win.state.prevBounds = { x: win.state.x, y: win.state.y, w: win.state.w, h: win.state.h };
    win.state.x = bounds.w / 2;
    win.state.y = 0;
    win.state.w = bounds.w / 2;
    win.state.h = bounds.h;
    win.state.maximised = false;
    applyState(id);
    win.el.classList.add('snapped-right');
    win.el.classList.remove('snapped-left', 'maximised');
  }

  function applyState(id) {
    const win = windows.get(id);
    if (!win) return;
    win.el.style.left = win.state.x + 'px';
    win.el.style.top = win.state.y + 'px';
    win.el.style.width = win.state.w + 'px';
    win.el.style.height = win.state.h + 'px';
  }

  function focus(id) {
    if (focusedId === id) return;
    // Unfocus previous
    if (focusedId) {
      const prev = windows.get(focusedId);
      if (prev) prev.el.classList.remove('focused');
    }
    focusedId = id;
    const win = windows.get(id);
    if (!win) return;
    win.el.classList.add('focused');
    win.el.style.zIndex = String(++zCounter);
    if (typeof Taskbar !== 'undefined') Taskbar.update();
  }

  function close(id) {
    const win = windows.get(id);
    if (!win) return;
    if (win.app.destroy) {
      try { win.app.destroy(id); } catch (err) { console.error('App destroy error:', err); }
    }
    win.el.remove();
    windows.delete(id);
    if (focusedId === id) {
      focusedId = null;
      // Focus the next highest z-index window
      let highestZ = 0;
      let highestId = null;
      for (const [wid, w] of windows) {
        if (!w.state.minimised) {
          const z = parseInt(w.el.style.zIndex) || 0;
          if (z > highestZ) { highestZ = z; highestId = wid; }
        }
      }
      if (highestId) focus(highestId);
    }
    saveWindowState();
    if (typeof Taskbar !== 'undefined') Taskbar.update();
  }

  function minimise(id) {
    const win = windows.get(id);
    if (!win) return;
    win.state.minimised = true;
    win.el.classList.add('minimised');
    if (focusedId === id) {
      focusedId = null;
      // Focus next visible window
      let highestZ = 0;
      let highestId = null;
      for (const [wid, w] of windows) {
        if (!w.state.minimised && wid !== id) {
          const z = parseInt(w.el.style.zIndex) || 0;
          if (z > highestZ) { highestZ = z; highestId = wid; }
        }
      }
      if (highestId) focus(highestId);
    }
    saveWindowState();
    if (typeof Taskbar !== 'undefined') Taskbar.update();
  }

  function unminimise(id) {
    const win = windows.get(id);
    if (!win) return;
    win.state.minimised = false;
    win.el.classList.remove('minimised');
    focus(id);
    saveWindowState();
    if (typeof Taskbar !== 'undefined') Taskbar.update();
  }

  function maximise(id) {
    const win = windows.get(id);
    if (!win) return;
    const bounds = desktopBounds();
    win.state.prevBounds = { x: win.state.x, y: win.state.y, w: win.state.w, h: win.state.h };
    win.state.x = 0;
    win.state.y = 0;
    win.state.w = bounds.w;
    win.state.h = bounds.h;
    win.state.maximised = true;
    win.el.classList.add('maximised');
    win.el.classList.remove('snapped-left', 'snapped-right');
    applyState(id);
    saveWindowState();
  }

  function unmaximise(id) {
    const win = windows.get(id);
    if (!win || !win.state.prevBounds) return;
    win.state.x = win.state.prevBounds.x;
    win.state.y = win.state.prevBounds.y;
    win.state.w = win.state.prevBounds.w;
    win.state.h = win.state.prevBounds.h;
    win.state.maximised = false;
    win.state.prevBounds = null;
    win.el.classList.remove('maximised', 'snapped-left', 'snapped-right');
    applyState(id);
    saveWindowState();
  }

  function toggleMaximise(id) {
    const win = windows.get(id);
    if (!win) return;
    if (win.state.maximised) {
      unmaximise(id);
    } else {
      maximise(id);
    }
  }

  function closeAll() {
    for (const id of [...windows.keys()]) {
      close(id);
    }
  }

  function cycleWindows() {
    const ids = [...windows.keys()].filter(id => !windows.get(id).state.minimised);
    if (ids.length < 2) return;
    const currentIdx = ids.indexOf(focusedId);
    const nextIdx = (currentIdx + 1) % ids.length;
    focus(ids[nextIdx]);
    if (windows.get(ids[nextIdx]).state.minimised) {
      unminimise(ids[nextIdx]);
    }
  }

  function getFocusedId() { return focusedId; }
  function getWindows() { return windows; }

  function getWindowsByApp(appId) {
    const result = [];
    for (const [id, win] of windows) {
      if (win.app.id === appId) result.push({ id, win });
    }
    return result;
  }

  /** Persist window state to localStorage. */
  function saveWindowState() {
    const state = {};
    for (const [id, win] of windows) {
      state[id] = {
        appId: win.app.id,
        x: win.state.x,
        y: win.state.y,
        w: win.state.w,
        h: win.state.h,
        minimised: win.state.minimised,
        maximised: win.state.maximised,
      };
    }
    DesktopStorage.set('window-state', state);
  }

  return {
    open, close, closeAll, focus, minimise, unminimise,
    maximise, unmaximise, toggleMaximise,
    snapLeft, snapRight, cycleWindows,
    getFocusedId, getWindows, getWindowsByApp,
    desktopBounds,
  };
})();
