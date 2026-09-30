# Northwind Supply

A mini e-commerce storefront — product listing, product detail, and a working cart —
built with Nuxt 3, Vue 3 and TypeScript. The catalogue and the site copy are authored
in Contentful and read over its GraphQL Content API.

## Requirements

Node 20 or newer. Developed and verified on **Node 24.15.0**, npm 11.

## Setup

`npm install`

`postinstall` runs `nuxt prepare`, which generates `.nuxt/`. That step is load-bearing:
`tsconfig.json` extends a file generated there, so a fresh clone will not typecheck
without it.

Then point the app at a Contentful space:

`cp .env.example .env`

Fill in `NUXT_CONTENTFUL_SPACE_ID` and `NUXT_CONTENTFUL_ACCESS_TOKEN` — both come from
Contentful under **Settings → API keys**. The other two variables are optional and have
defaults; `.env.example` explains each one.

Nuxt reads `.env` **once, at startup**. After editing it, restart the dev server — a
browser reload is not enough.

An empty `.env` will not crash the app. Every page renders built-in fallback copy,
deliberately, so that a missing credential looks like *no content* rather than a broken
build.


## Running

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on **http://localhost:3000**, with hot reload |
| `npm run build` | Production build into `.output/` |
| `npm run preview` | Serve the built output |
| `npm run typecheck` | `vue-tsc` over the whole project, tests included |
| `npm test` | Vitest unit tests in `tests/` |

## Routes

| Route | |
| --- | --- |
| `/` | Product listing, filterable by category |
| `/products/[id]` | Product detail |
| `/cart` | Cart with quantity editing, removal and totals |
| `GET /api/contentful/:operation` | The app's only path to Contentful — see below |

`[id]` is a Contentful **entry id**, not a slug — e.g.
`/products/3Zm00jJhqGXn9F23WC1rsB`. A readable URL such as
`/products/aurora-desk-lamp` is a 404.

## Performance and accessibility reports

`LH/` holds Lighthouse reports for all three routes, captured against a **production
build** — not the dev server, which ships an unminified bundle and would measure
something else entirely. Each route has a before/after pair: `home.json` was taken
before the two fixes below, `home-after.json` after.

| Route | Report | Performance | Accessibility |
| --- | --- | --- | --- |
| `/` | `home` | 91 → **98** | 96 → **100** |
| `/products/[id]` | `detail` | 93 → **98** | 100 → 100 |
| `/cart` | `cart` | 93 → **98** | 100 → 100 |

Two changes account for the difference, and both are still readable in the reports:

- **`nitro.compressPublicAssets` is enabled**, for gzip and brotli. Nitro defaults it to
  `false`, so the built assets were previously served with no `Content-Encoding` at all;
  script transfer fell from roughly 228 KB to 80 KB per route. It covers **static public
  assets only** — the SSR HTML is not compressed by it.
- **`--accent` was darkened** from the prototype's `#0f7b6c` to `#0e7263`. Against
  `--accent-soft` the old value put the pressed category chip at 4.39:1, just under the
  4.5:1 AA threshold; the new one makes that pair 4.95:1 and improves every other accent
  pair with it. The dark theme overrides `--accent` entirely and was already passing.

The `.html` files are rendered from the `.json`, and are self-contained — Lighthouse
inlines its own CSS and JS, so they open straight from disk with no server:

`node LH/render.mjs`

The JSON is the report and the HTML is a view of it, so re-run that after replacing
either. Two caveats worth keeping: the scores above are **single runs**, so the exact
numbers move a little between runs — the compression figure does not, because it is a
property of the build rather than of the measurement. And Lighthouse's accessibility
audit is not the full axe ruleset; a separate `axe-core` scan across the three routes
found no violations in either the light or the dark theme, but its runner is not in this
repository.

## The Nitro route, and where it runs in production

The browser never talks to Contentful. Every read goes through one Nitro route —
`server/api/contentful/[operation].get.ts`, serving `homepage`, `products`,
`categories` and `product?id=…` — which holds the access token server-side. It is the
only file that makes a network call.

That is why the Contentful variables are unprefixed `NUXT_*` (**private**) and never
`NUXT_PUBLIC_*`: `NUXT_PUBLIC_*` values are inlined into the client bundle, so there is
no credential in the browser at all, and none in the SSR payload.

**Node — the default, and the only target built and verified.** Nitro compiles the
server to the `node-server` preset, producing `.output/server/index.mjs` as a long-lived
process. One Apollo client is memoised per process, and in dev the resolved Contentful
target is logged once per process. This is what `npm run build` gives you today.

## Layout

```
pages/            the three routes
components/       UI, one component per file
composables/      useHomepage / useProducts / useCategories / useProduct — all read the route
lib/contentful/   the Contentful layer: queries, adapters, client
lib/format.ts     the single formatPrice
stores/cart.ts    the Pinia cart: state, getters, actions
plugins/          cart persistence to localStorage
assets/styles/    design tokens + shared CSS
tests/            Vitest unit tests
LH/               Lighthouse reports for the three routes, plus the render script
HTML/             the static prototype — the design and accessibility reference
CLAUDE.md         how it is built, and why
```