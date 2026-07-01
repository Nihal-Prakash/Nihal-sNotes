# Daily Notion import workflow

Phase 10 import model: HTML-first, idempotent, and conservative around manual edits.

## Safe import model

The importer reads Notion HTML exports from:

```text
site/imports/
```

For each exported `.html` file it writes normalized public content to:

```text
site/src/content/html-notes/<stable-slug>.html
site/src/content/notes/<stable-slug>.md
site/public/assets/imported/<stable-slug>/
site/imports/.import-manifest.json
```

The generated Markdown file is only the Astro metadata/fallback stub. The rendered note body remains HTML-first through `sourcePath`.

Idempotence rules:

- The importer derives a stable source id from the Notion export filename id, or from the `<article id>`, or as a final fallback from the source path hash.
- `site/imports/.import-manifest.json` maps source ids to stable slugs and source hashes.
- Re-running the importer against unchanged exports reports `unchanged` and does not duplicate notes.
- Existing slugs remain stable. The importer does not rename a note just because the Notion title changes.
- Local assets referenced by HTML are copied into the note's stable asset directory and URL-rewritten to `/assets/imported/<slug>/...`.

## Generated vs manual boundary

Each imported note frontmatter has two explicit zones:

```yaml
# Manual metadata: safe to edit. The importer preserves these fields unless run with --force.
title: "..."
slug: "..."
topic: "..."
tags: [...]
summary: "..."
pinned: false
order: 999

# Generated import boundary: importer-owned. Edit only when repairing import state.
sourceType: "html"
sourcePath: "src/content/html-notes/<slug>.html"
createdAt: "YYYY-MM-DD"
updatedAt: "YYYY-MM-DD"
generated:
  importer: "notion-html"
  sourceFile: "imports/..."
  sourceId: "..."
  sourceHash: "..."
  importedAt: "..."
```

Protected on normal import:

- `summary`
- `tags`
- `pinned`
- `order`
- the existing fallback Markdown body

Also preserved when already present:

- `title`
- `topic`
- `createdAt`

Use force only when you intentionally want regenerated protected fields/fallback body:

```bash
npm run import:notion:force
```

## Where to set topic, tags, summary, pinned, and order

After a new note is imported, edit the manual metadata block at the top of its generated stub:

```text
site/src/content/notes/<slug>.md
```

For your new note, that file is:

```text
site/src/content/notes/memory-and-address-in-c.md
```

Edit only this manual section for normal curation:

```yaml
# Manual metadata: safe to edit. The importer preserves these fields unless run with --force.
title: "Memory and Address in C"
slug: "memory-and-address-in-c"
topic: "c-cpp"
tags: ["c-cpp", "c", "memory", "pointers"]
summary: "C memory/address notes covering variables, address-of, memory layout, and pointer foundations."
pinned: false
order: 20
```

Valid current topic slugs are:

- `c-cpp`
- `networking`
- `python`

`topic` decides which topic page the note appears under. `tags` drive tag/search/filter behavior. `pinned` and `order` control homepage/topic ordering.

Do not usually edit the generated section below it:

```yaml
# Generated import boundary: importer-owned. Edit only when repairing import state.
sourceType: "html"
sourcePath: "src/content/html-notes/<slug>.html"
...
```

Normal imports preserve your manual metadata. That means you can safely re-export from Notion and re-run the import without losing your curated summary/tags/pinning/order.

## Import report

Both dry-run and real import print counts and itemized paths for:

- `added`
- `updated`
- `unchanged`
- `skipped`
- `warnings`
- `asset issues`

`asset issues` catches missing local images/files, blocked path escapes, and other asset rewrite problems. Treat asset issues as a stop sign before deployment.

## Recommended daily workflow

From the project app directory:

```bash
cd /home/nihalprakash/Desktop/Code/Projects/NotesWebsite/site
```

1. Export from Notion as HTML.

2. Place the export under `site/imports/`.

You can place either an extracted HTML export directory or the raw Notion `.zip`. Notion sometimes creates nested zips; the importer now extracts those into:

```text
site/imports/_extracted/
```

Example extracted layout:

```text
site/imports/2026-07-01/html/My Note abc123....html
site/imports/2026-07-01/html/My Note/
```

Example zip layout:

```text
site/imports/my-notion-export.zip
```

3. Dry run first:

```bash
npm run import:notion:dry
```

4. If the report looks clean, import:

```bash
npm run import:notion
```

5. Build the static site and Pagefind index:

```bash
npm run build
```

6. Preview locally:

```bash
npm run preview -- --host 127.0.0.1 --port 4321
```

Then open:

```text
http://127.0.0.1:4321/
```

7. Commit content and importer state:

```bash
git status --short
git add site/src/content site/public/assets/imported site/imports/.import-manifest.json site/docs site/scripts site/package.json
git commit -m "content: import latest Notion notes"
```

If git has not been initialized yet, initialize it before relying on the commit steps.

8. Deploy through the configured static deployment flow after build/preview pass.

## Practical rule

Dry run is the safety gate. Daily use should be:

```bash
npm run import:notion:dry
npm run import:notion
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

If dry-run shows unexpected `added`, `updated`, or any `asset issues`, inspect before running the real import. Good founder instinct: protect the content pipeline early; broken ingestion compounds into editorial debt fast.
