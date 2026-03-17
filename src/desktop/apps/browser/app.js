/** Browser app — iframe-based web browser with URL bar and tabs. */

(() => {
  const tabs = new Map(); // windowId -> [{ url, title, active }]

  AppRegistry.register({
    id: 'browser',
    title: 'Browser',
    icon: '🌐',
    category: 'Productivity',
    defaultSize: { w: 900, h: 600 },
    minSize: { w: 400, h: 300 },
    allowMultiple: true,

    init(contentEl, windowId) {
      tabs.set(windowId, [{ url: 'https://www.google.com', title: 'New Tab', active: true }]);

      contentEl.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;">
          <div class="app-toolbar" style="gap:4px;">
            <button class="browser-back" title="Back" style="font-size:16px;padding:4px 8px;">&#8592;</button>
            <button class="browser-forward" title="Forward" style="font-size:16px;padding:4px 8px;">&#8594;</button>
            <button class="browser-reload" title="Reload" style="font-size:14px;padding:4px 8px;">&#8635;</button>
            <input type="text" class="browser-url" value="https://www.google.com" placeholder="Enter URL..." style="flex:1;">
            <button class="browser-go app-btn-primary" style="padding:4px 12px;">Go</button>
          </div>
          <iframe class="browser-frame" src="about:blank"
            style="flex:1;border:none;width:100%;background:white;"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerpolicy="no-referrer"></iframe>
        </div>
      `;

      const urlInput = contentEl.querySelector('.browser-url');
      const iframe = contentEl.querySelector('.browser-frame');
      const goBtn = contentEl.querySelector('.browser-go');
      const backBtn = contentEl.querySelector('.browser-back');
      const forwardBtn = contentEl.querySelector('.browser-forward');
      const reloadBtn = contentEl.querySelector('.browser-reload');

      function navigate(url) {
        if (!url) return;
        if (!/^https?:\/\//i.test(url)) {
          if (url.includes('.') && !url.includes(' ')) {
            url = 'https://' + url;
          } else {
            url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
          }
        }
        urlInput.value = url;
        iframe.src = url;
      }

      goBtn.addEventListener('click', () => navigate(urlInput.value));
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') navigate(urlInput.value);
      });
      reloadBtn.addEventListener('click', () => { iframe.src = iframe.src; });

      // Back/forward won't work cross-origin but we set them up anyway
      backBtn.addEventListener('click', () => {
        try { iframe.contentWindow.history.back(); } catch {}
      });
      forwardBtn.addEventListener('click', () => {
        try { iframe.contentWindow.history.forward(); } catch {}
      });

      // Load default
      navigate('https://www.google.com');
    },

    destroy(windowId) {
      tabs.delete(windowId);
    },
  });
})();
