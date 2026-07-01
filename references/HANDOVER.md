# NotesWebsite Handover

Last updated: 2026-07-01T08:24:39+05:30

## Mission

Build a public personal technical knowledge-base website from exported Notion notes.

Current target architecture:

- Astro static site
- TypeScript
- HTML-first rendering for rich Notion exports
- Markdown/MDX fallback for manual/lightweight notes and text extraction
- Topic pages
- Note pages
- Full-text search with Pagefind
- Dark developer-notebook aesthetic
- Vercel-compatible static deployment
- Mostly automated Notion export ingestion later

The deployable app lives under:

```text
/home/nihalprakash/Desktop/Code/Projects/NotesWebsite/site
```

The workspace root is:

```text
/home/nihalprakash/Desktop/Code/Projects/NotesWebsite
```

## Non-negotiable product rules

- Do not leak private content. Raw Notion exports must remain separate from normalized public content.
- Do not silently rewrite the user's notes during ingestion. Preserve content by default; editorial cleanup should be explicit/later.
- The project is now HTML-first for imported Notion rendering. Do not return to Markdown-first for rich Notion exports.
- Markdown is fallback/text-extraction/manual-authoring, not the primary visual source for complex Notion notes.
- Do not add difficulty labels.
- Do not add status labels.
- Keep content source-traceable through `sourceType` and `sourcePath` metadata.
- V1 should stay static and simple. No auth, database, CMS, comments, or server rendering.
- Import automation is now conservative daily-use automation: dry-run first, manifest-backed idempotence, and manual metadata protection. See `site/docs/import-workflow.md`.
- Search has been added with Pagefind. The index is generated after `astro build` by `npm run build`.
- Do not implement Phase 6 until explicitly asked.

## Current repository state

This folder is currently not a git repository. Verification on 2026-07-01:

```bash
cd /home/nihalprakash/Desktop/Code/Projects/NotesWebsite
git status --short
git -C site status --short
```

Both produced:

```text
fatal: not a git repository (or any parent up to mount point /)
Stopping at filesystem boundary (GIT_DISCOVERY_ACROSS_FILESYSTEM not set).
```

Before serious iteration, initialize git at the project root:

```bash
cd /home/nihalprakash/Desktop/Code/Projects/NotesWebsite
git init
git add .
git commit -m "chore: initialize NotesWebsite foundation"
```

Generated/ignored directories include:

- `site/node_modules/`
- `site/.astro/`
- `site/dist/`

Root `.gitignore` exists and excludes those generated directories.

## Completed phases

### Phase 0: Diagnosis and setup plan

Completed.

Findings:

- Existing workspace had useful raw/export directories but no app code.
- Recommended keeping the workspace and initializing a clean Astro app in `site/`.
- Existing raw export pattern is nested Notion zip files.

### Phase 1: Astro static-site foundation

Completed in `site/`.

Implemented:

- Astro 7 static project foundation
- TypeScript strict config
- MDX integration via `@astrojs/mdx`
- Base folders:
  - `src/pages`
  - `src/layouts`
  - `src/components`
  - `src/content`
  - `src/styles`
  - `scripts`
  - `imports`
  - `public/assets/imported`
- Scripts in `site/package.json`:
  - `dev`: `astro dev`
  - `build`: `npm run build:astro && npm run index:search`
  - `build:astro`: `astro build`
  - `index:search`: `pagefind --site dist`
  - `preview`: `astro preview`
- Minimal homepage
- Static output configured in `astro.config.mjs`

### Phase 2: Content model and metadata schema

Completed.

Implemented Astro content collections in:

```text
site/src/content.config.ts
```

Collections:

- `notes`: Markdown/MDX content collection loaded from `site/src/content/notes/`
- `topics`: JSON data collection loaded from `site/src/content/topics/`

Note schema:

```ts
title: string
slug: string
topic: string
tags: string[]
summary: string
pinned: boolean
order: number
sourceType: 'markdown' | 'html' | 'manual'
sourcePath: string
createdAt: Date
updatedAt: Date
```

