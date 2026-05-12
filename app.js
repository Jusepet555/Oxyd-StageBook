const DB_NAME = 'partitures-db-v1';
const DB_VERSION = 1;
const STORE_FILES = 'files';
const STORE_SETS = 'sets';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const state = { files: [], sets: [], currentSetId: null, playQueue: [], playIndex: 0, objectUrl: null, viewerDark: false, dragEventsBound: false, pointerDrag: null, viewerRenderToken: 0, dragScroll: { active: false, speed: 0, raf: null } };

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_FILES)) db.createObjectStore(STORE_FILES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_SETS)) db.createObjectStore(STORE_SETS, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(store, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const result = fn(s);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
  });
}

async function getAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readonly');
    const req = t.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function put(store, item) { return tx(store, 'readwrite', s => s.put(item)); }
async function del(store, id) { return tx(store, 'readwrite', s => s.delete(id)); }

function uid(prefix = 'id') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function fmtBytes(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB']; let size = bytes; let i = 0;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(size < 10 && i ? 1 : 0)} ${units[i]}`;
}
function fileIcon(type, name='') {
  const n = name.toLowerCase();
  if (type?.includes('pdf') || n.endsWith('.pdf')) return '📕';
  if (type?.startsWith('image/')) return '🖼️';
  if (type?.startsWith('text/') || n.endsWith('.txt') || n.endsWith('.md')) return '📄';
  if (n.endsWith('.doc') || n.endsWith('.docx')) return '📝';
  return '🎵';
}
function cleanTitle(name) { return name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim(); }


const PRELOADED_SET_ID = 'set-oxyd-concert';
const FINAL_DATA_VERSION = 'oxyd-final-v10-setlist2026-ordre-concert';
const PRELOADED_FILES = [
  { id: 'preload-oxyd-01', name: '01 - BALADETA 85-90-140bpm.pdf', title: 'BALADETA 85-90-140bpm', type: 'application/pdf', src: 'preloaded/oxyd/01-baladeta-85-90-140bpm.pdf' },
  { id: 'preload-oxyd-02', name: '02 - CENTRALIA 177bpm.pdf', title: 'CENTRALIA 177bpm', type: 'application/pdf', src: 'preloaded/oxyd/02-centralia-177bpm.pdf' },
  { id: 'preload-oxyd-03', name: '03 - CUENTA ATRÁS 187bpm.pdf', title: 'CUENTA ATRÁS 187bpm', type: 'application/pdf', src: 'preloaded/oxyd/03-cuenta-atras-187bpm.pdf' },
  { id: 'preload-oxyd-04', name: '04 - CUERNOS AL CIELO.pdf', title: 'CUERNOS AL CIELO', type: 'application/pdf', src: 'preloaded/oxyd/04-cuernos-al-cielo.pdf' },
  { id: 'preload-oxyd-05', name: '05 - DIME HERMANO 138bpm.pdf', title: 'DIME HERMANO 138bpm', type: 'application/pdf', src: 'preloaded/oxyd/05-dime-hermano-138bpm.pdf' },
  { id: 'preload-oxyd-06', name: '06 - EL BRILLO DEL METAL 149bpm.pdf', title: 'EL BRILLO DEL METAL 149bpm', type: 'application/pdf', src: 'preloaded/oxyd/06-el-brillo-del-metal-149bpm.pdf' },
  { id: 'preload-oxyd-07', name: '07 - HIJOS DE LA MAR 130bpm.pdf', title: 'HIJOS DE LA MAR 130bpm', type: 'application/pdf', src: 'preloaded/oxyd/07-hijos-de-la-mar-130bpm.pdf' },
  { id: 'preload-oxyd-08', name: '08 - LA CANCIÓN DEL PIRATA.pdf', title: 'LA CANCIÓN DEL PIRATA', type: 'application/pdf', src: 'preloaded/oxyd/08-la-cancion-del-pirata.pdf' },
  { id: 'preload-oxyd-09', name: '09 - LLEGO A SU FIN 170bpm.pdf', title: 'LLEGO A SU FIN 170bpm', type: 'application/pdf', src: 'preloaded/oxyd/09-llego-a-su-fin-170bpm.pdf' },
  { id: 'preload-oxyd-10', name: '10 - MAKTUB 167bpm.pdf', title: 'MAKTUB 167bpm', type: 'application/pdf', src: 'preloaded/oxyd/10-maktub-167bpm.pdf' },
  { id: 'preload-oxyd-11', name: '11 - NUNCA SE SABE 160bpm.pdf', title: 'NUNCA SE SABE 160bpm', type: 'application/pdf', src: 'preloaded/oxyd/11-nunca-se-sabe-160bpm.pdf' },
  { id: 'preload-oxyd-12', name: '12 - PANDEMIA 187bpm.pdf', title: 'PANDEMIA 187bpm', type: 'application/pdf', src: 'preloaded/oxyd/12-pandemia-187bpm.pdf' },
  { id: 'preload-oxyd-13', name: '13 - TESTAMENTO 170bpm.pdf', title: 'TESTAMENTO 170bpm', type: 'application/pdf', src: 'preloaded/oxyd/13-testamento-170bpm.pdf' },
  { id: 'preload-oxyd-14', name: '14 - BIENVENIDOS AL VALHALLA 170bpm.pdf', title: 'BIENVENIDOS AL VALHALLA 170bpm', type: 'application/pdf', src: 'preloaded/oxyd/14-bienvenidos-al-valhalla-170bpm.pdf' }
];

