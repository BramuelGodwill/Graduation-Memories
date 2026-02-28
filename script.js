/**
 * GRADUATION MEMORIES — script.js (Supabase Edition)
 * ─────────────────────────────────────────────────────────────
 * SETUP: paste your Supabase URL and anon key below, run the SQL,
 * upload to GitHub, deploy on Netlify.
 */

// ══════════════════════════════════════════════════════════════
//  PASTE YOUR SUPABASE VALUES HERE
// ══════════════════════════════════════════════════════════════
<<<<<<< HEAD
const SUPABASE_URL = 'PASTE_YOUR_SUPABASE_URL_HERE';
const SUPABASE_KEY = 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE';
=======
const SUPABASE_URL = 'https://pbmqrevpuqatlakjhplw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibXFyZXZwdXFhdGxha2pocGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwOTA1NDAsImV4cCI6MjA4NzY2NjU0MH0.WvGP9NMFU7b6EKe27F4IAgTXS0bL0pT8HYGQFAJW6aA';
>>>>>>> 4f182a4e62b02dd9780f8e5f941ce1ffd2619a19
// ══════════════════════════════════════════════════════════════

// ── UTILS (at top — needed before anything else runs) ──────────
function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 9); }

function today() { return new Date().toISOString().split('T')[0]; }

function escapeHtml(s) { return s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

function formatDate(d) { return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No date'; }

function formatDateLong(d) { return d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''; }

// ── SUPABASE CLIENT ────────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CONSTANTS ──────────────────────────────────────────────────
const THEME_KEY = 'graduationMemories_theme';
const MY_GALLERY_KEY = 'graduationMemories_myGalleryId';
const CONFETTI_COLORS = ['#D4AF37', '#F0CF6E', '#FFFFFF', '#FFD700', '#C5A028', '#8B7536'];

// ── RESOLVE GALLERY CONTEXT ────────────────────────────────────
// Every visitor gets a unique gallery ID stored in THEIR browser.
// If the URL is  site.com/#gallery/XYZ  → show gallery XYZ.
// If XYZ matches their own ID → they are the owner (can edit/upload/delete).
// If XYZ is someone else's ID → they are a viewer (read only).
function resolveGalleryContext() {
    // Always ensure this visitor has their own ID
    let myId = localStorage.getItem(MY_GALLERY_KEY);
    if (!myId) {
        myId = generateId();
        localStorage.setItem(MY_GALLERY_KEY, myId);
    }

    const hash = window.location.hash;
    if (hash && hash.startsWith('#gallery/')) {
        const viewingId = hash.replace('#gallery/', '').trim();
        return { galleryId: viewingId, myId, isOwner: viewingId === myId };
    }

    // No hash → redirect to own gallery (replace so no dead history entry)
    window.location.replace(window.location.pathname + '#gallery/' + myId);
    return { galleryId: myId, myId, isOwner: true };
}

const { galleryId: GALLERY_ID, myId: MY_ID, isOwner: IS_OWNER } = resolveGalleryContext();

// ── STATE ──────────────────────────────────────────────────────
let photos = [];
let filteredPhotos = [];
let currentLbIndex = -1;
let editPhotoId = null;
let selectedFile = null;

// ── DOM REFS ───────────────────────────────────────────────────
const galleryGrid = document.getElementById('gallery-grid');
const emptyMsg = document.getElementById('empty-msg');
const photoCountNum = document.getElementById('photo-count-num');
const searchInput = document.getElementById('search-input');
const filterDate = document.getElementById('filter-date');
const clearFilterBtn = document.getElementById('clear-filter-btn');
const uploadSection = document.getElementById('upload-section');
const galleryBanner = document.getElementById('gallery-banner');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewWrap = document.getElementById('preview-wrap');
const previewImg = document.getElementById('preview-img');
const changePhotoBtn = document.getElementById('change-photo-btn');
const captionInput = document.getElementById('caption-input');
const dateInput = document.getElementById('date-input');
const nameInput = document.getElementById('name-input');
const uploadBtn = document.getElementById('upload-btn');
const uploadStatus = document.getElementById('upload-status');
const editModal = document.getElementById('edit-modal');
const editCloseBtn = document.getElementById('edit-close-btn');
const editPreview = document.getElementById('edit-preview');
const editCaption = document.getElementById('edit-caption');
const editDate = document.getElementById('edit-date');
const editName = document.getElementById('edit-name');
const editSaveBtn = document.getElementById('edit-save-btn');
const editCancelBtn = document.getElementById('edit-cancel-btn');
const overlay = document.getElementById('overlay');
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbCaption = document.getElementById('lb-caption');
const lbDate = document.getElementById('lb-date');
const lbName = document.getElementById('lb-name');
const lbClose = document.getElementById('lb-close');
const lbPrev = document.getElementById('lb-prev');
const lbNext = document.getElementById('lb-next');
const darkModeBtn = document.getElementById('dark-mode-btn');
const htmlEl = document.documentElement;

// ── INIT ───────────────────────────────────────────────────────
async function init() {
    htmlEl.setAttribute('data-theme', localStorage.getItem(THEME_KEY) || 'dark');
    dateInput.value = today();
    spawnConfetti();
    lucide.createIcons();
    renderBanner();

    // Viewers cannot upload — hide the upload section and nav link
    if (!IS_OWNER) {
        uploadSection.style.display = 'none';
        const uploadNav = document.getElementById('upload-nav-link');
        if (uploadNav) uploadNav.style.display = 'none';
    }

    await loadPhotos();
}

// ── BANNER ─────────────────────────────────────────────────────
function renderBanner() {
    const shareLink = location.origin + location.pathname + '#gallery/' + GALLERY_ID;

    if (IS_OWNER) {
        // Owner: show shareable link with Copy button
        galleryBanner.innerHTML = `
      <div class="banner owner-banner">
        <span>🔗 Your shareable link:</span>
        <input type="text" id="share-link-input" value="${shareLink}" readonly />
        <button class="btn btn-sm btn-primary" id="copy-link-btn">
          <i data-lucide="copy"></i> Copy Link
        </button>
      </div>`;

        document.getElementById('copy-link-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(shareLink).then(() => {
                const btn = document.getElementById('copy-link-btn');
                btn.innerHTML = '<i data-lucide="check"></i> Copied!';
                lucide.createIcons();
                setTimeout(() => {
                    btn.innerHTML = '<i data-lucide="copy"></i> Copy Link';
                    lucide.createIcons();
                }, 2500);
            });
        });

    } else {
        // Viewer: show "Create My Own Gallery" button
        // IMPORTANT: uses window.location.href (not an <a> tag) so the page
        // does a FULL reload at the new URL. This makes resolveGalleryContext()
        // run again with the viewer's own ID, setting IS_OWNER = true.
        const myLink = location.origin + location.pathname + '#gallery/' + MY_ID;

        galleryBanner.innerHTML = `
      <div class="banner viewer-banner">
        <span>👀 You are viewing someone else's gallery — read only.</span>
        <button class="btn btn-sm btn-primary" id="create-gallery-btn">
          <i data-lucide="plus-circle"></i> Create My Own Gallery
        </button>
      </div>`;

        document.getElementById('create-gallery-btn').addEventListener('click', () => {
            // Full page reload to the viewer's own gallery link
            window.location.href = myLink;
        });
    }

    lucide.createIcons();
}

