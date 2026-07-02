#!/usr/bin/env node
import childProcess from 'node:child_process';
import crypto from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const SITE_ROOT = path.resolve(path.dirname(__filename), '..');
const args = new Set(process.argv.slice(2));

const options = {
  dryRun: args.has('--dry-run'),
  force: args.has('--force'),
  sourceDir: readArg('--source', 'imports'),
  defaultTopic: readArg('--topic', ''),
};

const IMPORTER = 'notion-html';
const MANIFEST_PATH = path.join(SITE_ROOT, 'imports', '.import-manifest.json');
const EXTRACTED_IMPORTS_DIR = path.join(SITE_ROOT, 'imports', '_extracted');
const NOTES_DIR = path.join(SITE_ROOT, 'src/content/notes');
const HTML_NOTES_DIR = path.join(SITE_ROOT, 'src/content/html-notes');
const ASSET_ROOT = path.join(SITE_ROOT, 'public/assets/imported');
const METADATA_PATH = path.join(SITE_ROOT, 'src/data/notes-metadata.json');
const PROTECTED_FIELDS = ['summary', 'tags', 'pinned', 'order'];
const PRESERVED_FIELDS = ['title', 'topic', ...PROTECTED_FIELDS, 'createdAt'];

const report = {
  added: [],
  updated: [],
  unchanged: [],
  skipped: [],
  warnings: [],
  assetIssues: [],
  metadataCreated: [],
  metadataUpdated: false,
  needsReview: [],
  missingTopic: [],
  hiddenNotes: [],
};

main().catch((error) => {
  console.error(`import:notion failed: ${error.stack ?? error.message}`);
  process.exit(1);
});