Topic schema:

```ts
title: string
slug: string
description: string
order: number
icon?: string
```

Current topics:

- `c-cpp`: C/C++
- `networking`: Networking
- `python`: Python

Manual sample notes originally created from raw Notion exports:

- `site/src/content/notes/server-c.md` -> topic `networking`
- `site/src/content/notes/byte-order.md` -> topic `networking`
- `site/src/content/notes/tcp-socket.md` -> topic `networking`

Important: these are manual sample notes, not the result of an importer.

### Phase 5.5: Content fidelity audit and HTML-first pivot

Completed.

Reason for pivot:

- Notion Markdown/CSV export is too visually lossy for rich notes.
- Markdown loses or degrades cover images, page icons, callout structure, image placement, inline code styling, code block structure, tables, spacing, highlights, and Notion-like visual grouping.
- Notion HTML export preserves the useful DOM/classes: `page-cover-image`, `page-header-icon`, `figure.callout`, `figure.image`, `pre.code > code`, `details/summary`, highlights, and spacing wrappers.

Strategy document created:

```text
site/docs/content-fidelity-strategy.md
```

The document defines:

- HTML-first rendering strategy
- Markdown fallback role
- Asset/image copy and URL rewriting expectations
- Callout preservation
- Code block and inline code styling
- Table styling
- Pagefind indexing approach for final rendered HTML
- Known limitations before the real importer

Proof-of-concept implemented:

- `site/src/content/notes/c.md` now keeps the note metadata/fallback body but sets:

```yaml
sourceType: "html"
sourcePath: "src/content/html-notes/c.html"
```

- HTML body stored at:

```text
site/src/content/html-notes/c.html
```

- 17 C-note image assets copied to:

```text
site/public/assets/imported/c/
```

- Local image URLs inside the HTML body were rewritten to `/assets/imported/c/...`.
- The C note renders at the existing canonical route:

```text
/notes/c/
```

No full importer was built. No Pagefind implementation was added.

### Phase 8: Topic filtering, sorting, and note discovery

Completed.

Implemented:

- `/topics/` now shows all topics, note counts per topic, and a lightweight client-side title filter.
- `/topics/[slug]/` now supports client-side note search across title, summary, and tags.
- `/topics/[slug]/` now supports tag filtering through a select and quick tag buttons.
- `/topics/[slug]/` note sorting options:
  - pinned first;
  - custom order;
  - recently updated;
  - alphabetical.
- Home page now has three discovery sections:
  - pinned/featured notes;
  - recent notes;
  - major topics.
- Clean empty states were added for no notes/topics and no filter results.
- Pagefind/full-text search was intentionally not added in Phase 8; it was added later in Phase 9.

Implementation files:

```text
site/src/pages/index.astro
site/src/pages/topics/index.astro
site/src/pages/topics/[slug].astro
site/src/styles/global.css
```

Latest verification:

```bash
cd /home/nihalprakash/Desktop/Code/Projects/NotesWebsite/site
npm run build
```

Outcome:

```text
10 page(s) built
build complete
```

Browser smoke checks on existing dev server at `http://localhost:4321`:

- `/topics/` title filter matched `network` and showed only Networking.
- `/topics/` title filter `zzzz` showed the no-results empty state.
- `/topics/networking/` search `byte` showed only Byte Order.
- `/topics/networking/` tag filter `binary` worked with the current query.
- `/topics/networking/` empty search state appeared for `zzzz`.
- `/topics/networking/` alphabetical sorting produced Byte Order, Server.C, TCP Socket.
- `/topics/networking/` pinned sorting produced Server.C, Byte Order, TCP Socket.

### Phase 9: Pagefind full-text search

Completed.

Implemented:

- Added Pagefind as a dev dependency.
- Changed `site/package.json` build flow so `npm run build` runs:
  - `npm run build:astro` -> `astro build`
  - `npm run index:search` -> `pagefind --site dist`