async function cleanupFinalVersionData({ forceFinalReset = false } = {}) {
  const sets = await getAll(STORE_SETS);
  for (const set of sets) {
    const name = (set.name || '').toLowerCase().trim();
    const isOldTestSet = name === 'assaig' || name.includes('cornivella') || name.includes('cornudella');
    // En aquesta versió final inicial només volem que quedi la llista base.
    if (isOldTestSet || (forceFinalReset && set.id !== PRELOADED_SET_ID)) {
      await del(STORE_SETS, set.id);
    }
  }

  const files = await getAll(STORE_FILES);
  const preloadedIds = new Set(PRELOADED_FILES.map(f => f.id));
  for (const file of files) {
    const name = (file.name || file.title || '').toLowerCase();
    const isStagebookFile = name.endsWith('.stagebook');
    const isOldBadFile = name.includes('cornivella') || name.includes('cornudella');
    if (isStagebookFile || isOldBadFile || (forceFinalReset && file.preloaded && !preloadedIds.has(file.id))) {
      await del(STORE_FILES, file.id);
    }
  }
}

async function seedPreloadedRepertoire() {
  try {
    const now = Date.now();
    const existingFiles = await getAll(STORE_FILES);
    const existingIds = new Set(existingFiles.map(f => f.id));
    for (const item of PRELOADED_FILES) {
      if (existingIds.has(item.id)) continue;
      const res = await fetch(item.src, { cache: 'force-cache' });
      if (!res.ok) throw new Error(`No s'ha pogut carregar ${item.src}`);
      const blob = await res.blob();
      await put(STORE_FILES, {
        id: item.id,
        name: item.name,
        title: item.title,
        type: item.type,
        size: blob.size,
        blob,
        preloaded: true,
        createdAt: now - (PRELOADED_FILES.length - PRELOADED_FILES.findIndex(x => x.id === item.id))
      });
    }

    const allSets = await getAll(STORE_SETS);
    const existingSet = allSets.find(s => s.id === PRELOADED_SET_ID);
    const orderedIds = [
      'preload-oxyd-02', // CENTRALIA
      'preload-oxyd-05', // DIME HERMANO
      'preload-oxyd-03', // CUENTA ATRÁS
      'preload-oxyd-12', // PANDEMIA
      'preload-oxyd-01', // BALADETA
      'preload-oxyd-14', // BIENVENIDOS AL VALHALLA
      'preload-oxyd-07', // HIJOS DE LA MAR
      'preload-oxyd-13', // TESTAMENTO
      'preload-oxyd-11', // NUNCA SE SABE
      'preload-oxyd-06', // EL BRILLO DEL METAL
      'preload-oxyd-09', // LLEGÓ A SU FIN
      'preload-oxyd-08', // LA CANCIÓN DEL PIRATA
      'preload-oxyd-04', // CUERNOS AL CIELO
      'preload-oxyd-10'  // MAKTUB
    ];
    if (!existingSet) {
      await put(STORE_SETS, {
        id: PRELOADED_SET_ID,
        name: 'Setlist2026',
        items: orderedIds,
        preloaded: true,
        createdAt: now,
        updatedAt: now
      });
    } else {
      existingSet.name = 'Setlist2026';
      existingSet.items = orderedIds;
      existingSet.preloaded = true;
      existingSet.updatedAt = now;
      await put(STORE_SETS, existingSet);
    }

    await cleanupFinalVersionData();
  } catch (err) {
    console.warn('No s’ha pogut precarregar el repertori base.', err);
  }
}