// ── LOAD PHOTOS FROM SUPABASE ──────────────────────────────────
async function loadPhotos() {
    showStatus('Loading…', 'info');
    const { data, error } = await sb
        .from('photos')
        .select('*')
        .eq('gallery_id', GALLERY_ID)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Load error:', error);
        showStatus('Could not load photos. Check your Supabase config.', 'error');
        return;
    }
    photos = data || [];
    uploadStatus.classList.add('hidden');
    renderGallery();
}

// ── UPLOAD IMAGE TO SUPABASE STORAGE ──────────────────────────
async function uploadImage(file) {
    const ext = file.name.split('.').pop();
    const filePath = GALLERY_ID + '/' + Date.now() + '.' + ext;
    const { error } = await sb.storage.from('photos').upload(filePath, file, { upsert: false });
    if (error) throw error;
    const { data } = sb.storage.from('photos').getPublicUrl(filePath);
    return data.publicUrl;
}

// ── INSERT PHOTO ROW INTO SUPABASE ─────────────────────────────
async function insertPhoto(imageUrl, caption, date, name) {
    const { data, error } = await sb.from('photos').insert([{
        gallery_id: GALLERY_ID,
        image_url: imageUrl,
        caption: caption,
        photo_date: date,
        uploader_name: name
    }]).select().single();
    if (error) throw error;
    return data;
}

// ── UPDATE PHOTO ROW ───────────────────────────────────────────
async function updatePhoto(id, caption, date, name) {
    const { error } = await sb.from('photos').update({
        caption,
        photo_date: date,
        uploader_name: name
    }).eq('id', id);
    if (error) throw error;
}