- Added `/search/` with custom Pagefind JS API search UI.
- Added global search entry points:
  - header navigation link;
  - home hero Search notes CTA.
- Note detail pages now mark the indexable note article with `data-pagefind-body`.
- Repeated header/navigation/back-link/search-page UI is excluded with `data-pagefind-ignore="all"` or by omission from `data-pagefind-body` pages.
- Note pages expose Pagefind metadata:
  - `title`
  - `topic`
  - `summary`
  - `tags`
- Note pages render tags visibly so tag terms are part of the indexed note content.
- Search results display:
  - title;
  - topic;
  - highlighted excerpt;
  - URL.

Implementation files:

```text
site/package.json
site/package-lock.json
site/src/components/SiteHeader.astro
site/src/pages/index.astro
site/src/pages/notes/[slug].astro
site/src/pages/search.astro
site/src/styles/global.css
```

Generated output after build:

```text
site/dist/pagefind/
```

Latest verification:

```bash
cd /home/nihalprakash/Desktop/Code/Projects/NotesWebsite/site
npm run build
npm run preview -- --host 127.0.0.1 --port 4322
```

Build outcome:

```text
11 page(s) built
Pagefind v1.5.2 indexed 4 pages and 1460 words
```

Browser smoke checks against the production preview:

- `/search/?q=waitpid` returned Server.C with topic Networking and URL `/notes/server-c/`.
- Search for `endianness` returned Byte Order, proving tag/metadata/body indexing works.
- Search for `zzzz_no_result` returned `0 results` and showed the empty state.
- Browser console had no JavaScript errors.

### Phase 10: Safe daily Notion import workflow

Completed.

Implemented:

- `site/scripts/import-notion.mjs`: HTML-first Notion importer.
- `site/package.json` scripts:
  - `import:notion`
  - `import:notion:dry`
  - `import:notion:force`
- Manifest/cache:
  - `site/imports/.import-manifest.json`
- Daily workflow documentation:
  - `site/docs/import-workflow.md`

Safety model:

- Source id comes from the Notion filename id, `<article id>`, or source path hash fallback.
- Manifest maps source ids to stable slugs and source hashes.
- Repeated unchanged imports report `unchanged`, not duplicate notes.
- Manual frontmatter fields `summary`, `tags`, `pinned`, and `order` are preserved unless running force mode.
- Existing title/topic/createdAt and fallback Markdown body are preserved on normal imports.
- Generated-vs-manual boundary is explicit in imported note frontmatter.
- Reports include added, updated, unchanged, skipped, warnings, and asset issues.

Latest verification:

```bash
cd /home/nihalprakash/Desktop/Code/Projects/NotesWebsite/site
npm run import:notion
npm run import:notion:dry
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
curl -I --max-time 5 http://127.0.0.1:4321/notes/c/
```

Observed:

- Repeated import reported `unchanged: 1` for the C note.
- Build generated 11 pages.
- Pagefind indexed 4 pages and 1460 words.
- Preview returned `HTTP/1.1 200 OK` for `/notes/c/`.

## Current routes

The latest verified build generated 11 pages:

- `/`
- `/notes/`
- `/notes/c/`
- `/notes/server-c/`
- `/notes/byte-order/`
- `/notes/tcp-socket/`
- `/search/`
- `/topics/`
- `/topics/c-cpp/`
- `/topics/networking/`
- `/topics/python/`

## Current note rendering implementation

Main file:

```text
site/src/pages/notes/[slug].astro
```

Behavior:

- Uses the existing Astro content collection for metadata and route generation.
- If `note.data.sourceType === 'html'`:
  - reads `note.data.sourcePath` from the `site/` working directory;
  - applies build-time highlighting to Notion-style code blocks;
  - injects the HTML inside the existing note page layout with:

```astro
<div class="prose notion-prose" set:html={htmlBody} />
```

- Otherwise, it renders Markdown/MDX normally via Astro's `render(note)`.