async function refresh() {
  state.files = (await getAll(STORE_FILES)).sort((a,b) => b.createdAt - a.createdAt);
  state.sets = (await getAll(STORE_SETS)).sort((a,b) => b.updatedAt - a.updatedAt);
  renderCounts(); renderLibrary(); renderSets(); renderRecent();
  if (state.currentSetId) renderSetDetail();
}

function renderCounts() {
  $('#libraryCount').textContent = `${state.files.length} arxiu${state.files.length === 1 ? '' : 's'}`;
  $('#setCount').textContent = state.sets.length === 1 ? '1 llista' : `${state.sets.length} llistes`;
}

function renderRecent() {
  const box = $('#recentSets');
  const recent = state.sets.slice(0, 3);
  if (!recent.length) { box.className = 'empty'; box.textContent = 'Encara no has creat cap llista.'; return; }
  box.className = 'list';
  box.innerHTML = recent.map(set => setRowHTML(set)).join('');
}

function setRowHTML(set) {
  return `<article class="set-row" data-set-id="${set.id}">
    <div class="file-icon">📋</div>
    <div class="row-main"><strong>${escapeHTML(set.name)}</strong><small>${set.items.length} cançó${set.items.length === 1 ? '' : 'ns'}</small></div>
    <div class="row-actions"><button class="mini-btn open-set" type="button">Obrir</button></div>
  </article>`;
}

function renderSets() {
  const el = $('#setsList');
  if (!state.sets.length) { el.innerHTML = `<div class="empty">Encara no tens llistes. Prem “Nova” per crear el teu primer repertori.</div>`; return; }
  el.innerHTML = state.sets.map(set => `<article class="set-row" data-set-id="${set.id}">
    <div class="file-icon">📋</div>
    <div class="row-main"><strong>${escapeHTML(set.name)}</strong><small>${set.items.length} cançó${set.items.length === 1 ? '' : 'ns'} · Editada ${new Date(set.updatedAt).toLocaleDateString('ca-ES')}</small></div>
    <div class="row-actions"><button class="mini-btn open-set" type="button">Obrir</button><button class="mini-btn delete-btn delete-set" type="button">Eliminar</button></div>
  </article>`).join('');
}

function renderLibrary() {
  const q = ($('#searchLibrary').value || '').toLowerCase();
  const files = state.files.filter(f => f.name.toLowerCase().includes(q) || (f.title || '').toLowerCase().includes(q));
  const el = $('#libraryList');
  if (!files.length) { el.innerHTML = `<div class="empty">No hi ha cap arxiu que coincideixi amb la cerca.</div>`; return; }
  el.innerHTML = files.map(f => `<article class="file-row" data-file-id="${f.id}">
    <div class="file-icon">${fileIcon(f.type, f.name)}</div>
    <div class="row-main"><strong>${escapeHTML(f.title || cleanTitle(f.name))}</strong><small>${escapeHTML(f.name)} · ${fmtBytes(f.size)}</small></div>
    <div class="row-actions"><button class="mini-btn view-file" type="button">Veure</button><button class="mini-btn delete-btn delete-file" type="button">Eliminar</button></div>
  </article>`).join('');
}

function renderSetDetail() {
  const set = state.sets.find(s => s.id === state.currentSetId);
  if (!set) return;
  $('#setNameInput').value = set.name;
  const list = $('#setItemsList');
  if (!set.items.length) { list.innerHTML = `<div class="empty">Aquesta llista encara està buida. Afegeix cançons de la biblioteca.</div>`; return; }
  list.innerHTML = set.items.map((id, idx) => {
    const f = state.files.find(x => x.id === id);
    if (!f) return `<article class="song-row" data-file-id="${id}"><div class="drag-handle">☰</div><div class="row-main"><strong>Arxiu no trobat</strong><small>Potser s'ha eliminat de la biblioteca</small></div><button class="mini-btn delete-btn remove-from-set" type="button">Treure</button></article>`;
    return `<article class="song-row" draggable="false" data-file-id="${f.id}">
      <div class="drag-handle" title="Arrossega per reordenar" aria-label="Arrossega per reordenar">☰</div>
      <div class="file-icon">${fileIcon(f.type, f.name)}</div>
      <div class="row-main"><strong>${idx + 1}. ${escapeHTML(f.title || cleanTitle(f.name))}</strong><small>${escapeHTML(f.name)}</small></div>
      <div class="row-actions">
        <button class="mini-btn play-one" type="button">Veure</button>
        <div class="move-actions" aria-label="Moure cançó">
          <button class="move-btn move-item" data-move="top" type="button" title="Moure al principi">⤒</button>
          <button class="move-btn move-item" data-move="up" type="button" title="Pujar una posició">↑</button>
          <button class="move-btn move-item" data-move="down" type="button" title="Baixar una posició">↓</button>
          <button class="move-btn move-item" data-move="bottom" type="button" title="Moure al final">⤓</button>
        </div>
        <button class="mini-btn delete-btn remove-from-set" type="button">Treure</button>
      </div>
    </article>`;
  }).join('');
  setupDragSort();
}

