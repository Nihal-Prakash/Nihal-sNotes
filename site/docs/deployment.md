# Deployment guide: Vercel static Astro

Nihal's Notes deploys as a static Astro site on Vercel.

This site intentionally has:

- no server-side rendering;
- no Vercel functions;
- no database;
- no runtime import pipeline;
- no hosted search service.

The production artifact is plain static files in `site/dist/`.

## Vercel configuration

Root-level `vercel.json` is the deployment source of truth:

```json
{
  "installCommand": "cd site && npm ci",
  "buildCommand": "cd site && npm run build",
  "outputDirectory": "site/dist",
  "cleanUrls": true,
  "trailingSlash": true
}
```

Vercel build command:

```bash
cd site && npm run build
```

Output directory:

```text
site/dist
```

Install command:

```bash
cd site && npm ci
```

## Why the build command matters

The `site/package.json` build script is:

```bash
npm run build:astro && npm run index:search
```

The second step runs Pagefind:

```bash
pagefind --site dist
```

That creates the static client-side search bundle and index in:

```text
dist/pagefind/
```

The search page loads the generated browser asset at runtime from:

```js
await import('/pagefind/pagefind.js')
```

So production search only works if Vercel runs `npm run build`, not just `astro build`.

## Asset path assumptions

Imported Notion assets are copied to:

```text
site/public/assets/imported/<note-slug>/...
```

Astro copies `public/` into the static output, so deployed asset URLs become:

```text
/assets/imported/<note-slug>/...
```

Pagefind assets are generated into:

```text
site/dist/pagefind/
```

Deployed search URLs become:

```text
/pagefind/pagefind.js
/pagefind/wasm.en.pagefind
/pagefind/index/...
/pagefind/fragment/...
```

Deploy the site at a domain root such as `https://example.com/`, not at a nested path such as `https://example.com/notes-site/`, unless the Astro `base` setting and asset/search imports are deliberately changed.

## Environment assumptions

- Node.js: `>=20.0.0`.
- Package manager: npm, using `npm ci` in Vercel.
- Required environment variables: none.
- Required external services at runtime: none.
- Runtime database: none.
- Build-time network access: npm package install only. Existing imported HTML may contain remote Notion/Unsplash icon or cover URLs; local note assets are served from `/assets/imported/...`.

## Production verification

Before deploying:

```bash
cd site
npm run check:deploy
npm run preview -- --host 127.0.0.1 --port 4321
```

Then verify these routes:

- `http://127.0.0.1:4321/`
- `http://127.0.0.1:4321/topics/`
- `http://127.0.0.1:4321/notes/`
- `http://127.0.0.1:4321/search/?q=socket`
- at least one imported HTML-backed note, e.g. `/notes/c/`

Search verification:

1. Known body term returns the expected note.
2. Known metadata/tag term returns the expected note.
3. Nonsense query shows the empty state.
4. Browser console has no Pagefind import or WASM errors.

Asset verification:

1. Open an imported note with images.
2. Confirm local images load from `/assets/imported/...`.
3. Confirm broken or empty image tags do not show broken icons.

## Full pre-deploy checklist

1. Pull latest repository state.
2. Put any new Notion exports under `site/imports/`.
3. Run `cd site`.
4. Run `npm ci`.
5. If importing content, run `npm run import:notion:dry`.
6. If the dry run is correct, run `npm run import:notion`.
7. Curate note/topic metadata:
   - `src/data/notes-metadata.json`
   - `src/data/topics.json`
8. Run `npm run metadata:validate`.
9. Run `npm run build`.
10. Confirm Astro reports a successful static build.
11. Confirm Pagefind reports indexed note pages.
12. Run `npm run preview -- --host 127.0.0.1 --port 4321`.
13. Browser-check `/`, `/topics/`, `/notes/`, and one note page.
14. Browser-check `/search/?q=socket`.
15. Browser-check a nonsense search query for the empty state.
16. Browser-check imported images under `/assets/imported/...`.
17. Confirm no runtime console errors.
18. Confirm no server/database code was added.
19. Commit changes.
20. Push to GitHub: `git@github.com:Nihal-Prakash/Nihal-sNotes.git`.
21. Let Vercel deploy using:
    - Install Command: `cd site && npm ci`
    - Build Command: `cd site && npm run build`
    - Output Directory: `site/dist`
22. After Vercel deploy, repeat route/search/image smoke tests on the production URL.

## Manual Vercel steps

Use the Vercel dashboard if the CLI is not authenticated locally:

1. Import `Nihal-Prakash/Nihal-sNotes`.
2. Keep repository root as the Vercel root because `vercel.json` handles the `site/` subdirectory.
3. Confirm commands:
   - Install Command: `cd site && npm ci`
   - Build Command: `cd site && npm run build`
   - Output Directory: `site/dist`
4. Deploy.

If you instead set Vercel's Root Directory to `site/`, override settings to:

- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`

Do one or the other. Do not combine root directory `site/` with output directory `site/dist`.
