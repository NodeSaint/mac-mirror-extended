/** localStorage wrapper for client-side state. */

// eslint-disable-next-line no-unused-vars
const DesktopStorage = (() => {
  const PREFIX = 'iphone-desktop:';

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // storage full
    }
  }

  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  function clear() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  }

  return { get, set, remove, clear };
})();