Code highlighting:

- Implemented build-time highlighting for Notion HTML code blocks using `codeToHtml` from `shiki`.
- Shiki is available transitively through Astro in the current dependency tree; it was not added as an explicit dependency in `package.json`.
- Theme: `github-dark-default`.
- Replacement is index-safe: it collects regex matches with start/end offsets and rebuilds the HTML with a cursor. This avoids corrupting repeated/identical `<pre><code>` blocks.

Known implementation caveat:

- If we keep relying on Shiki directly, consider adding `shiki` as an explicit dependency later instead of relying on Astro's transitive dependency. The current build passes, but explicit dependencies are cleaner for production hardening.

HTML note image handling:

- Broken or empty images inside `.notion-prose` are removed by a small inline script in the note page.
- Verified `/notes/c/` had zero broken images in browser inspection.

## Styling implementation

Main file:

```text
site/src/styles/global.css
```

The Phase 5.5 fidelity layer starts around the `/* Notion HTML export rendering */` section.

It styles:

- `.notion-prose`
- Notion page wrapper/header/title/icon/cover image
- Notion image figures
- Notion callouts as visual cards
- `details` / `summary` blocks
- indented content
- Notion highlights/background classes
- inline `code`
- `pre.code` and Shiki-highlighted code blocks
- tables with overflow-safe layout and dark styling

Important code styling fix:

- A previous CSS rule flattened syntax colors:

```css
.prose pre code span {
  color: inherit !important;
}
```

- That rule was removed so Shiki token colors survive.

## Verification commands and known outcomes

Run from:

```bash
cd /home/nihalprakash/Desktop/Code/Projects/NotesWebsite/site
```

Build:

```bash
npm run build
```

Latest verified outcome after Phase 5.5 and code-highlighting fix:

```text
10 page(s) built
build complete
```

Static verification after build:

```text
real pre tags: 44
highlighted: 44
non shiki: 0
styled spans: 2214
```

Browser verification performed at:

```text
http://localhost:4321/notes/c/
```

Browser console check returned:

```text
preCount: 44
highlighted: 44
nonHighlighted: 0
styledSpans: 2214
brokenImages: 0
```

Sample computed token colors confirmed:

```text
#include -> rgb(255, 123, 114)
<stdio.h> -> rgb(165, 214, 255)
comments -> rgb(139, 148, 158)
int -> rgb(255, 123, 114)
main -> rgb(210, 168, 255)
```

Visual verification:

- `/notes/c/` renders the HTML-backed C note.
- Cover image renders.
- Page icon renders.
- Callouts render as visual cards, not raw `[!tip]` text.
- Code blocks have dark backgrounds and syntax highlighting.
- Inline code is readable.
- Images render with no broken-image icons.
- Existing Markdown sample notes still build and route correctly.

Local dev:

```bash
npm run dev
```

Expected URL:

```text
http://localhost:4321/
```

Test the HTML-backed note:

```text
http://localhost:4321/notes/c/
```

Test Markdown-backed notes:

```text
http://localhost:4321/notes/server-c/
http://localhost:4321/notes/byte-order/
http://localhost:4321/notes/tcp-socket/
```

## Key files and responsibilities

### Project setup

```text
site/package.json
```

Defines npm scripts and dependencies.

```text
site/astro.config.mjs
```

Astro config. Static output and MDX integration live here.

```text
site/tsconfig.json
```

Strict TypeScript config plus path aliases. `moduleResolution: "bundler"` was added so Astro content loader imports type-check correctly.

### Content model

```text
site/src/content.config.ts
```

Defines the canonical note/topic schema. Preserve this as the source of truth for future import automation.

### Content

```text
site/src/content/topics/*.json
```

Topic metadata entries.

```text
site/src/content/notes/*.md
```

Normalized/manual note entries with frontmatter. For HTML-backed notes, the Markdown file acts as metadata/fallback.

```text
site/src/content/html-notes/*.html
```

HTML-first body fragments for imported Notion notes. Currently contains only:

```text
site/src/content/html-notes/c.html
```

### Documentation

```text
site/docs/content-fidelity-strategy.md
```

Internal strategy doc for the HTML-first pivot.

### Pages

```text
site/src/pages/index.astro
```

Homepage. Shows big topic cards and pinned notes.

```text
site/src/pages/notes/index.astro
site/src/pages/notes/[slug].astro
```

All notes listing and individual note pages. `[slug].astro` contains the HTML-first branching logic.

```text
site/src/pages/topics/index.astro
site/src/pages/topics/[slug].astro
```

All topics listing and individual topic pages.

### Components

```text
site/src/components/TopicCard.astro
```

Large rectangular topic-card component. User specifically wanted topic cards to be big rectangles similar to the reference image, not small pills.

```text
site/src/components/NoteCard.astro
```

Reusable note preview card.

```text
site/src/components/SiteHeader.astro
```

Simple header. Not final design.

### Styling

```text
site/src/styles/global.css
```

Current global CSS includes basic dark theme, topic cards, note cards, Markdown prose styling, and the Phase 5.5 Notion HTML fidelity layer.

### Imported public assets

```text
site/public/assets/imported/c/
```

Contains 17 copied image assets for the C HTML proof-of-concept.

### Raw inputs and references

```text
exports/raw/markdown-sample/
exports/raw/html-sample/
```

Raw Notion exports used as the durable source inventory. Preserve these. Future importer should read from raw exports or explicit import input folders.

Note: the user originally referenced `imports/fidelity-test/...` for Phase 5.5, but that directory is not present in the workspace at this handover update. The checked-in durable output of that audit is `site/docs/content-fidelity-strategy.md`, and the current HTML proof-of-concept source is `site/src/content/html-notes/c.html`.

```text
references/DESIGN_NOTES.md
```

User-provided color/design reference. Current content is a palette:

- `#2b2d42` Space Indigo
- `#8d99ae` Lavender Grey
- `#edf2f4` Platinum
- `#ef233c` Punch Red
- `#d90429` Flag Red

```text
/home/nihalprakash/Pictures/Screenshots/Screenshot From 2026-07-01 05-21-33.png
```

Screenshot reference supplied by user for large rectangular topic-card feel. It showed Shopify Editions-style big rectangular/card covers on shelf-like rows. Current implementation only adapts the big rectangular-card idea, not the exact Shopify visual design.

## Raw export inventory observed

Markdown raw exports:

```text
exports/raw/markdown-sample/258e09c2-86a7-4f30-9e83-2fa6c43f66fb_ExportBlock-f70695d9-d4ef-47f9-a801-7aea63dedc65.zip
```

Nested zip containing:

- `C e68a50627edb4ab491035244e389b9dd.md`
- 17 PNG assets

```text
exports/raw/markdown-sample/313f6236-5e7a-4d35-9f07-d4c2bcee27fc_ExportBlock-98b98840-c174-4f9a-8366-fb054e4beb03.zip
```

Nested zip containing:

- `Server C 25215dbfb6a28056aa5ff777303a80a7.md`

```text
exports/raw/markdown-sample/ebd86a54-9b9c-4454-a512-7ccc899beda5_ExportBlock-06fa7d01-87c9-4c22-89f4-46b203f17f06.zip
```

Nested zip containing:

- `Byte Order 24d15dbfb6a280a68473d952321b1e68.md`

```text
exports/raw/markdown-sample/f24015c4-e12a-4809-a9a7-200fe91a04e4_ExportBlock-53c76874-b03b-43c1-8489-70a0e73f515c.zip
```

Nested zip containing:

- `TCP Socket 24d15dbfb6a2805f9689e53f5670de62.md`
- 1 PNG asset

HTML raw export:

```text
exports/raw/html-sample/1bd25551-624a-4f21-be64-d261a85c7b84_ExportBlock-b3e96243-e705-485d-97cd-7758f4b749ee.zip
```