function readArg(name, fallback) {
  const prefix = `${name}=`;
  const value = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

async function main() {
  const sourceRoot = path.resolve(SITE_ROOT, options.sourceDir);
  const extractedRoots = await extractZipImports(sourceRoot);
  const [manifest, existingNotes, sourceHtmlFiles, extractedHtmlFileLists, metadata] = await Promise.all([
    readManifest(),
    readExistingNotes(),
    findHtmlFiles(sourceRoot),
    Promise.all(extractedRoots.map((root) => findHtmlFiles(root))),
    readMetadata(),
  ]);
  const htmlFiles = uniquePaths([...sourceHtmlFiles, ...extractedHtmlFileLists.flat()]);
  const nextMetadata = structuredClone(metadata);

  const nextManifest = structuredClone(manifest);
  nextManifest.version = 1;
  nextManifest.importer = IMPORTER;
  nextManifest.updatedAt = manifest.updatedAt ?? null;
  nextManifest.sources ??= {};
  nextManifest.slugs ??= {};

  if (htmlFiles.length === 0) {
    report.warnings.push(`No .html files found under ${path.relative(SITE_ROOT, sourceRoot)}.`);
  }

  for (const sourcePath of htmlFiles) {
    await importHtmlFile({ sourcePath, sourceRoot, manifest, nextManifest, existingNotes, nextMetadata });
  }

  collectMetadataReview(nextMetadata);

  if (!options.dryRun) {
    await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
    await writeJsonIfChanged(MANIFEST_PATH, nextManifest);
    report.metadataUpdated = await writeJsonIfChanged(METADATA_PATH, sortedObject(nextMetadata));
  } else {
    report.metadataUpdated = JSON.stringify(sortedObject(metadata)) !== JSON.stringify(sortedObject(nextMetadata));
  }

  printReport();

  if (report.warnings.length > 0 || report.assetIssues.length > 0) {
    process.exitCode = 0;
  }
}

async function importHtmlFile({ sourcePath, sourceRoot, manifest, nextManifest, existingNotes, nextMetadata }) {
  const sourceRel = toPosix(path.relative(SITE_ROOT, sourcePath));
  const rawHtml = await fs.readFile(sourcePath, 'utf8');
  const sourceHash = sha256(rawHtml);
  const sourceId = extractSourceId(sourcePath, rawHtml, sourceRel);
  const parsed = parseNotionHtml(rawHtml);
  const title = parsed.title || path.basename(sourcePath, path.extname(sourcePath)).replace(/[a-f0-9]{32}/i, '').trim() || 'Untitled';

  const existingSlug = manifest.sources[sourceId]?.slug || findExistingSlugBySource(existingNotes, sourceId, sourceRel);
  const slug = existingSlug || allocateSlug(slugify(title), manifest, nextManifest, existingNotes);
  const notePath = path.join(NOTES_DIR, `${slug}.md`);
  const htmlOutPath = path.join(HTML_NOTES_DIR, `${slug}.html`);
  const assetOutDir = path.join(ASSET_ROOT, slug);
  const old = existingNotes.get(slug);

  if (!existingSlug && existingNotes.has(slug)) {
    const owner = existingNotes.get(slug)?.frontmatter?.generated?.sourceId ?? existingNotes.get(slug)?.frontmatter?.sourcePath ?? 'manual/unknown';
    report.skipped.push(`${sourceRel} -> ${slug}: slug already exists and belongs to ${owner}`);
    return;
  }

  const previous = manifest.sources[sourceId];
  const sourceUnchanged = previous?.sourceHash === sourceHash;
  const currentHtml = await readIfExists(htmlOutPath);
  const normalized = normalizeHtml(parsed.articleHtml, sourcePath, assetOutDir, slug, report.assetIssues);
  const htmlUnchanged = currentHtml === normalized.html;

  const previousAssetHashes = previous?.assets?.map((asset) => `${asset.output}:${asset.hash}`).sort().join('\n') ?? '';
  const nextAssetHashes = normalized.assets.map((asset) => `${asset.output}:${asset.hash}`).sort().join('\n');
  const assetsUnchanged = previousAssetHashes === nextAssetHashes;

  const generatedAt = sourceUnchanged ? (previous?.lastImportedAt || old?.frontmatter?.generated?.importedAt || new Date().toISOString()) : new Date().toISOString();
  const today = generatedAt.slice(0, 10);
  const inferredTopic = inferTopic(title, sourceRel, old?.frontmatter?.topic);
  const frontmatter = buildFrontmatter({
    slug,
    title,
    topic: inferredTopic,
    htmlOutPath,
    sourceRel,
    sourceId,
    sourceHash,
    old,
    today,
    generatedAt,
  });
  const body = old && !options.force ? old.body : fallbackBody(title, sourceRel);
  syncMetadataEntry({ slug, title, topic: inferredTopic, sourceRel, old, nextMetadata, normalized });
  const nextNote = renderMarkdown(frontmatter, body);
  const currentNote = old?.raw ?? await readIfExists(notePath);
  const noteUnchanged = currentNote === nextNote;

  const status = old ? (sourceUnchanged && htmlUnchanged && assetsUnchanged && noteUnchanged ? 'unchanged' : 'updated') : 'added';

  nextManifest.sources[sourceId] = {
    slug,
    title,
    sourceFile: sourceRel,
    sourceHash,
    htmlPath: toPosix(path.relative(SITE_ROOT, htmlOutPath)),
    notePath: toPosix(path.relative(SITE_ROOT, notePath)),
    assets: normalized.assets,
    lastImportedAt: options.dryRun ? previous?.lastImportedAt ?? null : generatedAt,
  };
  nextManifest.slugs[slug] = sourceId;

  const label = `${sourceRel} -> ${slug}`;
  report[status].push(label);
  if (status !== 'unchanged' && !options.dryRun) nextManifest.updatedAt = generatedAt;

  if (options.dryRun || status === 'unchanged') return;

  await fs.mkdir(NOTES_DIR, { recursive: true });
  await fs.mkdir(HTML_NOTES_DIR, { recursive: true });
  await fs.mkdir(assetOutDir, { recursive: true });
  await writeFileIfChanged(notePath, nextNote);
  await writeFileIfChanged(htmlOutPath, normalized.html);
  for (const asset of normalized.assetCopies) {
    await fs.mkdir(path.dirname(asset.to), { recursive: true });
    await fs.copyFile(asset.from, asset.to);
  }
}

function syncMetadataEntry({ slug, title, topic, sourceRel, old, nextMetadata, normalized }) {
  const existing = nextMetadata[slug];
  const coverImage = firstImageAsset(normalized.assets, slug);
  const defaults = {
    title,
    topic,
    tags: defaultTags(title, topic),
    summary: defaultSummary(title),
    pinned: false,
    order: 999,
    hidden: true,
    coverImage,
    icon: '',
    reviewNeeded: true,
  };

  if (!existing) {
    nextMetadata[slug] = old?.frontmatter
      ? {
          title: old.frontmatter.title ?? defaults.title,
          topic: old.frontmatter.topic ?? defaults.topic,
          tags: Array.isArray(old.frontmatter.tags) ? old.frontmatter.tags : defaults.tags,
          summary: old.frontmatter.summary ?? defaults.summary,
          pinned: typeof old.frontmatter.pinned === 'boolean' ? old.frontmatter.pinned : defaults.pinned,
          order: typeof old.frontmatter.order === 'number' ? old.frontmatter.order : defaults.order,
          hidden: typeof old.frontmatter.hidden === 'boolean' ? old.frontmatter.hidden : false,
          coverImage: old.frontmatter.coverImage ?? defaults.coverImage,
          icon: old.frontmatter.icon ?? defaults.icon,
          reviewNeeded: typeof old.frontmatter.reviewNeeded === 'boolean' ? old.frontmatter.reviewNeeded : false,
        }
      : defaults;
    report.metadataCreated.push(`${slug} (${sourceRel})`);
    return;
  }

  if (options.force) {
    nextMetadata[slug] = {
      ...existing,
      title: defaults.title,
      topic: defaults.topic,
      tags: defaults.tags,
      summary: defaults.summary,
      coverImage: existing.coverImage || defaults.coverImage,
      reviewNeeded: true,
    };
  }
}

function firstImageAsset(assets, slug) {
  const asset = assets.find((item) => /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(item.output));
  if (!asset) return '';
  return `/assets/imported/${slug}/${encodePathSegment(path.basename(asset.output))}`;
}

function collectMetadataReview(metadata) {
  for (const [slug, entry] of Object.entries(metadata)) {
    if (entry.reviewNeeded) report.needsReview.push(slug);
    if (!entry.hidden && !entry.topic) report.missingTopic.push(slug);
    if (entry.hidden) report.hiddenNotes.push(slug);
  }
}

function parseNotionHtml(rawHtml) {
  const title = decodeHtml(firstMatch(rawHtml, /<title>([\s\S]*?)<\/title>/i) || firstMatch(rawHtml, /<h1[^>]*class="[^"]*page-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) || '').replace(/<[^>]+>/g, '').trim();
  const articleHtml = rawHtml.match(/<article\b[^>]*>[\s\S]*?<\/article>/i)?.[0] || firstMatch(rawHtml, /<body\b[^>]*>([\s\S]*?)<\/body>/i) || rawHtml;
  return { title, articleHtml };
}