// ── DELETE PHOTO FROM SUPABASE ─────────────────────────────────
async function deletePhotoFromDB(photo) {
    const { error } = await sb.from('photos').delete().eq('id', photo.id);
    if (error) throw error;
    // Also delete image file from Storage
    const filePath = photo.image_url.split('/photos/')[1];
    if (filePath) await sb.storage.from('photos').remove([filePath]);
}

// ── RENDER GALLERY ─────────────────────────────────────────────
function renderGallery() {
    const q = searchInput.value.trim().toLowerCase();
    const dFilt = filterDate.value;
    filteredPhotos = photos.filter(p =>
        (!q || (p.caption || '').toLowerCase().includes(q)) &&
        (!dFilt || p.photo_date === dFilt)
    );
    photoCountNum.textContent = filteredPhotos.length;
    galleryGrid.innerHTML = '';
    if (filteredPhotos.length === 0) { emptyMsg.style.display = 'block'; return; }
    emptyMsg.style.display = 'none';
    filteredPhotos.forEach((photo, i) => galleryGrid.appendChild(buildCard(photo, i)));
    lucide.createIcons();
}

function buildCard(photo, index) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
    <img class="photo-card-img" src="${photo.image_url}" alt="${escapeHtml(photo.caption)}" loading="lazy" />
    <div class="photo-card-body">
      <div class="photo-card-caption">${escapeHtml(photo.caption) || 'Untitled'}</div>
      <div class="photo-card-meta">
        <i data-lucide="calendar"></i>
        <span>${formatDate(photo.photo_date)}</span>
        ${photo.uploader_name ? '<span>· ' + escapeHtml(photo.uploader_name) + '</span>' : ''}
      </div>
    </div>
    ${IS_OWNER ? `
    <div class="photo-card-actions">
      <button class="btn btn-sm btn-outline edit-btn"><i data-lucide="pencil"></i> Edit</button>
      <button class="btn btn-sm btn-danger delete-btn"><i data-lucide="trash-2"></i> Delete</button>
    </div>` : ''}
  `;
  card.querySelector('.photo-card-img').addEventListener('click', () => openLightbox(index));
  card.querySelector('.photo-card-body').addEventListener('click', () => openLightbox(index));
  if (IS_OWNER) {
    card.querySelector('.edit-btn').addEventListener('click', (e) => { e.stopPropagation(); openEditModal(photo.id); });
    card.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); handleDelete(photo); });
  }
  return card;
}

// ── UPLOAD ─────────────────────────────────────────────────────
dropZone.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault(); dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) previewFile(file);
});
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => { if (fileInput.files[0]) previewFile(fileInput.files[0]); });
changePhotoBtn.addEventListener('click', resetUploadForm);

function previewFile(file) {
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    dropZone.classList.add('hidden');
    previewWrap.classList.remove('hidden');
    lucide.createIcons();
  };
  reader.readAsDataURL(file);
}

function resetUploadForm() {
  selectedFile = null; previewImg.src = '';
  previewWrap.classList.add('hidden'); dropZone.classList.remove('hidden');
  captionInput.value = ''; nameInput.value = '';
  dateInput.value = today(); fileInput.value = '';
}

uploadBtn.addEventListener('click', async () => {
  if (!selectedFile) { showStatus('Please select a photo first.', 'error'); return; }
  uploadBtn.disabled = true;
  showStatus('Uploading photo…', 'info');
  try {
    const imageUrl = await uploadImage(selectedFile);
    const newPhoto = await insertPhoto(
      imageUrl,
      captionInput.value.trim() || 'Untitled Memory',
      dateInput.value || today(),
      nameInput.value.trim()
    );
    photos.unshift(newPhoto);
    resetUploadForm();
    showStatus('Memory uploaded! 🎓', 'success');
    renderGallery();
    setTimeout(() => document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' }), 700);
  } catch (err) {
    console.error('Upload error:', err);
    showStatus('Upload failed. Check your Supabase config and SQL setup.', 'error');
  }
  uploadBtn.disabled = false;
});

function showStatus(msg, type) {
  uploadStatus.textContent = msg;
  uploadStatus.className   = 'upload-status ' + type;
  uploadStatus.classList.remove('hidden');
  if (type !== 'info') setTimeout(() => uploadStatus.classList.add('hidden'), 4000);
}

// ── DELETE ─────────────────────────────────────────────────────
async function handleDelete(photo) {
  if (!confirm('Delete this memory? This cannot be undone.')) return;
  try {
    await deletePhotoFromDB(photo);
    photos = photos.filter(p => p.id !== photo.id);
    renderGallery();
  } catch (err) {
    console.error('Delete error:', err);
    alert('Delete failed. Please try again.');
  }
}

// ── EDIT MODAL ─────────────────────────────────────────────────
function openEditModal(id) {
  const photo = photos.find(p => p.id === id);
  if (!photo) return;
  editPhotoId = id;
  editPreview.src   = photo.image_url;
  editCaption.value = photo.caption || '';
  editDate.value    = photo.photo_date || '';
  editName.value    = photo.uploader_name || '';
  showModal(editModal);
}
editSaveBtn.addEventListener('click', async () => {
  const photo   = photos.find(p => p.id === editPhotoId);
  if (!photo) return;
  const caption = editCaption.value.trim() || 'Untitled Memory';
  const date    = editDate.value;
  const name    = editName.value.trim();
  try {
    await updatePhoto(editPhotoId, caption, date, name);
    photo.caption = caption; photo.photo_date = date; photo.uploader_name = name;
    renderGallery();
    closeModal(editModal);
  } catch (err) {
    console.error('Update error:', err);
    alert('Could not save changes. Try again.');
  }
});
editCancelBtn.addEventListener('click', () => closeModal(editModal));
editCloseBtn.addEventListener('click',  () => closeModal(editModal));

// ── LIGHTBOX ───────────────────────────────────────────────────
function openLightbox(i) { currentLbIndex = i; setLb(); lightbox.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeLightbox()  { lightbox.classList.add('hidden'); document.body.style.overflow = ''; }
function setLb() {
  const p = filteredPhotos[currentLbIndex]; if (!p) return;
  lbImg.src = p.image_url; lbImg.alt = p.caption || '';
  lbCaption.textContent = p.caption || 'Untitled';
  lbDate.textContent    = formatDateLong(p.photo_date);
  lbName.textContent    = p.uploader_name ? 'Uploaded by ' + p.uploader_name : '';
}
lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
lbPrev.addEventListener('click', () => { currentLbIndex = (currentLbIndex - 1 + filteredPhotos.length) % filteredPhotos.length; setLb(); });
lbNext.addEventListener('click', () => { currentLbIndex = (currentLbIndex + 1) % filteredPhotos.length; setLb(); });

// ── KEYBOARD ───────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('hidden')) {
    if (e.key === 'ArrowLeft')  lbPrev.click();
    if (e.key === 'ArrowRight') lbNext.click();
    if (e.key === 'Escape')     closeLightbox();
  }
  if (editModal.classList.contains('visible') && e.key === 'Escape') closeModal(editModal);
});

// ── SEARCH & FILTER ────────────────────────────────────────────
searchInput.addEventListener('input', renderGallery);
filterDate.addEventListener('change', renderGallery);
clearFilterBtn.addEventListener('click', () => { filterDate.value = ''; renderGallery(); });

// ── MODAL HELPERS ──────────────────────────────────────────────
function showModal(m)  { m.classList.remove('hidden'); requestAnimationFrame(() => m.classList.add('visible')); overlay.classList.remove('hidden'); lucide.createIcons(); }
function closeModal(m) { m.classList.remove('visible'); setTimeout(() => m.classList.add('hidden'), 260); overlay.classList.add('hidden'); }
overlay.addEventListener('click', () => closeModal(editModal));

// ── DARK MODE ──────────────────────────────────────────────────
darkModeBtn.addEventListener('click', () => {
  const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  htmlEl.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  lucide.createIcons();
});

// ── CONFETTI ───────────────────────────────────────────────────
function spawnConfetti() {
  const w = document.getElementById('confetti-wrapper');
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const sz = 5 + Math.random() * 7;
    el.style.cssText = 'left:' + (Math.random()*100) + '%;width:' + sz + 'px;height:' + sz + 'px;background:' + CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)] + ';border-radius:' + (Math.random()>.5?'50%':'2px') + ';animation-delay:' + (Math.random()*8) + 's;animation-duration:' + (6+Math.random()*8) + 's;';
    w.appendChild(el);
  }
}

// ── SCROLL ─────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('main-header').style.boxShadow = window.scrollY > 60 ? '0 4px 30px rgba(0,0,0,0.5)' : 'none';
}, { passive: true });

// ── BOOT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);