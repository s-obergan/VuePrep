# 1. Server-render the listing and product pages rather than statically generating them

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

Northwind Supply has three routes: a product listing (`/`), a product detail page
(`/products/[id]`) and a cart (`/cart`). Every piece of content on the first two — the
catalogue, the categories, the site copy — is authored in Contentful and read over its
GraphQL Content API. Since the Nitro route landed, all of it is read server-side by
`server/api/contentful/[operation].get.ts`, which is the app's only path to Contentful
and the only thing holding the access token.

The question this ADR settles: should `/` and `/products/[id]` be rendered **per
request** (SSR) or **prerendered to static HTML at build time** (SSG, via
`nuxt generate` or `nitro.prerender`)?

Five properties of this app constrain the answer:

1. **Content changes on publish, not on deploy.** An editor publishing in Contentful is
   the normal way the site changes.
2. **Product ids are Contentful entry ids** (`3Zm00jJhqGXn9F23WC1rsB`), not slugs. The
   set of valid detail URLs is therefore the set of entry ids in the space, which the
   build does not know.
3. **The token boundary is a security boundary.** `NUXT_CONTENTFUL_*` variables are
   private and must stay server-side; the browser never talks to Contentful.
4. **`/cart` is client-only regardless.** The store is rehydrated from `localStorage`
   after hydration, so its server-rendered HTML is deliberately a placeholder — the
   empty state — that the client replaces.
5. **There is no cache anywhere in front of Contentful.** `useAsyncData` caches per
   request and per key and shares through the SSR payload, and the route deliberately has
   no `defineCachedEventHandler`.

Today the app server-renders because that is Nuxt's default: `nuxt.config.ts` sets
neither `ssr` nor `prerender`, nor any `routeRules`. That is an *implicit* decision, which
is the reason for writing this down.

## Decision

**Server-render `/` and `/products/[id]` on every request. Do not prerender them.**

The rendering mode is left as Nuxt's default, and this is now deliberate rather than
incidental: any change to `ssr`, `prerender` or `routeRules` in `nuxt.config.ts`
supersedes this ADR and should come with its own.

## Consequences

### Positive

- **Publishing in Contentful is sufficient to change the site.** No rebuild, no redeploy,
  no cache purge. This is what makes the Contentful authoring model worth having at all.
- **The build has no Contentful dependency.** `npm run build` neither needs nor embeds
  the credentials — verified by grepping the whole of `.output` for the token: zero hits.
  The built server reads `NUXT_*` from its environment at runtime. A build machine
  therefore needs no access to the space.
- **A new product is reachable the moment it is published.** No rebuild to pick up a new
  entry id, which SSG would require — and which it could not do reliably, since the ids
  are opaque and only discoverable by querying the catalogue.
- **SSR is required for the token boundary anyway.** Pages are rendered where the token
  lives, so the route and the render happen in the same process. An SSG build would move
  the Contentful read to build time instead, meaning the runtime would have no Contentful
  access at all.

### Negative

- **Every page view costs a server render plus Contentful round trips.** With no cache in
  front of the route, a request for `/` issues up to **four** GraphQL calls (homepage,
  products, categories — and homepage a second time, a known duplicate recorded as a
  follow-up in `CLAUDE.md`), and a detail view **two**. Under SSG those would be paid once
  per deploy. This is the real, ongoing price of the decision, and the reason the
  duplicate-homepage item is worth fixing before the catalogue grows.
- **The Nitro process is on the critical path for client-side navigation.** The browser
  no longer reaches Contentful directly, so a client-side route change needs our own
  server to answer. If it is down, pages render fallback copy rather than failing — but
  the content is wrong and only the server log says why.
- **No CDN-only deployment.** The app cannot be served as static files from a bucket; it
  needs a running server, whether Node, serverless or edge. See the README for where that
  server can run.
- **The render mode is not uniform, and cannot be.** `/cart` renders the same empty state
  under SSR, SSG or `ssr: false`, so the choice is moot there — the decision only has any
  effect on the two content routes.

## Alternatives considered

### Prerender everything (`nuxt generate`)

Rejected. Three reasons, in descending order of severity:

- **A credential-less build does not fail — it bakes the fallback.** `loadOrFallback`
  checks `isContentfulConfigured` *before* reaching for a config and returns the built-in
  copy rather than throwing, and the hint that would explain why is `import.meta.dev`-gated,
  so it is silent in a production build. On a CI machine, where `.env` is gitignored and
  therefore absent, `nuxt generate` would succeed and emit a static site reading
  "No products to show" — and being static, it would never correct itself. A wrong build
  that looks like a green build is the worst failure mode available here.
- **The detail route cannot be enumerated.** `/products/[id]` needs one prerendered page
  per entry id, and the ids are opaque Contentful entry ids rather than a slug list the
  build could derive. Enumerating them means querying the catalogue at build time — a
  second, build-only code path whose output drifts from the runtime's.
- **Publishing would stop updating the site**, which removes the main reason the content
  lives in Contentful. Content freshness would become coupled to deploy cadence.

### Hybrid: prerender the listing, server-render the detail page

Rejected *for now*, though it is the most defensible middle ground and should be revisited
if per-request cost ever matters. `/` has a fixed route, so it prerenders cleanly, while
`/products/[id]` keeps the runtime read. It was not taken because it buys little at this
size and costs a second mental model: the listing would go stale between deploys while the
detail pages did not, so the same product could show one price on the grid and another on
its own page — a class of bug that is invisible in development and confusing in
production.

### Caching the route (`routeRules` with `swr` / ISR)

Rejected. It would recover most of SSG's cost advantage while keeping runtime reads, but it
introduces a cache whose invalidation nobody owns: `useAsyncData` is currently the app's
only cache, and it is per-request and per-key, so there is exactly one thing to reason
about. A second, time-based layer would mean content could be stale for an unknown window
after a publish, which is the same freshness problem as SSG, only smaller and harder to
observe.

### Client-side only (`ssr: false`)

Rejected. It would remove the server render entirely and make the app a static shell, but
it forfeits server-rendered content — the accessibility and no-JS story in `CLAUDE.md`
depends on the catalogue being readable in the HTML source — and it does not remove the
need for the Nitro route, because the token still must not reach the browser.

## Notes

- The rendering mode is not configured anywhere; it is Nuxt's default. This ADR records
  the reasoning, not a config change.
- The "no cache" half of this decision is documented in `CLAUDE.md` under *The Nitro
  route*, together with the bundle measurement that motivated putting the route in front
  of Contentful in the first place.
- The duplicate-homepage fetch on `/` is recorded as a follow-up in `CLAUDE.md`. It is
  the largest single inefficiency this decision accepts, and fixing it does not change
  the decision.