Nested zip containing:

- `C e68a50627edb4ab491035244e389b9dd.html`
- 17 PNG assets

Legacy sample still exists:

```text
exports/markdown-sample/C.zip
```

This appears to duplicate the C Markdown sample.

## How to add a new Markdown/manual note

Create a Markdown or MDX file under:

```text
site/src/content/notes/<slug>.md
```

Example:

```md
---
title: "Example Note"
slug: "example-note"
topic: "networking"
tags: ["tcp", "sockets", "c"]
summary: "Short description used for cards, topic pages, and future search previews."
pinned: false
order: 40
sourceType: "manual"
sourcePath: "manual"
createdAt: "2026-07-01"
updatedAt: "2026-07-01"
---

## Main heading

Note content goes here.
```

Rules:

- `slug` controls `/notes/<slug>/`.
- `topic` must match an existing topic slug from `site/src/content/topics/`.
- `tags` are freeform strings.
- `pinned` promotes a note.
- `order` controls manual ordering.
- `updatedAt` supports recent notes later.
- `sourceType` must be one of `markdown`, `html`, or `manual`.
- `sourcePath` should point to the raw/normalized source when content comes from exports.

## How to add a new HTML-backed note manually

This is only a manual proof-of-concept workflow until the real importer exists.

1. Create metadata/fallback Markdown:

```text
site/src/content/notes/<slug>.md
```

2. Use frontmatter like:

```yaml
sourceType: "html"
sourcePath: "src/content/html-notes/<slug>.html"
```

3. Put the trusted/local Notion HTML body fragment at:

```text
site/src/content/html-notes/<slug>.html
```

4. Copy local images/assets to:

```text
site/public/assets/imported/<slug>/
```

5. Rewrite local HTML image URLs to:

```text
/assets/imported/<slug>/<filename>
```

6. Run:

```bash
cd /home/nihalprakash/Desktop/Code/Projects/NotesWebsite/site
npm run build
```

7. Test:

```text
http://localhost:4321/notes/<slug>/
```

Do not automate this fully unless the user asks for the importer phase.

## How to add a new topic

Create JSON under:

```text
site/src/content/topics/<slug>.json
```

Example:

```json
{
  "title": "Operating Systems",
  "slug": "operating-systems",
  "description": "Notes on processes, memory, filesystems, scheduling, syscalls, and OS internals.",
  "order": 40,
  "icon": "os"
}
```

Then notes can use:

```yaml
topic: "operating-systems"
```

The topic route `/topics/operating-systems/` will be generated automatically.

## Known issues and caveats

- Import automation does not exist yet.
- Pagefind search does not exist yet.
- There is no import manifest yet.
- There is no automated validation script for duplicate slugs, missing topic refs, missing assets, bad dates, broken image references, or `sourcePath` correctness.
- HTML normalization is manual/POC-only.
- Remote cover/icon assets are not downloaded locally yet; they currently load from remote Notion/Unsplash URLs if present in the HTML export.
- Sanitization is intentionally light because the current HTML source is trusted/local. Future importer should remove scripts, inline event handlers, `javascript:` URLs, and unwanted embeds while preserving useful Notion classes/structure.
- The HTML code-block highlighter currently depends on `shiki` being available through Astro's dependency tree. Consider making it explicit later.
- The C Markdown fallback body still contains old placeholder blockquotes for omitted images. The live `/notes/c/` route uses HTML, so those placeholders are not visible there.
- Site design is still foundation styling. It is not the final dark developer-notebook aesthetic.
- Some raw Notion note text includes typos, conversational remnants, and incomplete phrasing. This was preserved by design.
- Screenshot regression comparison does not exist yet.

## Recommended next phase

Do not jump directly into Phase 6 or broad UI polish.

High-leverage next work before Phase 6:

1. Initialize git and commit the current working baseline.
2. Add a lightweight content validation script for:
   - duplicate note slugs;
   - note topic matching an existing topic;
   - missing required frontmatter;
   - bad `sourceType`;
   - missing `sourcePath` files for HTML-backed notes;
   - broken local image references in HTML-backed notes.
