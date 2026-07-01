# Nihal's Notes

A static Astro knowledge base for Nihal Prakash's technical notes.

- Author: Nihal Prakash
- GitHub: `git@github.com:Nihal-Prakash/Nihal-sNotes.git`
- LinkedIn: https://www.linkedin.com/in/nihal-prakash-047377291/
- Email: nihalprakash314@gmail.com

## What this is

Nihal's Notes is an HTML-first public notebook for C/C++, Networking, Python, and future technical topics. It is built as a static Astro site under `site/`, with Pagefind-generated client-side search.

There is no server-side runtime and no database. Imported Notion HTML becomes static content at build time.

## Repository layout

```text
.
├── README.md
├── vercel.json
└── site/
    ├── src/content/notes/          # Markdown stubs + manual public metadata
    ├── src/content/html-notes/     # Imported Notion HTML bodies
    ├── src/data/topics.json        # Topic definitions
    ├── src/data/notes-metadata.json# Central curated note metadata
    ├── public/assets/imported/     # Copied local imported assets
    ├── imports/                    # Local Notion exports and import manifest
    ├── docs/                       # Operational docs
    └── dist/                       # Generated production output
```

## Environment assumptions

- Node.js 20 or newer.
- npm 10 or newer recommended.
- Static deployment at the domain root, not a subpath, because generated asset/search URLs use root-relative paths such as `/assets/...` and `/pagefind/pagefind.js`.
- No required environment variables.
- No database.
- No server-side Vercel functions.

## Local setup

From the repository root:

```bash
cd site
npm ci
```

## Local development

```bash
cd site
npm run dev
```

Astro dev is useful for layout/content work. Full-text search is generated after a production build, so test search with `npm run build` + `npm run preview`, not only `npm run dev`.

## Import a Notion export

Put Notion HTML exports or Notion zip exports under:

```text
site/imports/
```

Then run a dry run first:

```bash
cd site
npm run import:notion:dry
```

If the dry run looks correct:

```bash
npm run import:notion
```

After import, curate public metadata before deploying:

- `site/src/data/notes-metadata.json` for title/topic/tags/summary/pinned/order/hidden.
- `site/src/data/topics.json` for public topic definitions.
- Generated HTML bodies live in `site/src/content/html-notes/`.
- Imported assets live in `site/public/assets/imported/`.

Validate metadata:

```bash
npm run metadata:validate
```

## Build

```bash
cd site
npm run build
```

This runs:

```bash
npm run build:astro && npm run index:search
```

The Pagefind search index is generated into:

```text
site/dist/pagefind/
```

## Preview production build

```bash
cd site
npm run preview
```

For an explicit local address:

```bash
npm run preview -- --host 127.0.0.1 --port 4321
```

Then verify:

- `/` loads.
- `/notes/` loads.
- `/topics/` loads.
- `/search/?q=socket` returns real Pagefind results.
- Note images load from `/assets/imported/...`.

## Deployment on Vercel

This repository includes root-level `vercel.json`, so Vercel can build from the repository root.

Vercel settings:

- Framework Preset: Astro, or Other if Vercel does not auto-detect because the Astro app is in `site/`.
- Install Command: `cd site && npm ci`
- Build Command: `cd site && npm run build`
- Output Directory: `site/dist`

Recommended flow:

```bash
cd site
npm run check:deploy
```

Then push to GitHub and import the repository into Vercel:

```bash
git remote add origin git@github.com:Nihal-Prakash/Nihal-sNotes.git
# if origin already exists, skip the previous line or update it manually
git add .
git commit -m "Prepare static Astro site for Vercel deployment"
git push -u origin main
```

If the default branch is not `main`, use your actual branch name.

## Pre-deploy checklist

Run this before every production deploy:

1. `cd site`
2. `npm ci`
3. `npm run metadata:validate`
4. `npm run build`
5. Confirm build output says Pagefind indexed the expected number of note pages.
6. `npm run preview -- --host 127.0.0.1 --port 4321`
7. Open `/` and check landing page layout.
8. Open `/notes/` and one note detail page.
9. Confirm note images load from `/assets/imported/...`.
10. Open `/search/?q=socket` and confirm results render.
11. Search a nonsense query and confirm the empty state appears.
12. Open browser devtools console and confirm there are no search/runtime errors.
13. Confirm no server-side functionality or database dependency was added.
14. Push to GitHub.
15. Let Vercel deploy using `cd site && npm run build` and `site/dist`.

## Useful scripts

Run from `site/`:

```bash
npm run dev              # local Astro dev server
npm run import:notion:dry# dry-run Notion import
npm run import:notion    # import Notion export into static content
npm run metadata:validate# validate curated metadata
npm run build            # Astro build + Pagefind index
npm run preview          # preview dist/
npm run check:deploy     # metadata validation + production build
```