function escapeHTML(str='') { return str.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

async function importFiles(fileList) {
  const files = [...fileList];
  for (const file of files) {
    if (file.name.toLowerCase().endsWith('.stagebook')) { alert('Aquest és un fitxer de repertori. Per carregar-lo, usa el botó “Importar repertori”, no “Importar arxius”.'); continue; }
    const rec = { id: uid('file'), name: file.name, title: cleanTitle(file.name), type: file.type || guessMime(file.name), size: file.size, blob: file, createdAt: Date.now() };
    await put(STORE_FILES, rec);
  }
  await refresh();
  showScreen('library');
}
function guessMime(name) {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.txt') || n.endsWith('.md')) return 'text/plain';
  return 'application/octet-stream';
}

async function createSet() {
  const n = state.sets.length + 1;
  const set = { id: uid('set'), name: `Llista ${n}`, items: [], createdAt: Date.now(), updatedAt: Date.now() };
  await put(STORE_SETS, set);
  state.currentSetId = set.id;
  await refresh(); showScreen('set-detail');
}

async function saveCurrentSet(set) { set.updatedAt = Date.now(); await put(STORE_SETS, set); await refresh(); }
function currentSet() { return state.sets.find(s => s.id === state.currentSetId); }

function openAddDialog() {
  renderDialogLibrary();
  $('#addDialog').showModal();
}
function renderDialogLibrary() {
  const set = currentSet();
  const q = ($('#dialogSearch').value || '').toLowerCase();
  const files = state.files.filter(f => f.name.toLowerCase().includes(q) || (f.title || '').toLowerCase().includes(q));
  $('#dialogLibrary').innerHTML = files.length ? files.map(f => `<label class="check-row">
    <input type="checkbox" value="${f.id}" ${set.items.includes(f.id) ? 'checked' : ''} />
    <span><strong>${escapeHTML(f.title || cleanTitle(f.name))}</strong><small>${escapeHTML(f.name)}</small></span>
  </label>`).join('') : `<div class="empty">No tens arxius a la biblioteca.</div>`;
}
async function applyDialogSelection() {
  const set = currentSet(); if (!set) return;
  const checked = $$('#dialogLibrary input:checked').map(i => i.value);
  set.items = checked;
  await saveCurrentSet(set);
}

function showScreen(name) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $(`#screen-${name}`).classList.add('active');
  $$('.bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
  $('.bottom-nav').style.display = name === 'viewer' ? 'none' : 'grid';
  $('.topbar').style.display = ['home','library','sets'].includes(name) ? 'flex' : 'none';
}

function setupDragSort() {
  const list = $('#setItemsList');
  if (!list) return;

  // Important: no fem servir el drag & drop natiu del navegador.
  // En mòbil pot mostrar el “+” verd i intentar obrir Google.
  // Aquest arrossegament és propi de l'app i funciona amb dit, ratolí o llapis.
  list.querySelectorAll('.song-row').forEach(row => {
    row.setAttribute('draggable', 'false');
    row.addEventListener('dragstart', e => e.preventDefault());
    const handle = row.querySelector('.drag-handle');
    if (!handle) return;
    handle.addEventListener('pointerdown', startPointerSort);
  });

  if (!state.dragEventsBound) {
    state.dragEventsBound = true;
    document.addEventListener('pointermove', movePointerSort, { passive: false });
    document.addEventListener('pointerup', endPointerSort, { passive: false });
    document.addEventListener('pointercancel', endPointerSort, { passive: false });
    document.addEventListener('dragstart', e => {
      if (e.target.closest?.('.song-row, .drag-handle')) e.preventDefault();
    });
    document.addEventListener('drop', e => {
      if ($('.song-row.dragging')) e.preventDefault();
    });
  }
}

function startPointerSort(e) {
  if (e.button !== undefined && e.button !== 0) return;
  const row = e.currentTarget.closest('.song-row');
  const list = $('#setItemsList');
  if (!row || !list) return;
  e.preventDefault();
  e.stopPropagation();
  row.classList.add('dragging');
  row.style.touchAction = 'none';
  row.style.userSelect = 'none';
  try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch (_) {}
  state.pointerDrag = {
    row,
    list,
    pointerId: e.pointerId,
    startY: e.clientY,
    lastY: e.clientY,
    moved: false
  };
  document.body.classList.add('sorting-active');
  startAutoScroll();
  updateAutoScroll(e.clientY);
}

function movePointerSort(e) {
  const drag = state.pointerDrag;
  if (!drag || (drag.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
  e.preventDefault();
  drag.lastY = e.clientY;
  if (Math.abs(e.clientY - drag.startY) > 4) drag.moved = true;
  updateAutoScroll(e.clientY);
  const after = getDragAfterElement(drag.list, e.clientY);
  if (!after) drag.list.appendChild(drag.row); else drag.list.insertBefore(drag.row, after);
}

async function endPointerSort(e) {
  const drag = state.pointerDrag;
  if (!drag || (e?.pointerId !== undefined && drag.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
  e?.preventDefault?.();
  drag.row.classList.remove('dragging');
  drag.row.style.touchAction = '';
  drag.row.style.userSelect = '';
  state.pointerDrag = null;
  document.body.classList.remove('sorting-active');
  stopAutoScroll();
  await persistSortFromDOM();
}

function startAutoScroll() {
  state.dragScroll.active = true;
  state.dragScroll.speed = 0;
  tickAutoScroll();
}

function updateAutoScroll(clientY) {
  const zone = Math.max(70, Math.min(140, window.innerHeight * 0.18));
  let speed = 0;
  if (clientY < zone) speed = -Math.ceil((zone - clientY) / 5);
  else if (clientY > window.innerHeight - zone) speed = Math.ceil((clientY - (window.innerHeight - zone)) / 5);
  state.dragScroll.speed = Math.max(-24, Math.min(24, speed));
  document.body.classList.toggle('drag-autoscroll-up', state.dragScroll.speed < 0);
  document.body.classList.toggle('drag-autoscroll-down', state.dragScroll.speed > 0);
}

function tickAutoScroll() {
  if (!state.dragScroll.active) return;
  if (state.pointerDrag) updateAutoScroll(state.pointerDrag.lastY);
  if (state.dragScroll.speed) window.scrollBy(0, state.dragScroll.speed);
  state.dragScroll.raf = requestAnimationFrame(tickAutoScroll);
}

function stopAutoScroll() {
  state.dragScroll.active = false;
  state.dragScroll.speed = 0;
  if (state.dragScroll.raf) cancelAnimationFrame(state.dragScroll.raf);
  state.dragScroll.raf = null;
  document.body.classList.remove('drag-autoscroll-up', 'drag-autoscroll-down');
}
function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('.song-row:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
async function persistSortFromDOM() {
  const set = currentSet(); if (!set) return;
  set.items = $$('#setItemsList .song-row').map(r => r.dataset.fileId);
  await saveCurrentSet(set);
}

async function moveItemInCurrentSet(fileId, direction) {
  const set = currentSet(); if (!set) return;
  const from = set.items.indexOf(fileId);
  if (from < 0) return;
  let to = from;
  if (direction === 'top') to = 0;
  if (direction === 'bottom') to = set.items.length - 1;
  if (direction === 'up') to = Math.max(0, from - 1);
  if (direction === 'down') to = Math.min(set.items.length - 1, from + 1);
  if (to === from) return;
  const [item] = set.items.splice(from, 1);
  set.items.splice(to, 0, item);
  await saveCurrentSet(set);
  requestAnimationFrame(() => {
    const row = $(`#setItemsList .song-row[data-file-id="${CSS.escape(fileId)}"]`);
    row?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
}

async function playFile(fileId, queueIds = [fileId]) {
  state.playQueue = queueIds.map(id => state.files.find(f => f.id === id)).filter(Boolean);
  state.playIndex = Math.max(0, state.playQueue.findIndex(f => f.id === fileId));
  showViewer();
}
function applyViewerMode() {
  const content = $('#viewerContent');
  const btn = $('#viewerReadModeBtn');
  content?.classList.toggle('reader-dark', !!state.viewerDark);
  if (btn) {
    btn.textContent = state.viewerDark ? '☀' : '◐';
    btn.setAttribute('title', state.viewerDark ? 'Tornar al mode normal del visor' : 'Activar el mode fosc del visor');
    btn.setAttribute('aria-label', state.viewerDark ? 'Desactivar el mode fosc del visor' : 'Activar el mode fosc del visor');
  }
}

const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
let pdfJsPromise = null;

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(script => script.src === src);
    if (existing) {
      if (window.pdfjsLib) resolve();
      else existing.addEventListener('load', resolve, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function ensurePdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  if (!pdfJsPromise) {
    pdfJsPromise = loadScriptOnce(PDFJS_URL).then(() => {
      if (!window.pdfjsLib) throw new Error('PDF.js no s’ha carregat');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      return window.pdfjsLib;
    });
  }
  return pdfJsPromise;
}

async function renderPdfCanvas(file, content, token) {
  content.innerHTML = '<div class="pdf-loading">Carregant PDF…</div>';
  try {
    const pdfjsLib = await ensurePdfJs();
    if (token !== state.viewerRenderToken) return;
    const data = await file.blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    if (token !== state.viewerRenderToken) return;

    content.innerHTML = '<div class="pdf-pages" id="pdfPages"></div>';
    const pagesEl = $('#pdfPages');
    const availableWidth = Math.max(320, content.clientWidth - 22);

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      if (token !== state.viewerRenderToken) return;
      const page = await pdf.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(Math.max(availableWidth / baseViewport.width, 0.75), 2.4);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.className = 'pdf-page-canvas';
      canvas.setAttribute('aria-label', `Pàgina ${pageNum} de ${pdf.numPages}`);

      const wrap = document.createElement('div');
      wrap.className = 'pdf-page-wrap';
      wrap.appendChild(canvas);
      pagesEl.appendChild(wrap);

      await page.render({ canvasContext: ctx, viewport }).promise;
    }
  } catch (err) {
    console.warn('PDF.js no ha pogut renderitzar el PDF. Es fa servir el visor del navegador.', err);
    if (token !== state.viewerRenderToken) return;
    content.innerHTML = `
      <div class="pdf-fallback">
        <h2>No s’ha pogut carregar el visor intern</h2>
        <p>Aquest dispositiu pot necessitar obrir el PDF amb el visor del sistema.</p>
        <a href="${state.objectUrl}" target="_blank" rel="noopener">Obrir PDF</a>
      </div>
      <iframe src="${state.objectUrl}#toolbar=0&navpanes=0&view=FitH" title="${escapeHTML(file.name)}"></iframe>`;
  }
}

async function showViewer() {
  const file = state.playQueue[state.playIndex]; if (!file) return;
  const token = ++state.viewerRenderToken;
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state.objectUrl = URL.createObjectURL(file.blob);
  $('#viewerTitle').textContent = file.title || cleanTitle(file.name);
  $('#viewerPosition').textContent = `${state.playIndex + 1} / ${state.playQueue.length}`;
  const content = $('#viewerContent');
  const type = file.type || guessMime(file.name);

  if (type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
    content.innerHTML = '<div class="pdf-loading">Carregant PDF…</div>';
    applyViewerMode();
    showScreen('viewer');
    await renderPdfCanvas(file, content, token);
  } else if (type.startsWith('image/')) {
    content.innerHTML = `<img src="${state.objectUrl}" alt="${escapeHTML(file.name)}" />`;
    applyViewerMode();
    showScreen('viewer');
  } else if (type.startsWith('text/') || file.name.toLowerCase().match(/\.(txt|md)$/)) {
    const txt = await file.blob.text();
    if (token !== state.viewerRenderToken) return;
    content.innerHTML = `<article class="text-view">${escapeHTML(txt)}</article>`;
    applyViewerMode();
    showScreen('viewer');
  } else {
    content.innerHTML = `<div class="unsupported"><h2>Vista no disponible</h2><p>Aquest arxiu s'ha importat, però el navegador no pot visualitzar directament aquest format. Per a ús d'escenari és millor exportar-lo a PDF, imatge o text pla.</p></div>`;
    applyViewerMode();
    showScreen('viewer');
  }
}
function nextSong(delta) {
  if (!state.playQueue.length) return;
  state.playIndex = Math.min(Math.max(state.playIndex + delta, 0), state.playQueue.length - 1);
  showViewer();
}


function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataURLToBlob(dataUrl) {
  const parts = String(dataUrl || '').split(',');
  if (parts.length < 2) throw new Error('Format d’arxiu intern no vàlid.');
  const header = parts[0];
  const base64 = parts.slice(1).join(',');
  const mimeMatch = header.match(/data:(.*?);base64/i);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function safeFileName(name) {
  return (name || 'repertori')
    .replace(/[^a-z0-9À-ÿ]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'repertori';
}


function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1500);
}

async function exportSet(set) {
  const exportBtn = $('#shareSetBtn');
  const oldText = exportBtn?.textContent;
  if (exportBtn) { exportBtn.disabled = true; exportBtn.textContent = 'Preparant...'; }
  const orderedFiles = set.items.map(id => state.files.find(f => f.id === id)).filter(Boolean);
  if (!orderedFiles.length) {
    if (exportBtn) { exportBtn.disabled = false; exportBtn.textContent = oldText || 'Exportar repertori'; }
    alert('Aquesta llista encara no té cap arxiu per exportar.');
    return;
  }

  const exportedFiles = [];
  for (const f of orderedFiles) {
    if (!f.blob) {
      if (exportBtn) { exportBtn.disabled = false; exportBtn.textContent = oldText || 'Exportar repertori'; }
      alert(`No puc exportar “${f.name}” perquè aquest arxiu no està guardat correctament dins la biblioteca. Torna'l a importar i prova-ho de nou.`);
      return;
    }
    exportedFiles.push({
      originalId: f.id,
      name: f.name,
      title: f.title || cleanTitle(f.name),
      type: f.type || guessMime(f.name),
      size: f.size || f.blob?.size || 0,
      dataUrl: await blobToDataURL(f.blob)
    });
  }

  const payload = {
    app: 'Öxyd StageBook',
    type: 'stagebook-set',
    version: 2,
    exportedAt: new Date().toISOString(),
    set: {
      name: set.name,
      itemCount: exportedFiles.length,
      items: exportedFiles
    }
  };

  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const filename = `${safeFileName(set.name)}.stagebook`;
  let shared = false;

  try {
    const file = new File([blob], filename, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: set.name,
        text: 'Repertori complet Öxyd StageBook amb arxius inclosos.',
        files: [file]
      });
      shared = true;
    }
  } catch (err) {
    // Si compartir falla o el navegador no ho suporta, fem descàrrega normal.
    shared = false;
  }

  if (!shared) downloadBlob(blob, filename);
  if (exportBtn) { exportBtn.disabled = false; exportBtn.textContent = oldText || 'Exportar repertori'; }
  alert(`Repertori exportat: ${filename}. Si no el veus, mira la carpeta de Baixades/Descàrregues del navegador.`);
}


async function importSetJson(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (err) {
    alert('No s’ha pogut llegir aquest repertori. Comprova que sigui un fitxer .stagebook o .json vàlid.');
    return;
  }

  const rawItems = data?.set?.items || [];
  const importedIds = [];
  let embeddedCount = 0;
  let missingCount = 0;

  for (const item of rawItems) {
    if (item?.dataUrl) {
      const blob = dataURLToBlob(item.dataUrl);
      const size = item.size || blob.size || 0;
      const existing = state.files.find(f => f.name === item.name && (f.size || f.blob?.size || 0) === size);
      if (existing) {
        importedIds.push(existing.id);
      } else {
        const importedFile = {
          id: uid('file'),
          name: item.name || `${item.title || 'arxiu'}`,
          title: item.title || cleanTitle(item.name || 'arxiu'),
          type: item.type || blob.type || guessMime(item.name || ''),
          size,
          blob,
          createdAt: Date.now()
        };
        await put(STORE_FILES, importedFile);
        importedIds.push(importedFile.id);
        embeddedCount++;
      }
    } else if (item?.name) {
      const matched = state.files.find(f => f.name === item.name);
      if (matched) importedIds.push(matched.id);
      else missingCount++;
    }
  }

  if (!importedIds.length) {
    alert('No s’ha pogut importar cap arxiu del repertori. Potser és una llista antiga sense els PDFs inclosos.');
    return;
  }

  const baseName = data?.set?.name || data?.name || file.name.replace(/\.(stagebook|json)$/i, '') || 'Repertori importat';
  const set = {
    id: uid('set'),
    name: `${baseName} (importat)`,
    items: importedIds,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await put(STORE_SETS, set);
  state.currentSetId = set.id;
  await refresh();
  showScreen('set-detail');

  if (data?.version >= 2 || rawItems.some(i => i?.dataUrl)) {
    alert(`Repertori importat correctament: ${importedIds.length} cançó/ns. Arxius nous afegits a la biblioteca: ${embeddedCount}.`);
  } else if (missingCount) {
    alert(`Llista importada, però ${missingCount} arxiu/s no s’han trobat a la biblioteca. Aquesta sembla una exportació antiga sense arxius inclosos.`);
  } else {
    alert('Llista importada correctament.');
  }
}


function bind() {
  $('#themeToggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; localStorage.setItem('theme', next); $('#themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
  });
  $$('.bottom-nav button, [data-nav]').forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.nav)));
  $('#fileInput').addEventListener('change', e => importFiles(e.target.files));
  $('#fileInputLibrary').addEventListener('change', e => importFiles(e.target.files));
  $('#searchLibrary').addEventListener('input', renderLibrary);
  $('#newSetBtn').addEventListener('click', createSet);
  $('#importSetBtn').addEventListener('click', () => $('#importSetInput').click());
  $('#importSetInput').addEventListener('change', e => e.target.files[0] && importSetJson(e.target.files[0]));

  document.body.addEventListener('click', async e => {
    const setRow = e.target.closest('[data-set-id]');
    const fileRow = e.target.closest('[data-file-id]');
    if (e.target.classList.contains('open-set') && setRow) { state.currentSetId = setRow.dataset.setId; renderSetDetail(); showScreen('set-detail'); }
    if (e.target.classList.contains('delete-set') && setRow && confirm('Vols eliminar aquesta llista?')) { await del(STORE_SETS, setRow.dataset.setId); await refresh(); }
    if (e.target.classList.contains('view-file') && fileRow) playFile(fileRow.dataset.fileId);
    if (e.target.classList.contains('delete-file') && fileRow && confirm('Vols eliminar aquest arxiu de la biblioteca? També desapareixerà de les llistes.')) {
      const id = fileRow.dataset.fileId; await del(STORE_FILES, id);
      for (const set of state.sets) { if (set.items.includes(id)) { set.items = set.items.filter(x => x !== id); await put(STORE_SETS, set); } }
      await refresh();
    }
    if (e.target.classList.contains('play-one') && fileRow) { const set = currentSet(); playFile(fileRow.dataset.fileId, set.items); }
    if (e.target.classList.contains('move-item') && fileRow) { await moveItemInCurrentSet(fileRow.dataset.fileId, e.target.dataset.move); }
    if (e.target.classList.contains('remove-from-set') && fileRow) { const set = currentSet(); set.items = set.items.filter(id => id !== fileRow.dataset.fileId); await saveCurrentSet(set); }
  });

  $('#saveSetNameBtn').addEventListener('click', async () => { const set = currentSet(); set.name = $('#setNameInput').value.trim() || 'Llista sense nom'; await saveCurrentSet(set); });
  $('#addToSetBtn').addEventListener('click', openAddDialog);
  $('#dialogSearch').addEventListener('input', renderDialogLibrary);
  $('#dialogDoneBtn').addEventListener('click', applyDialogSelection);
  $('#playSetBtn').addEventListener('click', () => { const set = currentSet(); if (set.items.length) playFile(set.items[0], set.items); else alert('Aquesta llista encara està buida.'); });
  $('#shareSetBtn').addEventListener('click', async () => {
    const set = currentSet();
    if (!set) return;
    try {
      await exportSet(set);
    } catch (err) {
      const exportBtn = $('#shareSetBtn');
      if (exportBtn) { exportBtn.disabled = false; exportBtn.textContent = 'Exportar repertori'; }
      console.error(err);
      alert('No s’ha pogut exportar el repertori. Prova de tornar a importar els arxius a la biblioteca i exportar de nou.');
    }
  });
  $('#closeViewerBtn').addEventListener('click', () => { showScreen(state.currentSetId ? 'set-detail' : 'library'); });
  $('#prevBtn').addEventListener('click', () => nextSong(-1));
  $('#nextBtn').addEventListener('click', () => nextSong(1));
  $('#viewerReadModeBtn').addEventListener('click', () => { state.viewerDark = !state.viewerDark; localStorage.setItem('viewerDark', state.viewerDark ? '1' : '0'); applyViewerMode(); });
  $('#viewerFullscreenBtn').addEventListener('click', () => document.documentElement.requestFullscreen?.());
  document.addEventListener('keydown', e => { if ($('#screen-viewer').classList.contains('active')) { if (e.key === 'ArrowRight') nextSong(1); if (e.key === 'ArrowLeft') nextSong(-1); if (e.key === 'Escape') showScreen(state.currentSetId ? 'set-detail' : 'library'); } });
}


async function runFinalDataMigration() {
  const current = localStorage.getItem('oxydDataVersion');
  const mustReset = current !== FINAL_DATA_VERSION;
  if (mustReset) {
    await cleanupFinalVersionData({ forceFinalReset: true });
    localStorage.setItem('oxydDataVersion', FINAL_DATA_VERSION);
  } else {
    await cleanupFinalVersionData();
  }
}

async function init() {
  const theme = localStorage.getItem('theme') || 'dark'; document.documentElement.dataset.theme = theme; $('#themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  state.viewerDark = localStorage.getItem('viewerDark') === '1';
  bind();
  applyViewerMode();
  await runFinalDataMigration();
  await seedPreloadedRepertoire();
  await refresh();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
}
init();