function normalizeHtml(html, sourcePath, assetOutDir, slug, assetIssues) {
  let output = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on[a-z]+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)=("|')\s*javascript:[\s\S]*?\2/gi, '$1="#"');

  const assets = [];
  const assetCopies = [];
  const sourceDir = path.dirname(sourcePath);
  output = output.replace(/\b(src|href)=("|')([^"']+)\2/gi, (full, attr, quote, url) => {
    if (isRemoteUrl(url) || url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:')) return full;
    const decoded = safeDecode(url.split('#')[0].split('?')[0]);
    const localPath = path.resolve(sourceDir, decoded);
    if (!localPath.startsWith(sourceDir)) {
      assetIssues.push(`${toPosix(path.relative(SITE_ROOT, sourcePath))}: blocked path escape ${url}`);
      return full;
    }
    const fileName = path.basename(decoded);
    const destPath = path.join(assetOutDir, fileName);
    const publicUrl = `/assets/imported/${slug}/${encodePathSegment(fileName)}`;
    try {
      const bytes = fsSyncRead(localPath);
      assets.push({
        source: toPosix(path.relative(SITE_ROOT, localPath)),
        output: toPosix(path.relative(SITE_ROOT, destPath)),
        hash: sha256(bytes),
      });
      assetCopies.push({ from: localPath, to: destPath });
      return `${attr}=${quote}${publicUrl}${quote}`;
    } catch {
      assetIssues.push(`${toPosix(path.relative(SITE_ROOT, sourcePath))}: missing local asset ${url}`);
      return full;
    }
  });

  return { html: output.trim() + '\n', assets: uniqueAssets(assets), assetCopies: uniqueCopies(assetCopies) };
}

function fsSyncRead(filePath) {
  return fsSync.readFileSync(filePath);
}

async function readExistingNotes() {
  const notes = new Map();
  await fs.mkdir(NOTES_DIR, { recursive: true });
  for (const entry of await fs.readdir(NOTES_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.match(/\.mdx?$/)) continue;
    const filePath = path.join(NOTES_DIR, entry.name);
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = parseMarkdown(raw);
    const slug = parsed.frontmatter.slug || path.basename(entry.name, path.extname(entry.name));
    notes.set(slug, { path: filePath, raw, ...parsed });
  }
  return notes;
}

function parseMarkdown(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: {}, body: raw };
  return { frontmatter: parseYamlish(match[1]), body: raw.slice(match[0].length) };
}

