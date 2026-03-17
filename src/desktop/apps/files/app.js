/** Files app — file manager with browse, upload, download. */

(() => {
  AppRegistry.register({
    id: 'files',
    title: 'Files',
    icon: '📁',
    category: 'System',
    defaultSize: { w: 700, h: 500 },
    minSize: { w: 400, h: 300 },
    allowMultiple: false,

    init(contentEl) {
      contentEl.style.cssText = 'display:flex;flex-direction:column;height:100%;';

      contentEl.innerHTML = `
        <div class="app-toolbar">
          <button class="files-up app-btn" title="Go up">&#8593; Up</button>
          <input type="text" class="files-path" value="/" readonly style="flex:1;">
          <button class="files-newdir app-btn">New Folder</button>
          <button class="files-upload app-btn app-btn-primary">Upload</button>
          <input type="file" class="files-upload-input" style="display:none;" multiple>
        </div>
        <div class="files-list" style="flex:1;overflow-y:auto;"></div>
      `;

      let currentPath = '';

      const listEl = contentEl.querySelector('.files-list');
      const pathInput = contentEl.querySelector('.files-path');
      const upBtn = contentEl.querySelector('.files-up');
      const newDirBtn = contentEl.querySelector('.files-newdir');
      const uploadBtn = contentEl.querySelector('.files-upload');
      const uploadInput = contentEl.querySelector('.files-upload-input');

      function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
      }

      function formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      async function loadDir(path) {
        currentPath = path;
        pathInput.value = '/' + (path || '');

        try {
          const result = await DesktopAPI.listFiles(path);
          listEl.innerHTML = '';

          if (result.items.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📂</div><div>Empty directory</div></div>';
            return;
          }

          const ul = document.createElement('ul');
          ul.className = 'file-list';

          for (const item of result.items) {
            const li = document.createElement('li');
            li.className = 'file-item';

            const icon = item.type === 'directory' ? '📁' : fileIcon(item.name);
            const meta = item.type === 'file'
              ? `${formatSize(item.size)} · ${formatDate(item.modified)}`
              : formatDate(item.modified);

            li.innerHTML = `
              <span class="file-item-icon">${icon}</span>
              <div class="file-item-info">
                <div class="file-item-name">${item.name}</div>
                <div class="file-item-meta">${meta}</div>
              </div>
            `;

            if (item.type === 'directory') {
              li.addEventListener('click', () => loadDir(joinPath(path, item.name)));
            } else {
              li.addEventListener('click', () => {
                // Download file
                const a = document.createElement('a');
                a.href = '/api/v1/files/' + joinPath(path, item.name) + '?download=true';
                a.download = item.name;
                a.click();
              });
            }

            // Right-click to delete
            li.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm('Delete ' + item.name + '?')) {
                DesktopAPI.deleteFile(joinPath(path, item.name))
                  .then(() => loadDir(path))
                  .catch(err => console.error('Delete error:', err));
              }
            });

            ul.appendChild(li);
          }

          listEl.appendChild(ul);
        } catch (err) {
          listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>Error loading: ${err.message}</div></div>`;
        }
      }

      function joinPath(base, name) {
        if (!base) return name;
        return base + '/' + name;
      }

      function fileIcon(name) {
        const ext = name.split('.').pop().toLowerCase();
        const icons = {
          md: '📝', txt: '📄', json: '📋',
          js: '📜', ts: '📜', html: '🌐', css: '🎨',
          png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
          mp3: '🎵', wav: '🎵', ogg: '🎵',
          mp4: '🎬', webm: '🎬',
          pdf: '📕', zip: '📦',
        };
        return icons[ext] || '📄';
      }

      upBtn.addEventListener('click', () => {
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        loadDir(parts.join('/'));
      });

      newDirBtn.addEventListener('click', () => {
        const name = prompt('Directory name:');
        if (name) {
          DesktopAPI.createDir(joinPath(currentPath, name))
            .then(() => loadDir(currentPath))
            .catch(err => console.error('Error:', err));
        }
      });

      uploadBtn.addEventListener('click', () => uploadInput.click());

      uploadInput.addEventListener('change', async () => {
        const files = uploadInput.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
          try {
            const buffer = await file.arrayBuffer();
            await DesktopAPI.writeFile(joinPath(currentPath, file.name), buffer, file.type || 'application/octet-stream');
          } catch (err) {
            console.error('Upload error:', err);
          }
        }
        uploadInput.value = '';
        await loadDir(currentPath);
      });

      loadDir('');
    },

    destroy() {},
  });
})();
