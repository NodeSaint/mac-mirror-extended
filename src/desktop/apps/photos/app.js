/** Photos app — image viewer and gallery. */

(() => {
  AppRegistry.register({
    id: 'photos',
    title: 'Photos',
    icon: '🖼️',
    category: 'Media',
    defaultSize: { w: 700, h: 500 },
    minSize: { w: 400, h: 300 },
    allowMultiple: false,

    init(contentEl) {
      contentEl.style.cssText = 'display:flex;flex-direction:column;height:100%;';

      contentEl.innerHTML = `
        <div class="app-toolbar">
          <button class="photos-back app-btn" style="display:none;">&#8592; Gallery</button>
          <span style="flex:1;"></span>
          <button class="photos-upload app-btn app-btn-primary">Upload Photos</button>
          <input type="file" class="photos-upload-input" accept="image/*" style="display:none;" multiple>
        </div>
        <div class="photos-gallery" style="flex:1;overflow-y:auto;padding:8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;align-content:start;"></div>
        <div class="photos-viewer" style="flex:1;display:none;align-items:center;justify-content:center;background:#000;position:relative;overflow:hidden;">
          <img class="photos-img" style="max-width:100%;max-height:100%;object-fit:contain;">
        </div>
      `;

      const galleryEl = contentEl.querySelector('.photos-gallery');
      const viewerEl = contentEl.querySelector('.photos-viewer');
      const imgEl = contentEl.querySelector('.photos-img');
      const backBtn = contentEl.querySelector('.photos-back');
      const uploadBtn = contentEl.querySelector('.photos-upload');
      const uploadInput = contentEl.querySelector('.photos-upload-input');

      let viewingImage = false;

      async function loadGallery() {
        try {
          await DesktopAPI.createDir('photos');
          const result = await DesktopAPI.listFiles('photos');
          galleryEl.innerHTML = '';

          const imageFiles = result.items.filter(i =>
            i.type === 'file' && /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(i.name)
          );

          if (imageFiles.length === 0) {
            galleryEl.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🖼️</div><div>No photos</div><div style="font-size:12px;">Upload some images to get started</div></div>';
            return;
          }

          for (const file of imageFiles) {
            const thumb = document.createElement('div');
            thumb.style.cssText = 'aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;cursor:pointer;background:var(--bg-tertiary);';
            thumb.innerHTML = `<img src="/api/v1/files/photos/${encodeURIComponent(file.name)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" alt="${file.name}">`;
            thumb.addEventListener('click', () => showImage(file.name));
            galleryEl.appendChild(thumb);
          }
        } catch {
          galleryEl.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">⚠️</div><div>Error loading photos</div></div>';
        }
      }

      function showImage(name) {
        viewingImage = true;
        galleryEl.style.display = 'none';
        viewerEl.style.display = 'flex';
        backBtn.style.display = 'inline-flex';
        imgEl.src = '/api/v1/files/photos/' + encodeURIComponent(name);
      }

      function showGallery() {
        viewingImage = false;
        galleryEl.style.display = 'grid';
        viewerEl.style.display = 'none';
        backBtn.style.display = 'none';
      }

      backBtn.addEventListener('click', showGallery);

      uploadBtn.addEventListener('click', () => uploadInput.click());

      uploadInput.addEventListener('change', async () => {
        const files = uploadInput.files;
        if (!files || files.length === 0) return;
        for (const file of files) {
          try {
            const buffer = await file.arrayBuffer();
            await DesktopAPI.writeFile('photos/' + file.name, buffer, file.type || 'image/png');
          } catch (err) {
            console.error('Upload error:', err);
          }
        }
        uploadInput.value = '';
        await loadGallery();
      });

      loadGallery();
    },

    destroy() {},
  });
})();
