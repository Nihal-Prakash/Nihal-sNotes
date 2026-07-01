# Content Fidelity Strategy: HTML-first Notion rendering

Phase 5.5 decision: imported Notion HTML becomes the primary note body format. Markdown remains useful, but it is no longer the default rendering source for exported Notion notes where visual fidelity matters.

## Why pivot away from Markdown-first

The fidelity test shows that Notion's Markdown export is good for text extraction, but weak as a visual source of truth:

- Cover images are not represented in the Markdown body.
- Page icons are lost.
- Notion callouts become plain Markdown blockquote syntax such as `[!tip]`, which renders as raw text unless transformed.
- Image references exist, but layout context, figure wrappers, captions, sizing, and placement semantics are degraded.
- Inline color/highlight styling is mostly lost or flattened.
- Code blocks survive as fenced Markdown, but Notion's code wrapper classes, wrapping behavior, and spacing are gone.
- Notion spacing, toggles/details blocks, columns, indentation, highlights, and visual grouping are either lost or approximated.
- Tables are expected to degrade in Markdown because Notion HTML carries richer DOM structure and classes; tables should be treated as HTML-first even when Markdown has a textual fallback.

The HTML export preserves the structures the public site needs to render close to the original: `page-cover-image`, `page-header-icon`, `figure.callout`, `figure.image`, `pre.code > code`, details/summary toggles, column lists, highlight classes, and Notion spacing wrappers.

## HTML-first rendering strategy

Canonical imported note body format:

```text
src/content/html-notes/<note-slug>.html
```

Canonical note metadata remains in the Astro `notes` collection:

```text
src/content/notes/<note-slug>.md
```

For HTML-backed notes, the Markdown file is a metadata/fallback stub with:

```yaml
sourceType: "html"
sourcePath: "src/content/html-notes/<note-slug>.html"
```

The note route decides at render time:

1. If `sourceType === "html"`, read the HTML fragment from `sourcePath` and inject it into the existing note page layout.
2. Otherwise, render the Markdown/MDX body normally through Astro content collections.

This keeps topic pages, note cards, metadata, slugs, and the note route intact while allowing high-fidelity HTML bodies.

## Markdown fallback role

Markdown should be kept for:

- Manually authored notes.
- Lightweight notes where visual fidelity is not important.
- Text extraction, summaries, previews, or future search enrichment.
- Emergency fallback when an HTML export is missing or invalid.

Markdown should not be used as the primary renderer for rich Notion exports.

## Assets and image URL rewriting

For each imported HTML note, copy local Notion export assets into:

```text
public/assets/imported/<note-slug>/
```

Then rewrite local HTML image URLs from Notion-relative paths such as:

```html
<img src="C/Untitled 1.png">
```

into site-root asset URLs:

```html
<img src="/assets/imported/<note-slug>/Untitled%201.png">
```

Rules:

- Preserve remote cover/icon URLs for now unless the importer explicitly downloads them later.
- Preserve `alt`, `class`, `style`, `width`, `height`, and figure wrappers where present.
- Do not flatten image figures into Markdown image syntax.
- The future importer should produce a manifest recording copied assets and rewritten URLs.

## Callouts

Preserve Notion callouts as HTML, typically:

```html
<figure class="block-color-gray_background callout" style="white-space:pre-wrap;display:flex">
  <div><span class="icon">💡</span></div>
  <div>...</div>
</figure>
```

The site CSS should style `.notion-prose .callout` as dark visual cards with border, background, spacing, and icon alignment. Do not convert callouts to `[!tip]` Markdown during rendering; that is exactly the fidelity loss this pivot fixes.

## Code blocks and inline code

Preserve Notion code block HTML:

```html
<pre class="code code-wrap"><code class="language-c">...</code></pre>
```

Style in CSS:

- `pre.code` gets dark background, border, radius, horizontal overflow, and readable line-height.
- `pre.code > code` should not inherit inline-code pill styling.
- Inline `code` remains a small readable pill.
- No syntax highlighter dependency is needed for this proof of concept. A highlighter can be evaluated later if we want language-aware coloring.

## Tables

Tables should remain HTML, not Markdown tables. CSS should provide:

- `display: block` or wrapper-safe overflow behavior on narrow screens.
- Collapsed borders.
- Dark table background.
- Subtle cell borders.
- `overflow-wrap: anywhere` for long content.

Even though the current C sample has no table, table support belongs in the HTML-first renderer because Notion table fidelity is exactly where Markdown tends to break.

## Pagefind indexing

Pagefind can still index final rendered static HTML. Because Astro emits the injected HTML into the built page, Pagefind sees the same final DOM as the browser.

Planned later:

- Add Pagefind after the importer stabilizes.
- Scope searchable content to the final note article/body.
- Exclude navigation and decorative metadata with Pagefind attributes if necessary.
- Keep Markdown text extraction optional as supplemental metadata, not the canonical rendered body.

## Sanitization stance

For this phase, the HTML source is a trusted local Notion export controlled by the site owner. The POC avoids heavy sanitizer/parser dependencies to keep the architecture simple.

Future importer hardening should still sanitize or filter dangerous constructs before writing normalized HTML, at minimum removing:

- `<script>` tags
- inline event handlers such as `onclick`
- `javascript:` URLs
- external embeds that should not ship publicly

Important: sanitization must not destroy useful Notion structure/classes needed for fidelity.

## Current importer status

Phase 10 adds a conservative daily-use importer documented in:

```text
site/docs/import-workflow.md
```

Implemented:

- HTML-first import from `site/imports/**/*.html`.
- Stable source-id to slug mapping in `site/imports/.import-manifest.json`.
- Source hash based change detection.
- Idempotent repeated imports with `added`, `updated`, and `unchanged` reporting.
- Local asset copy + URL rewrite into `public/assets/imported/<slug>/`.
- Asset issue reporting for missing/blocked local asset paths.
- Explicit frontmatter boundary between manual metadata and generated import metadata.
- Normal imports preserve manual `summary`, `tags`, `pinned`, `order`, existing `title`, existing `topic`, `createdAt`, and fallback Markdown body.
- Dry-run command: `npm run import:notion:dry`.

Remaining limitations:

- Remote cover/icon assets are preserved as remote URLs; the importer does not download them yet.
- Topic inference is heuristic for new notes. Use `npm run import:notion -- --topic=<topic-slug>` when importing a batch that should use a specific topic.
- HTML sanitization is intentionally minimal for trusted local Notion exports: scripts, event handlers, and `javascript:` URLs are stripped, but this is not a general untrusted-HTML sanitizer.
- CSS only targets common Notion export structures; more exports may require additional selectors.
- No screenshot regression comparison exists yet.
