#!/usr/bin/env node
import http from 'node:http';
import { URL } from 'node:url';
import {
  detectCoverImages,
  mergeNoteForStudio,
  normalizeMetadata,
  readMetadata,
  readNotes,
  readTopics,
  validateMetadata,
  writeMetadata,
} from './metadata-core.mjs';

const HOST = '127.0.0.1';
const PORT = Number(process.env.METADATA_STUDIO_PORT || 4545);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${HOST}:${PORT}`);
    if (req.method === 'GET' && url.pathname === '/') return sendHtml(res, studioHtml());
    if (req.method === 'GET' && url.pathname === '/api/data') return sendJson(res, await loadStudioData());
    if (req.method === 'POST' && url.pathname === '/api/notes') return saveNote(req, res);
    sendText(res, 404, 'Not found');
  } catch (error) {
    sendJson(res, { error: error.stack ?? error.message }, 500);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Metadata studio running locally: http://${HOST}:${PORT}`);
  console.log('Edits are written to src/data/notes-metadata.json. Press Ctrl+C to stop.');
});

async function loadStudioData() {
  const [notes, metadata, topics] = await Promise.all([readNotes(), readMetadata(), readTopics()]);
  const coverEntries = await Promise.all(notes.map(async (note) => [note.slug, await detectCoverImages(note.slug)]));
  const coverBySlug = Object.fromEntries(coverEntries);
  const validation = validateMetadata({ notes, metadata, topics });
  return {
    topics,
    notes: notes.map((note) => mergeNoteForStudio(note, metadata, coverBySlug[note.slug] ?? [])),
    validation,
  };
}