function parseYamlish(text) {
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

function buildFrontmatter({ slug, title, topic, htmlOutPath, sourceRel, sourceId, sourceHash, old, today, generatedAt }) {
  const oldFm = old?.frontmatter ?? {};
  const fm = {
    title,
    slug,
    topic,
    tags: defaultTags(title, topic),
    summary: defaultSummary(title),
    pinned: false,
    order: 999,
    sourceType: 'html',
    sourcePath: toPosix(path.relative(SITE_ROOT, htmlOutPath)),
    createdAt: today,
    updatedAt: today,
    generated: {
      importer: IMPORTER,
      sourceFile: sourceRel,
      sourceId,
      sourceHash,
      importedAt: generatedAt,
    },
  };

  if (old) {
    for (const key of PRESERVED_FIELDS) {
      if (oldFm[key] !== undefined && (!options.force || PROTECTED_FIELDS.includes(key) === false)) fm[key] = oldFm[key];
    }
    if (!options.force) {
      for (const key of PROTECTED_FIELDS) {
        if (oldFm[key] !== undefined) fm[key] = oldFm[key];
      }
    }
    fm.updatedAt = today;
    fm.createdAt = oldFm.createdAt ?? today;
  }

  return fm;
}

function renderMarkdown(fm, body) {
  return `---\n${stringifyFrontmatter(fm)}---\n${body.replace(/^\n+/, '')}`;
}

function stringifyFrontmatter(fm) {
  const lines = [];
  lines.push('# Manual metadata: safe to edit. The importer preserves these fields unless run with --force.');
  for (const key of ['title', 'slug', 'topic', 'tags', 'summary', 'pinned', 'order']) lines.push(`${key}: ${yamlValue(fm[key])}`);
  lines.push('');
  lines.push('# Generated import boundary: importer-owned. Edit only when repairing import state.');
  for (const key of ['sourceType', 'sourcePath', 'createdAt', 'updatedAt']) lines.push(`${key}: ${yamlValue(fm[key])}`);
  lines.push('generated:');
  for (const [key, value] of Object.entries(fm.generated)) lines.push(`  ${key}: ${yamlValue(value)}`);
  return lines.join('\n') + '\n';
}

function yamlValue(value) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString().slice(0, 10));
  return JSON.stringify(String(value));
}

function fallbackBody(title, sourceRel) {
  return `<!--\nGenerated fallback body for ${title}.\nCanonical imported body: src/content/html-notes/${slugify(title)}.html\nSource export: ${sourceRel}\n\nManual note body edits are preserved on normal imports. Use --force to regenerate this fallback.\n-->\n\nHTML-backed Notion note. The rendered page uses sourcePath from frontmatter.\n`;
}

async function extractZipImports(sourceRoot) {
  if (!fsSync.existsSync(sourceRoot)) return [];
  const zipFiles = [];
  async function walk(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || ['node_modules', 'dist', '_extracted'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.zip')) zipFiles.push(full);
    }
  }
  await walk(sourceRoot);

  const extractedRoots = [];
  for (const zipPath of zipFiles.sort((a, b) => a.localeCompare(b))) {
    const targetDir = path.join(EXTRACTED_IMPORTS_DIR, slugify(path.basename(zipPath, '.zip')));
    await extractZipRecursive(zipPath, targetDir);
    extractedRoots.push(targetDir);
  }
  return extractedRoots;
}

async function extractZipRecursive(zipPath, targetDir) {
  const zipHash = sha256(fsSync.readFileSync(zipPath));
  const markerPath = path.join(targetDir, '.source-zip-sha256');
  const currentMarker = await readIfExists(markerPath);
  if (currentMarker?.trim() === zipHash) return;

  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
  try {
    childProcess.execFileSync('unzip', ['-q', '-o', zipPath, '-d', targetDir], { stdio: 'pipe' });
  } catch (error) {
    report.warnings.push(`${toPosix(path.relative(SITE_ROOT, zipPath))}: could not extract zip; install/check unzip. ${error.message}`);
    return;
  }
  await fs.writeFile(markerPath, `${zipHash}\n`, 'utf8');

  const nestedZips = [];
  async function collect(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await collect(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.zip')) nestedZips.push(full);
    }
  }
  await collect(targetDir);
  for (const nestedZip of nestedZips) {
    const nestedTarget = path.join(path.dirname(nestedZip), slugify(path.basename(nestedZip, '.zip')));
    await extractZipRecursive(nestedZip, nestedTarget);
  }
}

async function findHtmlFiles(root) {
  const found = [];
  async function walk(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || ['node_modules', 'dist'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) found.push(full);
    }
  }
  await walk(root);
  return found.sort((a, b) => a.localeCompare(b));
}

