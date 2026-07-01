import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
export const SITE_ROOT = path.resolve(path.dirname(__filename), '..');
export const NOTES_DIR = path.join(SITE_ROOT, 'src/content/notes');
export const METADATA_PATH = path.join(SITE_ROOT, 'src/data/notes-metadata.json');
export const TOPICS_PATH = path.join(SITE_ROOT, 'src/data/topics.json');
export const ASSET_ROOT = path.join(SITE_ROOT, 'public/assets/imported');

export async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

export async function readMetadata() {
  return readJson(METADATA_PATH, {});
}

export async function writeMetadata(metadata) {
  await fs.mkdir(path.dirname(METADATA_PATH), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(metadata).sort(([a], [b]) => a.localeCompare(b)));
  const next = `${JSON.stringify(sorted, null, 2)}\n`;
  const prev = await readIfExists(METADATA_PATH);
  if (prev === next) return false;
  await fs.writeFile(METADATA_PATH, next, 'utf8');
  return true;
}

export async function readTopics() {
  const raw = await readJson(TOPICS_PATH, []);
  return Array.isArray(raw) ? raw : Object.values(raw);
}

export async function readNotes() {
  await fs.mkdir(NOTES_DIR, { recursive: true });
  const notes = [];
  for (const entry of await fs.readdir(NOTES_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.match(/\.mdx?$/)) continue;
    const filePath = path.join(NOTES_DIR, entry.name);
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = parseMarkdown(raw);
    const slug = parsed.frontmatter.slug || path.basename(entry.name, path.extname(entry.name));
    notes.push({ slug, filePath, fileName: entry.name, raw, ...parsed });
  }
  return notes.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function parseMarkdown(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: {}, body: raw };
  return { frontmatter: parseYamlish(match[1]), body: raw.slice(match[0].length) };
}

export function parseYamlish(text) {
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (const rawLine of text.split('\n')) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;
    const indent = rawLine.match(/^ */)[0].length;
    const line = rawLine.trim();
    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) continue;
    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1).obj;
    const key = match[1];
    const value = match[2] ?? '';
    if (value === '') {
      parent[key] = {};
      stack.push({ indent, obj: parent[key] });
    } else {
      parent[key] = parseScalar(value);
    }
  }
  return root;
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed); } catch { return []; }
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try { return JSON.parse(trimmed); } catch { return trimmed.slice(1, -1); }
  }
  return trimmed;
}

export function mergeNoteForStudio(note, metadata, assetOptions = []) {
  const entry = metadata[note.slug] ?? {};
  const title = string(entry.title) || string(note.frontmatter.title) || titleFromSlug(note.slug);
  return {
    slug: note.slug,
    fileName: note.fileName,
    sourceType: note.frontmatter.sourceType ?? 'markdown',
    sourcePath: note.frontmatter.sourcePath ?? '',
    generated: note.frontmatter.generated ?? null,
    detectedCoverImages: assetOptions,
    metadata: normalizeMetadata(note.slug, entry, note.frontmatter, title),
  };
}

export function normalizeMetadata(slug, entry = {}, fallback = {}, titleFallback = '') {
  const title = string(entry.title) || string(fallback.title) || titleFallback || titleFromSlug(slug);
  return {
    title,
    topic: string(entry.topic ?? fallback.topic),
    tags: arrayOfStrings(entry.tags ?? fallback.tags),
    summary: string(entry.summary ?? fallback.summary) || `Notes for ${title}.`,
    pinned: boolean(entry.pinned ?? fallback.pinned, false),
    order: number(entry.order ?? fallback.order, 999),
    hidden: boolean(entry.hidden ?? fallback.hidden, false),
    coverImage: string(entry.coverImage ?? fallback.coverImage),
    icon: string(entry.icon ?? fallback.icon),
    reviewNeeded: boolean(entry.reviewNeeded ?? fallback.reviewNeeded, false),
  };
}

export function validateMetadata({ notes, metadata, topics }) {
  const errors = [];
  const warnings = [];
  const noteSlugs = new Set(notes.map((note) => note.slug));
  const topicSlugs = new Set(topics.map((topic) => topic.slug));

  for (const note of notes) {
    if (note.frontmatter.slug && note.frontmatter.slug !== path.basename(note.fileName, path.extname(note.fileName))) {
      warnings.push(`${note.fileName}: frontmatter slug '${note.frontmatter.slug}' differs from filename '${path.basename(note.fileName, path.extname(note.fileName))}'.`);
    }
    if (!metadata[note.slug]) errors.push(`${note.slug}: missing metadata entry in src/data/notes-metadata.json.`);
  }

  for (const [slug, entry] of Object.entries(metadata)) {
    if (!noteSlugs.has(slug)) errors.push(`${slug}: metadata key has no matching note stub in src/content/notes/.`);
    if (entry == null || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${slug}: metadata entry must be an object.`);
      continue;
    }
    const hidden = entry.hidden;
    if (typeof hidden !== 'boolean') errors.push(`${slug}: hidden must be a boolean.`);
    if (typeof entry.pinned !== 'boolean') errors.push(`${slug}: pinned must be a boolean.`);
    if (typeof entry.order !== 'number' || !Number.isFinite(entry.order)) errors.push(`${slug}: order must be a number.`);
    if (!Array.isArray(entry.tags) || entry.tags.some((tag) => typeof tag !== 'string')) errors.push(`${slug}: tags must be an array of strings.`);
    if (!entry.title || typeof entry.title !== 'string') errors.push(`${slug}: title must be a non-empty string.`);
    if (!entry.summary || typeof entry.summary !== 'string') warnings.push(`${slug}: summary is empty; safe default will be used publicly.`);
    if (!hidden) {
      if (!entry.topic || typeof entry.topic !== 'string') errors.push(`${slug}: public note must have a topic slug.`);
      else if (!topicSlugs.has(entry.topic)) errors.push(`${slug}: topic '${entry.topic}' does not exist in src/data/topics.json.`);
    } else if (entry.topic && !topicSlugs.has(entry.topic)) {
      warnings.push(`${slug}: hidden note has unknown topic '${entry.topic}'.`);
    }
  }

  for (const topic of topics) {
    if (!topic || typeof topic !== 'object') {
      errors.push('topics.json: every topic must be an object.');
      continue;
    }
    for (const key of ['slug', 'title', 'description']) {
      if (!topic[key] || typeof topic[key] !== 'string') errors.push(`topics.json: topic ${JSON.stringify(topic)} missing string ${key}.`);
    }
    if (typeof topic.order !== 'number' || !Number.isFinite(topic.order)) errors.push(`${topic.slug ?? 'unknown topic'}: topic order must be a number.`);
    if (topic.icon !== undefined && typeof topic.icon !== 'string') errors.push(`${topic.slug ?? 'unknown topic'}: topic icon must be a string.`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

export async function detectCoverImages(slug) {
  const dir = path.join(ASSET_ROOT, slug);
  if (!fsSync.existsSync(dir)) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(entry.name))
    .map((entry) => `/assets/imported/${slug}/${encodeURIComponent(entry.name)}`)
    .sort((a, b) => a.localeCompare(b));
}

export async function readIfExists(filePath) {
  try { return await fs.readFile(filePath, 'utf8'); }
  catch { return null; }
}

export function string(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function arrayOfStrings(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function boolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function number(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function titleFromSlug(slug) {
  return slug.split('-').filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}
