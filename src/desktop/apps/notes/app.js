/** Notes app — markdown notes editor with file persistence. */

(() => {
  AppRegistry.register({
    id: 'notes',
    title: 'Notes',
    icon: '📝',
    category: 'Productivity',
    defaultSize: { w: 600, h: 400 },
    minSize: { w: 300, h: 200 },
    allowMultiple: false,

    init(contentEl) {
      contentEl.style.cssText = 'display:flex;flex-direction:column;height:100%;';

      contentEl.innerHTML = `
        <div class="app-toolbar">
          <select class="notes-file-select" style="padding:4px 8px;background:var(--bg-primary);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:13px;min-width:150px;">
            <option value="">New Note...</option>
          </select>
          <input type="text" class="notes-filename" placeholder="Filename..." value="untitled.md" style="max-width:180px;">
          <button class="notes-save app-btn app-btn-primary">Save</button>
          <button class="notes-delete app-btn" style="color:var(--danger);">Delete</button>
        </div>
        <textarea class="notes-editor" style="flex:1;width:100%;resize:none;padding:16px;background:var(--bg-surface);color:var(--text-primary);border:none;font-family:var(--font-mono);font-size:14px;line-height:1.6;outline:none;" placeholder="Start typing your note..."></textarea>
      `;

      const editor = contentEl.querySelector('.notes-editor');
      const fileSelect = contentEl.querySelector('.notes-file-select');
      const filenameInput = contentEl.querySelector('.notes-filename');
      const saveBtn = contentEl.querySelector('.notes-save');
      const deleteBtn = contentEl.querySelector('.notes-delete');

      let currentFile = '';

      async function loadFileList() {
        try {
          // Ensure notes directory exists
          await DesktopAPI.createDir('notes');
          const result = await DesktopAPI.listFiles('notes');
          fileSelect.innerHTML = '<option value="">New Note...</option>';
          for (const item of result.items) {
            if (item.type === 'file') {
              const opt = document.createElement('option');
              opt.value = item.name;
              opt.textContent = item.name;
              fileSelect.appendChild(opt);
            }
          }
        } catch {
          // notes dir might not exist yet
        }
      }

      async function loadFile(name) {
        if (!name) {
          editor.value = '';
          filenameInput.value = 'untitled.md';
          currentFile = '';
          return;
        }
        try {
          const resp = await DesktopAPI.readFile('notes/' + name);
          editor.value = await resp.text();
          filenameInput.value = name;
          currentFile = name;
          fileSelect.value = name;
        } catch {
          editor.value = '';
        }
      }

      fileSelect.addEventListener('change', () => loadFile(fileSelect.value));

      saveBtn.addEventListener('click', async () => {
        const name = filenameInput.value.trim();
        if (!name) return;
        try {
          await DesktopAPI.writeFile('notes/' + name, editor.value, 'text/plain');
          currentFile = name;
          await loadFileList();
          fileSelect.value = name;
        } catch (err) {
          console.error('Save error:', err);
        }
      });

      deleteBtn.addEventListener('click', async () => {
        if (!currentFile) return;
        try {
          await DesktopAPI.deleteFile('notes/' + currentFile);
          currentFile = '';
          editor.value = '';
          filenameInput.value = 'untitled.md';
          await loadFileList();
        } catch (err) {
          console.error('Delete error:', err);
        }
      });

      // Allow typing in the editor without triggering keyboard shortcuts
      editor.addEventListener('keydown', (e) => e.stopPropagation());
      filenameInput.addEventListener('keydown', (e) => e.stopPropagation());

      loadFileList();
    },

    destroy() {},
  });
})();
