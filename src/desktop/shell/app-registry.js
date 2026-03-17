/** App Registry — apps register themselves here, launcher and WM consume. */

// eslint-disable-next-line no-unused-vars
const AppRegistry = (() => {
  const apps = new Map();

  function register(appDef) {
    apps.set(appDef.id, appDef);
  }

  function get(id) {
    return apps.get(id) || null;
  }

  function getAll() {
    return [...apps.values()];
  }

  function getByCategory(category) {
    return getAll().filter(a => a.category === category);
  }

  return { register, get, getAll, getByCategory };
})();