function uniquePaths(paths) {
  return [...new Set(paths)].sort((a, b) => a.localeCompare(b));
}

async function readManifest() {
  try { return JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8')); }
  catch { return { version: 1, importer: IMPORTER, sources: {}, slugs: {} }; }
}

async function readMetadata() {
  try { return JSON.parse(await fs.readFile(METADATA_PATH, 'utf8')); }
  catch { return {}; }
}

function findExistingSlugBySource(existingNotes, sourceId, sourceRel) {
  for (const [slug, note] of existingNotes) {
    const fm = note.frontmatter;
    if (fm.generated?.sourceId === sourceId || fm.generated?.sourceFile === sourceRel) return slug;
    if (fm.sourceType === 'html' && slug === slugify(sourceRel.split('/').pop()?.replace(/[a-f0-9]{32}/i, '').replace(/\.html$/i, '').trim() || '')) return slug;
  }
  return null;
}

function allocateSlug(base, manifest, nextManifest, existingNotes) {
  let slug = base || 'untitled';
  let counter = 2;
  const used = (candidate) => Boolean(manifest.slugs?.[candidate] || nextManifest.slugs?.[candidate] || existingNotes.has(candidate));
  while (used(slug)) slug = `${base}-${counter++}`;
  return slug;
}

function inferTopic(title, sourceRel, existingTopic) {
  if (existingTopic) return existingTopic;
  if (options.defaultTopic) return options.defaultTopic;
  const haystack = `${title} ${sourceRel}`.toLowerCase();
  if (/python/.test(haystack)) return 'python';
  if (/network|socket|tcp|udp|ip|server/.test(haystack)) return 'networking';
  if (/\bc\+\+\b|\bcpp\b|\bc\b|clang|gcc/.test(haystack)) return 'c-cpp';
  report.warnings.push(`${sourceRel}: could not infer topic; defaulted to c-cpp. Use --topic=<slug> if wrong.`);
  return 'c-cpp';
}

function defaultTags(title, topic) {
  const tags = new Set([topic]);
  if (/\bc\b/i.test(title)) tags.add('c');
  if (/c\+\+/i.test(title)) tags.add('cpp');
  return [...tags];
}

function defaultSummary(title) {
  return `Imported Notion note: ${title}.`;
}

function extractSourceId(sourcePath, html, sourceRel) {
  const fromName = path.basename(sourcePath).match(/([a-f0-9]{32})/i)?.[1];
  if (fromName) return fromName.toLowerCase();
  const fromArticle = html.match(/<article\b[^>]*id="([^"]+)"/i)?.[1];
  if (fromArticle) return fromArticle;
  return `path:${sha256(sourceRel).slice(0, 16)}`;
}

async function writeFileIfChanged(filePath, content) {
  if ((await readIfExists(filePath)) === content) return false;
  await fs.writeFile(filePath, content, 'utf8');
  return true;
}

async function writeJsonIfChanged(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  return writeFileIfChanged(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function sortedObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

async function readIfExists(filePath) {
  try { return await fs.readFile(filePath, 'utf8'); }
  catch { return null; }
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function firstMatch(text, regex) {
  return text.match(regex)?.[1] ?? '';
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'");
}

function isRemoteUrl(url) {
  return /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.startsWith('data:');
}

function safeDecode(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function encodePathSegment(value) {
  return value.split('/').map((part) => encodeURIComponent(part)).join('/');
}

function slugify(value) {
  return value.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function uniqueAssets(assets) {
  const seen = new Map();
  for (const asset of assets) seen.set(asset.output, asset);
  return [...seen.values()].sort((a, b) => a.output.localeCompare(b.output));
}

function uniqueCopies(copies) {
  const seen = new Map();
  for (const copy of copies) seen.set(copy.to, copy);
  return [...seen.values()];
}

function printReport() {
  const mode = options.dryRun ? 'DRY RUN' : options.force ? 'FORCE IMPORT' : 'IMPORT';
  console.log(`Notion HTML import report (${mode})`);
  for (const key of ['added', 'updated', 'unchanged', 'skipped', 'warnings', 'assetIssues', 'metadataCreated', 'needsReview', 'missingTopic', 'hiddenNotes']) {
    const label = key === 'assetIssues' ? 'asset issues' : key.replace(/[A-Z]/g, (char) => ` ${char.toLowerCase()}`);
    console.log(`\n${label}: ${report[key].length}`);
    for (const item of report[key]) console.log(`  - ${item}`);
  }
  console.log(`\nmetadata file: ${report.metadataUpdated ? (options.dryRun ? 'would be updated' : 'updated') : 'unchanged'}`);
}
