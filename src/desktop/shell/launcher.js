/** App Launcher — fullscreen overlay grid of installed apps. */

// eslint-disable-next-line no-unused-vars
const Launcher = (() => {
  const launcherEl = () => document.getElementById('launcher');
  const gridEl = () => document.getElementById('launcher-grid');
  const searchEl = () => document.getElementById('launcher-search');
  let visible = false;

  function init() {
    document.getElementById('launcher-btn').addEventListener('click', toggle);

    const search = searchEl();
    if (search) {
      search.addEventListener('input', () => render(search.value.trim().toLowerCase()));
    }
  }

  function toggle() {
    visible = !visible;
    const el = launcherEl();
    if (visible) {
      el.classList.remove('hidden');
      render('');
      const search = searchEl();
      if (search) { search.value = ''; search.focus(); }
    } else {
      el.classList.add('hidden');
    }
  }

  function hide() {
    visible = false;
    launcherEl().classList.add('hidden');
  }

  function show() {
    visible = true;
    launcherEl().classList.remove('hidden');
    render('');
    const search = searchEl();
    if (search) { search.value = ''; search.focus(); }
  }

  function isVisible() { return visible; }

  function render(filter) {
    const grid = gridEl();
    if (!grid) return;
    grid.innerHTML = '';

    if (typeof AppRegistry === 'undefined') return;

    const apps = AppRegistry.getAll();
    const filtered = filter
      ? apps.filter(a => a.title.toLowerCase().includes(filter) || a.id.includes(filter))
      : apps;

    // Group by category
    const categories = {};
    for (const app of filtered) {
      const cat = app.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(app);
    }

    for (const [cat, catApps] of Object.entries(categories)) {
      if (!filter) {
        const label = document.createElement('div');
        label.style.cssText = 'grid-column: 1 / -1; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 8px;';
        label.textContent = cat;
        grid.appendChild(label);
      }

      for (const app of catApps) {
        const btn = document.createElement('button');
        btn.className = 'launcher-app';
        btn.innerHTML = `
          <div class="launcher-app-icon">${app.icon}</div>
          <div class="launcher-app-title">${app.title}</div>
        `;
        btn.addEventListener('click', () => {
          WM.open(app);
          hide();
        });
        grid.appendChild(btn);
      }
    }
  }

  return { init, toggle, hide, show, isVisible };
})();
