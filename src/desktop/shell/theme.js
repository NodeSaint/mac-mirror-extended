/** Theme manager — dark/light mode switching via CSS custom properties. */

// eslint-disable-next-line no-unused-vars
const ThemeManager = (() => {
  function getMode() {
    return DesktopStorage.get('theme-mode', 'dark');
  }

  function setMode(mode) {
    DesktopStorage.set('theme-mode', mode);
    apply(mode);
  }

  function toggle() {
    const current = getMode();
    setMode(current === 'dark' ? 'light' : 'dark');
  }

  function apply(mode) {
    if (mode === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }

  function init() {
    apply(getMode());
  }

  return { getMode, setMode, toggle, init };
})();