async function saveNote(req, res) {
  const body = await readRequestBody(req);
  const payload = JSON.parse(body || '{}');
  const slug = typeof payload.slug === 'string' ? payload.slug : '';
  if (!slug) return sendJson(res, { error: 'Missing slug.' }, 400);

  const [notes, metadata] = await Promise.all([readNotes(), readMetadata()]);
  const note = notes.find((candidate) => candidate.slug === slug);
  if (!note) return sendJson(res, { error: `No note stub found for slug '${slug}'.` }, 404);

  const nextEntry = normalizeMetadata(slug, payload.metadata ?? {}, note.frontmatter);
  const nextMetadata = { ...metadata, [slug]: nextEntry };
  const changed = await writeMetadata(nextMetadata);
  const data = await loadStudioData();
  sendJson(res, { ok: true, changed, ...data });
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error('Request body too large.'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendHtml(res, html) {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html);
}

function sendText(res, status, text) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
  res.end(text);
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function studioHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Notes Metadata Studio</title>
  <style>
    :root { color-scheme: dark; --bg:#0b0d12; --panel:#131721; --muted:#8f9aae; --text:#edf2ff; --line:#252c3a; --accent:#7dd3fc; --bad:#fb7185; --ok:#86efac; }
    * { box-sizing: border-box; }
    body { margin: 0; font: 15px/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); }
    header { position: sticky; top: 0; z-index: 5; background: rgba(11,13,18,.94); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); padding: 18px 24px; }
    h1 { margin: 0 0 10px; font-size: 24px; }
    .toolbar { display: grid; grid-template-columns: minmax(220px, 1fr) 180px 160px auto; gap: 10px; align-items: end; }
    label { display: grid; gap: 5px; color: var(--muted); font-size: 12px; letter-spacing: .04em; text-transform: uppercase; }
    input, select, textarea, button { border: 1px solid var(--line); border-radius: 10px; background: #0f131c; color: var(--text); padding: 10px 12px; font: inherit; }
    textarea { min-height: 110px; resize: vertical; }
    button { cursor: pointer; background: #172033; }
    button.primary { background: #0c4a6e; border-color: #0369a1; }
    button:disabled { opacity: .6; cursor: wait; }
    main { display: grid; grid-template-columns: 360px 1fr; gap: 18px; padding: 18px 24px 40px; }
    .list { display: grid; gap: 8px; align-content: start; }
    .note-row { text-align: left; border: 1px solid var(--line); background: var(--panel); border-radius: 14px; padding: 12px; }
    .note-row.active { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent) inset; }
    .note-row strong { display: block; }
    .meta { display: flex; flex-wrap: wrap; gap: 6px; color: var(--muted); font-size: 12px; margin-top: 6px; }
    .pill { border: 1px solid var(--line); border-radius: 999px; padding: 2px 7px; }
    .pill.bad { color: var(--bad); border-color: rgba(251,113,133,.45); }
    .pill.ok { color: var(--ok); border-color: rgba(134,239,172,.45); }
    .editor { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 18px; min-height: 70vh; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .full { grid-column: 1 / -1; }
    .checks { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
    .checks label { display: flex; grid-auto-flow: column; align-items: center; gap: 8px; text-transform: none; letter-spacing: 0; font-size: 14px; color: var(--text); }
    .source, .validation { margin-top: 16px; padding: 12px; border: 1px dashed var(--line); border-radius: 12px; color: var(--muted); overflow-wrap: anywhere; }
    .validation strong { color: var(--text); }
    .error { color: var(--bad); }
    .success { color: var(--ok); }
    .cover-preview { max-width: 220px; max-height: 130px; border-radius: 10px; border: 1px solid var(--line); object-fit: cover; }
    @media (max-width: 900px) { main { grid-template-columns: 1fr; } .toolbar { grid-template-columns: 1fr; } .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>Notes Metadata Studio</h1>
    <div class="toolbar">
      <label>Search <input id="search" type="search" placeholder="title or slug" /></label>
      <label>Topic <select id="topicFilter"><option value="">All topics</option></select></label>
      <label>Status <select id="statusFilter"><option value="">All notes</option><option value="review">Needs review</option><option value="hidden">Hidden</option><option value="public">Public</option></select></label>
      <button id="reload">Reload</button>
    </div>
  </header>
  <main>
    <section class="list" id="list"></section>
    <section class="editor" id="editor"><p>Select a note. Fast metadata loops beat Neovim tab archaeology.</p></section>
  </main>
<script>
let state = { notes: [], topics: [], validation: { errors: [], warnings: [] } };
let selectedSlug = '';
let dirty = false;

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

async function load() {
  const res = await fetch('/api/data');
  state = await res.json();
  renderTopicFilter();
  if (!selectedSlug && state.notes[0]) selectedSlug = state.notes[0].slug;
  render();
}

function renderTopicFilter() {
  const select = $('topicFilter');
  const value = select.value;
  select.innerHTML = '<option value="">All topics</option>' + state.topics.map((topic) => '<option value="' + esc(topic.slug) + '">' + esc(topic.title) + '</option>').join('');
  select.value = value;
}

function filteredNotes() {
  const q = $('search').value.trim().toLowerCase();
  const topic = $('topicFilter').value;
  const status = $('statusFilter').value;
  return state.notes.filter((note) => {
    const meta = note.metadata;
    if (q && !((meta.title + ' ' + note.slug).toLowerCase().includes(q))) return false;
    if (topic && meta.topic !== topic) return false;
    if (status === 'review' && !meta.reviewNeeded) return false;
    if (status === 'hidden' && !meta.hidden) return false;
    if (status === 'public' && meta.hidden) return false;
    return true;
  });
}

function render() {
  renderList();
  renderEditor();
}

function renderList() {
  const notes = filteredNotes();
  $('list').innerHTML = notes.map((note) => {
    const meta = note.metadata;
    return '<button class="note-row ' + (note.slug === selectedSlug ? 'active' : '') + '" data-slug="' + esc(note.slug) + '">' +
      '<strong>' + esc(meta.icon ? meta.icon + ' ' : '') + esc(meta.title) + '</strong>' +
      '<span>' + esc(note.slug) + '</span>' +
      '<span class="meta">' +
        '<span class="pill">' + esc(meta.topic || 'no topic') + '</span>' +
        (meta.reviewNeeded ? '<span class="pill bad">review</span>' : '<span class="pill ok">reviewed</span>') +
        (meta.hidden ? '<span class="pill bad">hidden</span>' : '<span class="pill ok">public</span>') +
        (meta.pinned ? '<span class="pill">pinned</span>' : '') +
      '</span>' +
    '</button>';
  }).join('') || '<p class="source">No notes match the current filters.</p>';
  document.querySelectorAll('.note-row').forEach((button) => button.addEventListener('click', () => {
    selectedSlug = button.dataset.slug;
    dirty = false;
    render();
  }));
}

function renderEditor() {
  const note = state.notes.find((candidate) => candidate.slug === selectedSlug);
  if (!note) { $('editor').innerHTML = '<p>No note selected.</p>'; return; }
  const meta = note.metadata;
  const topicOptions = ['<option value="">No topic</option>'].concat(state.topics.map((topic) => '<option value="' + esc(topic.slug) + '" ' + (meta.topic === topic.slug ? 'selected' : '') + '>' + esc(topic.title) + ' (' + esc(topic.slug) + ')</option>')).join('');
  const coverOptions = note.detectedCoverImages.map((url) => '<option value="' + esc(url) + '"></option>').join('');
  $('editor').innerHTML =
    '<h2>' + esc(note.slug) + '</h2>' +
    '<div class="grid">' +
      '<label class="full">Title <input id="title" value="' + esc(meta.title) + '" /></label>' +
      '<label>Topic <select id="topic">' + topicOptions + '</select></label>' +
      '<label>Order <input id="order" type="number" value="' + esc(meta.order) + '" /></label>' +
      '<label class="full">Tags <input id="tags" value="' + esc(meta.tags.join(', ')) + '" placeholder="c, networking, sockets" /></label>' +
      '<label class="full">Summary <textarea id="summary">' + esc(meta.summary) + '</textarea></label>' +
      '<label>Icon <input id="icon" value="' + esc(meta.icon) + '" /></label>' +
      '<label>Cover image <input id="coverImage" list="coverImages" value="' + esc(meta.coverImage) + '" placeholder="/assets/imported/..." /><datalist id="coverImages">' + coverOptions + '</datalist></label>' +
      '<div class="full checks">' +
        '<label><input id="pinned" type="checkbox" ' + (meta.pinned ? 'checked' : '') + ' /> pinned</label>' +
        '<label><input id="hidden" type="checkbox" ' + (meta.hidden ? 'checked' : '') + ' /> hidden</label>' +
        '<label><input id="reviewNeeded" type="checkbox" ' + (meta.reviewNeeded ? 'checked' : '') + ' /> review needed</label>' +
      '</div>' +
      '<div class="full"><button class="primary" id="save">Save metadata</button> <span id="saveStatus"></span></div>' +
    '</div>' +
    (meta.coverImage ? '<p><img class="cover-preview" src="' + esc(meta.coverImage) + '" alt="cover preview" /></p>' : '') +
    '<div class="source"><strong>Importer-owned source</strong><br />type: ' + esc(note.sourceType) + '<br />path: ' + esc(note.sourcePath || 'none') + '<br />file: ' + esc(note.fileName) + '</div>' +
    renderValidation();
  ['title','topic','order','tags','summary','icon','coverImage','pinned','hidden','reviewNeeded'].forEach((id) => $(id).addEventListener('input', () => dirty = true));
  $('save').addEventListener('click', () => save(note.slug));
}

function renderValidation() {
  const errors = state.validation.errors || [];
  const warnings = state.validation.warnings || [];
  if (!errors.length && !warnings.length) return '<div class="validation success"><strong>Validation:</strong> clean.</div>';
  return '<div class="validation"><strong>Validation</strong>' + errors.map((e) => '<div class="error">' + esc(e) + '</div>').join('') + warnings.map((w) => '<div>' + esc(w) + '</div>').join('') + '</div>';
}

async function save(slug) {
  const button = $('save');
  button.disabled = true;
  $('saveStatus').textContent = ' Saving...';
  const metadata = {
    title: $('title').value.trim(),
    topic: $('topic').value,
    tags: $('tags').value.split(',').map((tag) => tag.trim()).filter(Boolean),
    summary: $('summary').value.trim(),
    pinned: $('pinned').checked,
    order: Number($('order').value || 999),
    hidden: $('hidden').checked,
    coverImage: $('coverImage').value.trim(),
    icon: $('icon').value.trim(),
    reviewNeeded: $('reviewNeeded').checked,
  };
  const res = await fetch('/api/notes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug, metadata }) });
  const payload = await res.json();
  if (!res.ok) {
    $('saveStatus').textContent = ' ' + (payload.error || 'Save failed');
    button.disabled = false;
    return;
  }
  state = { notes: payload.notes, topics: payload.topics, validation: payload.validation };
  dirty = false;
  render();
  $('saveStatus') && ($('saveStatus').textContent = payload.changed ? ' Saved.' : ' No changes.');
}

['search','topicFilter','statusFilter'].forEach((id) => $(id).addEventListener('input', renderList));
$('reload').addEventListener('click', load);
load();
</script>
</body>
</html>`;
}
