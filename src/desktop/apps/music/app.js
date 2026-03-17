/** Music app — audio player that plays files from server storage. */

(() => {
  let audioEl = null;

  AppRegistry.register({
    id: 'music',
    title: 'Music',
    icon: '🎵',
    category: 'Media',
    defaultSize: { w: 500, h: 400 },
    minSize: { w: 350, h: 250 },
    allowMultiple: false,

    init(contentEl) {
      contentEl.style.cssText = 'display:flex;flex-direction:column;height:100%;';

      contentEl.innerHTML = `
        <div class="app-toolbar">
          <button class="music-upload app-btn">Upload Music</button>
          <input type="file" class="music-upload-input" accept="audio/*" style="display:none;" multiple>
          <span style="flex:1;"></span>
          <span class="music-now-playing" style="font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;"></span>
        </div>
        <div class="music-player" style="padding:16px;display:flex;flex-direction:column;align-items:center;gap:12px;border-bottom:1px solid var(--border);">
          <div class="music-track-name" style="font-size:16px;font-weight:500;color:var(--text-primary);text-align:center;">No track selected</div>
          <audio class="music-audio" style="width:100%;max-width:400px;" controls></audio>
        </div>
        <div class="music-list" style="flex:1;overflow-y:auto;"></div>
      `;

      audioEl = contentEl.querySelector('.music-audio');
      const listEl = contentEl.querySelector('.music-list');
      const trackNameEl = contentEl.querySelector('.music-track-name');
      const nowPlayingEl = contentEl.querySelector('.music-now-playing');
      const uploadBtn = contentEl.querySelector('.music-upload');
      const uploadInput = contentEl.querySelector('.music-upload-input');

      async function loadTracks() {
        try {
          await DesktopAPI.createDir('music');
          const result = await DesktopAPI.listFiles('music');
          listEl.innerHTML = '';

          const audioFiles = result.items.filter(i =>
            i.type === 'file' && /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(i.name)
          );

          if (audioFiles.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><div>No music files</div><div style="font-size:12px;">Upload some audio files to get started</div></div>';
            return;
          }

          const ul = document.createElement('ul');
          ul.className = 'file-list';

          for (const file of audioFiles) {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML = `
              <span class="file-item-icon">🎵</span>
              <div class="file-item-info">
                <div class="file-item-name">${file.name}</div>
                <div class="file-item-meta">${formatSize(file.size)}</div>
              </div>
            `;
            li.addEventListener('click', () => {
              audioEl.src = '/api/v1/files/music/' + encodeURIComponent(file.name);
              audioEl.play().catch(() => {});
              trackNameEl.textContent = file.name;
              nowPlayingEl.textContent = file.name;
              // Highlight current
              ul.querySelectorAll('.file-item').forEach(i => i.style.background = '');
              li.style.background = 'var(--accent-subtle)';
            });
            ul.appendChild(li);
          }

          listEl.appendChild(ul);
        } catch {
          listEl.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>Error loading music</div></div>';
        }
      }

      function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
      }

      uploadBtn.addEventListener('click', () => uploadInput.click());

      uploadInput.addEventListener('change', async () => {
        const files = uploadInput.files;
        if (!files || files.length === 0) return;
        for (const file of files) {
          try {
            const buffer = await file.arrayBuffer();
            await DesktopAPI.writeFile('music/' + file.name, buffer, file.type || 'audio/mpeg');
          } catch (err) {
            console.error('Upload error:', err);
          }
        }
        uploadInput.value = '';
        await loadTracks();
      });

      loadTracks();
    },

    destroy() {
      if (audioEl) {
        audioEl.pause();
        audioEl.src = '';
        audioEl = null;
      }
    },
  });
})();