3. Decide whether to add `shiki` as an explicit dependency.
4. Only then build the real importer:
   - read selected Notion HTML exports;
   - extract nested zips;
   - normalize slugs/filenames deterministically;
   - copy assets to `public/assets/imported/<note-slug>/`;
   - rewrite URLs;
   - emit metadata/fallback Markdown;
   - emit `src/content/html-notes/<slug>.html`;
   - produce an import manifest/report.

Potential future package additions for importer/validation:

```bash
npm install gray-matter fast-glob
npm install -D tsx
```

Potential scripts to add later:

```json
{
  "ingest": "tsx scripts/ingest-notion-export.ts",
  "validate:content": "tsx scripts/validate-content.ts",
  "rebuild": "npm run ingest && npm run build"
}
```

## Current important file tree excluding generated dependencies/build output

```text
.gitignore
exports/markdown-sample/C.zip
exports/raw/html-sample/1bd25551-624a-4f21-be64-d261a85c7b84_ExportBlock-b3e96243-e705-485d-97cd-7758f4b749ee.zip
exports/raw/markdown-sample/258e09c2-86a7-4f30-9e83-2fa6c43f66fb_ExportBlock-f70695d9-d4ef-47f9-a801-7aea63dedc65.zip
exports/raw/markdown-sample/313f6236-5e7a-4d35-9f07-d4c2bcee27fc_ExportBlock-98b98840-c174-4f9a-8366-fb054e4beb03.zip
exports/raw/markdown-sample/ebd86a54-9b9c-4454-a512-7ccc899beda5_ExportBlock-06fa7d01-87c9-4c22-89f4-46b203f17f06.zip
exports/raw/markdown-sample/f24015c4-e12a-4809-a9a7-200fe91a04e4_ExportBlock-53c76874-b03b-43c1-8489-70a0e73f515c.zip
references/DESIGN_NOTES.md
references/HANDOVER.md
site/astro.config.mjs
site/docs/content-fidelity-strategy.md
site/imports/.gitkeep
site/package-lock.json
site/package.json
site/public/assets/imported/.gitkeep
site/public/assets/imported/c/3bb03773-b7fc-4807-a1a2-e53d3b02372e.png
site/public/assets/imported/c/Untitled.png
site/public/assets/imported/c/Untitled 1.png
site/public/assets/imported/c/Untitled 2.png
site/public/assets/imported/c/Untitled 3.png
site/public/assets/imported/c/Untitled 4.png
site/public/assets/imported/c/Untitled 5.png
site/public/assets/imported/c/Untitled 6.png
site/public/assets/imported/c/Untitled 7.png
site/public/assets/imported/c/Untitled 8.png
site/public/assets/imported/c/Untitled 9.png
site/public/assets/imported/c/Untitled 10.png
site/public/assets/imported/c/Untitled 11.png
site/public/assets/imported/c/Untitled 12.png
site/public/assets/imported/c/Untitled 13.png
site/public/assets/imported/c/image.png
site/public/assets/imported/c/image 1.png
site/scripts/.gitkeep
site/src/components/NoteCard.astro
site/src/components/SiteHeader.astro
site/src/components/TopicCard.astro
site/src/content/.gitkeep
site/src/content/html-notes/c.html
site/src/content/notes/byte-order.md
site/src/content/notes/c.md
site/src/content/notes/server-c.md
site/src/content/notes/tcp-socket.md
site/src/content/topics/c-cpp.json
site/src/content/topics/networking.json
site/src/content/topics/python.json
site/src/content.config.ts
site/src/layouts/BaseLayout.astro
site/src/pages/index.astro
site/src/pages/notes/[slug].astro
site/src/pages/notes/index.astro
site/src/pages/topics/[slug].astro
site/src/pages/topics/index.astro
site/src/styles/global.css
site/tsconfig.json
```
