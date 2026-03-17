/** WebSocket client with auto-reconnect — pattern from mac-mirror viewer. */

// eslint-disable-next-line no-unused-vars
const DesktopWS = (() => {
  let ws = null;
  let backoff = 1000;
  let reconnectTimer = null;
  const listeners = {};

  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = protocol + '//' + location.host + '/ws';
    ws = new WebSocket(url);

    ws.onopen = () => {
      backoff = 1000;
      emit('open');
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        emit('message', msg);
        if (msg.type) {
          emit(msg.type, msg);
        }
      } catch {
        // ignore non-JSON
      }
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      ws = null;
      emit('close');
      reconnectTimer = setTimeout(() => {
        backoff = Math.min(backoff * 2, 30000);
        connect();
      }, backoff);
    };
  }

  function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  }

  function off(event, fn) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(f => f !== fn);
  }

  function emit(event, data) {
    if (!listeners[event]) return;
    for (const fn of listeners[event]) {
      try { fn(data); } catch (err) { console.error('WS listener error:', err); }
    }
  }

  function destroy() {
    clearTimeout(reconnectTimer);
    if (ws) ws.close();
  }

  return { connect, send, on, off, destroy };
})();
