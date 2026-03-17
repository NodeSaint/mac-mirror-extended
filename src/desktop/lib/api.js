/** Fetch wrapper for server REST API. */

// eslint-disable-next-line no-unused-vars
const DesktopAPI = (() => {
  const BASE = '/api/v1';

  async function request(method, path, body, contentType) {
    const opts = { method, headers: {} };
    if (body !== undefined) {
      if (contentType) {
        opts.headers['Content-Type'] = contentType;
        opts.body = body;
      } else if (typeof body === 'string' || body instanceof ArrayBuffer || body instanceof Uint8Array) {
        opts.headers['Content-Type'] = 'application/octet-stream';
        opts.body = body;
      } else {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }
    const res = await fetch(BASE + path, opts);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      return json;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  }

  return {
    // Files
    listFiles: (path) => request('GET', '/files/' + (path || '')),
    readFile: (path) => fetch(BASE + '/files/' + path).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r;
    }),
    writeFile: (path, content, contentType) => request('POST', '/files/' + path, content, contentType),
    deleteFile: (path) => request('DELETE', '/files/' + path),
    moveFile: (from, to) => request('PUT', '/files/' + from, { destination: to }),
    createDir: (path) => request('POST', '/files/' + path + '?type=directory'),

    // Apps
    getApps: () => request('GET', '/apps'),
    getApp: (id) => request('GET', '/apps/' + id),

    // Settings
    getSettings: () => request('GET', '/settings'),
    updateSettings: (data) => request('PUT', '/settings', data),

    // Clipboard
    getClipboard: () => request('GET', '/clipboard'),
    setClipboard: (content) => request('POST', '/clipboard', { content }),

    // System
    getSystemInfo: () => request('GET', '/system/info'),
  };
})();
