/** Physical keyboard capture — shortcuts for window management. */

(() => {
  document.addEventListener('keydown', (e) => {
    const meta = e.metaKey || e.ctrlKey;

    // Cmd+Q / Ctrl+Q — close focused window
    if (meta && e.key === 'q') {
      e.preventDefault();
      const id = WM.getFocusedId();
      if (id) WM.close(id);
      return;
    }

    // Cmd+Tab / Ctrl+Tab — cycle windows
    if (meta && e.key === 'Tab') {
      e.preventDefault();
      WM.cycleWindows();
      return;
    }

    // Cmd+M — minimise
    if (meta && e.key === 'm') {
      e.preventDefault();
      const id = WM.getFocusedId();
      if (id) WM.minimise(id);
      return;
    }

    // Cmd+Space — toggle launcher
    if (meta && e.key === ' ') {
      e.preventDefault();
      Launcher.toggle();
      return;
    }

    // F11 or Cmd+Shift+F — toggle maximise
    if (e.key === 'F11' || (meta && e.shiftKey && e.key === 'f')) {
      e.preventDefault();
      const id = WM.getFocusedId();
      if (id) WM.toggleMaximise(id);
      return;
    }

    // Escape — close launcher if open
    if (e.key === 'Escape') {
      if (Launcher.isVisible()) {
        Launcher.hide();
        return;
      }
    }

    // Cmd+Shift+Left — snap left
    if (meta && e.shiftKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      const id = WM.getFocusedId();
      if (id) WM.snapLeft(id);
      return;
    }

    // Cmd+Shift+Right — snap right
    if (meta && e.shiftKey && e.key === 'ArrowRight') {
      e.preventDefault();
      const id = WM.getFocusedId();
      if (id) WM.snapRight(id);
      return;
    }
  });
})();
