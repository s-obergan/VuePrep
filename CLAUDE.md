# Mini E-Commerce Storefront

A small learning project: a mini e-commerce storefront built with **Nuxt 3**.

## Purpose

Learning project — the goal is to practice Nuxt 3 fundamentals (file-based routing,
layouts, composables, server routes) on a realistic but small app. Keep the code
approachable and explicit; prefer clarity over cleverness.

## Scope

Three user-facing surfaces:

| Page | Route | Description |
| --- | --- | --- |
| Product listing | `/` | Grid of all products, filterable by category, each card linking to its detail page |
| Product detail | `/products/[id]` | Single product with description, specs, quantity picker, add to cart |
| Cart | `/cart` | Line items with quantity edit/remove, order summary, total |

A **working cart** is a core requirement — items persist across navigation and page
reloads, quantities are editable, and totals recalculate correctly.

## Stack

- **Vue 3** — the app is written in **TypeScript**: no plain-JS Vue files. Composition
  API, `<script setup lang="ts">` single-file components, typed props/emits/composables
- **Nuxt 3** — file-based routing, layouts, SSR. Pinned to `3.21.11`, the last 3.x, whose
  support window closed on **2026-07-31** — so the pinned version is already past its EOL.
  That is recorded rather than second-guessed, and the code is Nuxt-4-shaped in everything
  but directory layout. It deliberately does **not** set `future.compatibilityVersion: 4`,
  because that moves `srcDir` to `app/` and would break every path here
- **Nitro** — Nuxt's server engine, and where the Contentful GraphQL calls actually happen.
  One route carries them: `server/api/contentful/[operation].get.ts`, serving `homepage`,
  `products`, `categories` and `product?id=…` off a `switch`. It is the app's **only** path
  to Contentful — the browser calls it and never Contentful itself — which is what keeps
  the access token and Apollo Client server-side. SSR emits real content because the page's
  `useAsyncData` awaits that route, and because a relative `$fetch` on the server is
  dispatched **in-process** rather than over the loopback — see Contentful
- **Pinia** — the cart store (typed too, like the rest of the app), shaped as:
  - **state** — `items`, an array of `{ id, qty }`, plus a **non-persisted** `catalogue`
  - **getter** — `count`, `subtotal`, `shipping`, `total`, `lines` (items joined with
    their catalogue record)
  - **actions** — `add(id, qty)`, `remove(id)`, `setQty(id, qty)`, `clear()`, plus
    `setCatalogue(products)`, which is how a page that has already fetched the catalogue
    hands it over
- **Contentful** — site copy and the product catalogue are authored in Contentful and read
  over the **GraphQL Content API**. Request code lives in `lib/contentful/`; components
  never call `fetch` themselves, and since the route landed, neither does the browser
- **Apollo Client 4** — the transport under that layer, **core only**: `@apollo/client/core`,
  `/link` and `/errors`, and no `@nuxtjs/apollo`, no `@vue/apollo-composable`, no `useQuery`
  in a component. `lib/contentful/client.ts` is the only file that talks to it, so the layer
  stays framework-free and `useAsyncData` stays the cache. What it buys is a link pipeline,
  Apollo Devtools and a typed error taxonomy; it is now **server-only**, so it costs nothing
  in the browser bundle — see Contentful below for the measurement that proves it
- **Plain CSS driven by custom properties** (design tokens) — no UI framework. Tokens,
  base styles and the rules more than one component needs are in
  `assets/styles/main.css`; everything a single component owns outright is in that
  component's `<style scoped>` block, beside its markup

## The static HTML prototype: the design and accessibility reference

The UI was prototyped as static HTML in `HTML/` **before** any Nuxt code was written, and
these files are still the **design and accessibility reference** — structure, landmarks,
labelling, focus behaviour, and copy carry over from them. The Nuxt app now implements
them, so the reference leads: a change there is a change to what the app should look like,
not a description of what it happens to do.

The reference is not infallible, and one place where it lags the contract is worth knowing
before copying it: its `+`/`−` buttons carry `aria-label="Decrease quantity"`, with no
product named — so the Nuxt picker deliberately exceeds it, because naming the product is
non-negotiable here. Where the two disagree, the contract wins, and the difference is
noted in the code. The cart is where the reference needed the most correction — four
defects, listed under The cart below — so reading `HTML/cart.html` as already-correct is
the wrong way round.

```
HTML/
  index.html          product listing (literal markup for the catalogue)
  product.html        product detail (one worked example product)
  cart.html           cart (state-driven, rendered from the store)
  css/styles.css      design tokens + component styles
  js/store.js         catalogue + cart store (localStorage)
  assets/
    brand-mark.svg
    icons/cart.svg
    products/*.svg    one placeholder illustration per product
```

### Prototype constraints

Chosen so the pages work when opened directly from disk in a browser:

- Classic `<script>` tags only — **no ES modules**, since `file://` blocks module loading
- No `fetch` — the catalogue is an inline array in `js/store.js`, imagery is local SVG
- Cart state lives in `localStorage` under the key `enbw-cart`
- `index.html` and `product.html` carry **literal, hand-written markup** rather than
  rendering from the catalogue, so the HTML source shows the intended semantics. The
  product data is therefore duplicated between that markup and `store.js` — a
  prototype-only trade-off that collapses to a single source via `v-for` in Nuxt.

### Accessibility requirements (non-negotiable, carried into Nuxt)

These are the point of the prototype, not extras:

- **Semantic HTML** — landmarks (`header`/`nav`/`main`/`aside`/`footer`), one `h1` per
  page, no heading level skipped, `ul`/`li` for lists, `dl` for key–value specs,
  `table` with `caption` + `th scope` for the cart (it is genuinely tabular data)
- **Labelled form controls** — every input has a real `<label for>`; symbol-only
  buttons (`+`, `−`) carry an `aria-label` naming the product they affect; icon-only
  images use `alt=""` and rely on adjacent text
- **Alt text** — meaningful `alt` on content images, `alt=""` on decorative ones
- **Visible focus** — a strong `:focus-visible` outline on every interactive element,
  never removed; the skip link becomes visible on focus
- **Keyboard-operable flow** — the entire browse → detail → add to cart → edit cart
  journey is completable without a mouse, including focus management after the cart
  re-renders (focus is never dropped to `<body>`)

Feedback that keyboard and screen reader users would otherwise miss is exposed through
live regions (`role="status"`), and motion respects `prefers-reduced-motion`.

## Conventions

- Prices are numbers in EUR, formatted with `Intl.NumberFormat('de-DE', …)`, through the
  single `formatPrice` in `lib/format.ts`. The formatter is created once at module level so
  the server render and the browser agree character for character — a price formatted
  differently on each side is a hydration mismatch on every card
- Design tokens live in `:root` in `assets/styles/main.css`; reuse them instead of
  hardcoding colours and spacing
- Styles are split by ownership, not by size: `assets/styles/main.css` holds tokens, base
  styles, the chrome the layout owns, and the primitives more than one component needs
  (`.btn*`, `.field*`, `.qty*`, `.price`, `.note`, `.product-card__cat`, the toast, the
  empty state, and the whole cart table); every rule a single component owns outright lives
  in that component's `<style scoped>` block. A rule moves to the global file only when a
  second component genuinely needs it
- **A scoped rule cannot reach into a child component's markup.** Vue compiles a scoped
  selector to `…[data-v-<file>]` on its *last compound*, and only a child's **root** element
  carries the parent's id — so `.cart-table td` written in `pages/cart.vue` matches nothing,
  because the cells are `CartRow`'s. The cart table is the case that proves it: it is
  assembled from three templates (the page's `<table>`/`<caption>`/`<thead>`, `CartRow`'s
  `<tr>` and cells), and `.cart-col--num` is used on a header cell and on body cells alike.
  Hence one **global** Cart section rather than `:deep()` in two files. The other reason a
  rule has no scoped home is simply that the element is a child's root — which is why
  `.product-card*` and `.detail*` are the only blocks still component-owned
- Imports are **explicit** rather than relying on Nuxt's auto-imports —
  `import { useCartStore } from '~/stores/cart'`. Auto-imports still work and are used for
  Nuxt's own composables (`useHead`, `useRoute`, `useAsyncData`) and for the app's own
  composables inside components, but anything crossing a module boundary of the app's own
  making says where it came from. It reads as what it is, and it does not depend on a
  resolver's directory defaults
- **Product IDs are Contentful entry IDs, not slugs.** CLAUDE.md used to say they were
  kebab-case slugs (`aurora-desk-lamp`) and would become route params; the real space
  returns entry IDs (`3Zm00jJhqGXn9F23WC1rsB`), so `/products/aurora-desk-lamp` is a 404
  and `/products/3Zm00jJhqGXn9F23WC1rsB` is the product. Nothing is broken by this — the
  route param is passed straight into the by-id query, and the ids are opaque either way —
  but any hand-written link or example URL needs the real ID. A slug in the URL would need
  either a slug field on the content type plus a second query, or a `where` clause on
  `title`, and is not worth either yet
- A catalogue record carries what the **model** has, and the model is smaller than the
  prototype: `title`, `teaserText`, `category`, `image`, `price` and nothing else. Anything
  the reference shows that has no field behind it is omitted rather than invented — see the
  follow-ups below
- Two data shapes exist and must not be conflated:
  - **`CatalogueProduct`** — a catalogue record. As authored in Contentful: `title`,
    `teaserText`, `category` (reference), `image` (asset), `price`. As normalised for
    components: the same **Contentful field names**, with `sys.id` left where Contentful puts
    it, and only the values that are unsafe to render made safe — `title: string`,
    `teaserText?`, `category: CatalogueCategory | null`, `image: ProductImage | null`,
    `price: number`
  - **`CartLine`** — what the cart renders: `qty`, the joined `product`, and a derived
    `lineTotal`
  Only `{ id, qty }` is ever persisted; `product` and `lineTotal` are derived on read. Both
  are real TypeScript types in `stores/cart.ts`, and only `CartLine` carries the extra
  fields. The persistence plugin writes `state.items` and nothing else, so "only `{ id, qty }`
  is persisted" is enforced by construction rather than by remembering it
- **The id stays at `sys.id`.** The normalised record is a *narrowing* of Contentful's own
  shape, not a translation of it, so the entry id is read as `product.sys.id` — in
  `stores/cart.ts`'s `lines`/`setCatalogue`/`add`, both components, both pages. It is the most
  visible consequence of that choice and it touches six files; if it ever reads worse than it
  reads honest, lifting it back is a one-line change inside the adapter, which is the point of
  having one. The join key in `lines` is the Contentful entry id either way — see the entry-id
  note above, which is also why the detail route takes one
- Catalogue lookup is fallible: `fetchProduct(id)` returns `CatalogueProduct | null`. Both
  callers narrow the `null` rather than asserting it away — the store's `lines` skips an id
  with no matching product, and the detail page renders its not-found state
- **A `useAsyncData` handler must not resolve to `null` or `undefined`.** Nuxt cannot then
  tell "not fetched yet" from "fetched, and there was nothing", so the result never reaches
  the payload — and the client, finding no data where the server had some, silently issues
  the request a second time after hydration. So `useProduct` resolves a **`ProductLookup`
  wrapper** (`{ product: CatalogueProduct | null }`) rather than `CatalogueProduct | null`,
  and the detail page unwraps it in one `computed`. It looks like indirection and is not:
  collapsing it back to `CatalogueProduct | null` reintroduces the duplicate request on every
  unknown id, which is the path
  a broken link, a stale bookmark or a crawler takes. In dev Nuxt names the offending call
  site in a warning; in production there is no warning at all, only the wasted request — so
  this is a rule to keep, not a symptom to watch for
- **The prototype's `name` and `stock` fields no longer exist.** Contentful calls the name
  `title`, and there is no stock count anywhere in the model. This mattered beyond a rename:
  the prototype's quantity picker clamped to `stock` and the card showed an "Only N left"
  hint, so there was nothing left to clamp to. **Settled: a fixed cap of 99**, exported as
  `MAX_QTY` from `stores/cart.ts` and imported by the picker and the cart row so the `max`
  attribute, the hint copy, the `+` button's disabled state and the store's clamp are one
  number. A cap was chosen over no limit because an unbounded field lets a typo become a
  five-figure order with no warning; `MAX_QTY` is the constant that goes away when a real
  stock field arrives

### Contentful

- The layer is one job per file under `lib/contentful/`:
  `schema` (content type + field IDs) → `queries` (GraphQL documents, as plain strings) →
  `config` (env vars) → `client` (the only network call, over Apollo) → `fetchers` (query →
  adapter → shape) → `content` (the **narrowing adapters**, pure). There are **two public
  surfaces**, and which one a file imports is load-bearing:
  - **`index.ts`** — client-safe: `config` helpers, the error classes, the adapters and
    their types, and the raw response types. This is what components, pages, `stores/cart.ts`
    and the composables import
  - **`server.ts`** — server-only: `client`, `fetchers`, `safe-fetch`, `queries`, `schema`.
    Imported by `server/` and by nothing under `app/`, `pages/`, `components/` or
    `composables/`
- **The two surfaces are split by file structure, not by tree-shaking, and that is
  deliberate.** Apollo shipping to the browser was the thing this change existed to undo, and
  leaving it to the bundler would not have worked: `verbatimModuleSyntax` keeps a value
  `import` even when every binding from it is unused, and `client.ts` has a top-level
  `new ApolloLink(…)` with no `/*#__PURE__*/` annotation and no `sideEffects: false` in
  `package.json`. So one retained value import would have kept all of Apollo alive. The split
  only needed `content.ts` to stop importing `./client`, which is why the `fetch*` functions
  moved out into `fetchers.ts`. **A stray `import { fetchProducts } from
  '~/lib/contentful/server'` in a component would silently undo it** — nothing fails, the
  bundle just grows. `content.ts` and `index.ts` both carry a warning to that effect
- **`config` is a parameter, not an ambient read.** `client.ts` does not go looking for
  environment variables; it takes a `ContentfulConfig` in `RequestOptions`, which is
  required, so "which space am I talking to" is visible at every call site. The single place
  that reads the environment is now `server/utils/contentful.ts`, which wraps
  `useRuntimeConfig(event).contentful` — the **event** form, so the request is explicit.
  Rejected: calling `useRuntimeConfig()` inside `config.ts` (it appears to work from inside a
  Nitro handler, where the context happens to be active, then fails opaquely from a script or
  a test and couples the data layer to the framework), and a module-level
  `configureContentful()` (module state on a long-lived Node server leaks between concurrent
  requests)
- **Apollo is the transport, not a second cache.** `request()` calls `ApolloClient.query()`
  with `fetchPolicy: 'no-cache'`, set **per call** rather than in `defaultOptions.query` — a
  default would be silently inherited by any future `watchQuery()` and start caching behind
  `useAsyncData`'s back. `useAsyncData` already caches per key and the payload already
  dedupes the catalogue, so Apollo's `InMemoryCache` would be a second, mostly unconsulted
  layer that risked growing the SSR payload. It is constructed and then never consulted;
  `queryDeduplication` is likewise off, so exactly one request goes out per `query()` call.
  "Apollo should reduce network traffic" is therefore the wrong expectation here, and that is
  a decision rather than an oversight
- **One `ApolloClient`, memoised, bounded to one entry** — keyed by endpoint *and* token,
  replacing the previous client rather than accumulating. This is the deliberate exception to
  the module-state objection two bullets up, and it is safe for exactly the reason that
  objection exists: the objection is that state on a long-lived Node server leaks between
  concurrent requests, and with `no-cache` the client holds no per-request state to leak — a
  request captures its client synchronously and never consults another. A `Map` keyed by
  config would be unbounded in principle; one entry plus a key comparison is bounded by
  construction. Changing `.env` therefore needs a restart, which was already true
- **`gql()` is applied in `client.ts`; `queries.ts` keeps returning plain strings.** That
  preserves the documented "safe to paste into Contentful's GraphiQL explorer" property, and
  it is now required rather than merely tidy: `client.query()` in v4 rejects a string (a dev
  invariant), so the document must be parsed. Parsed documents are memoised in a module-level
  `Map` keyed by source string — unbounded in principle, bounded in practice only because
  `queries.ts` interpolates module constants. The rule that makes that safe is the ordinary
  one: **dynamic values go in `variables`, never interpolated into the document**
- **A dev-only `ApolloLink` logs every operation** — name, variables, duration, and on
  failure the message. Gated on `import.meta.dev`, so the branch is eliminated from the
  production build (verified: grepping `.output` for the log prefix finds nothing). **It must
  never log headers**, and cannot: the `Authorization` header is `HttpLink`'s config, not part
  of the operation's context, so the token has no path into a terminal or a log file (verified:
  the dev log contains no `Authorization`/`Bearer`/`accessToken`). This link is the answer to
  "how do I debug a Contentful request?", and it earned its keep on the day it was added — see
  the duplicate-homepage follow-up
- **Apollo's errors are mapped onto the three existing classes**, so `safe-fetch.ts` is
  untouched and the property that matters survives: a `ContentfulQueryError` still **quotes the
  field name Contentful did not recognise**. `ServerError` / `ServerParseError` →
  `ContentfulHttpError` (the 401/403/404 hints intact); `CombinedGraphQLErrors` →
  `ContentfulQueryError` carrying every message as `details`; an abort or timeout rethrown
  unchanged. A failure that is not an Apollo error at all — `BaseHttpLink` rethrows the raw
  `TypeError` — becomes the "Could not reach Contentful at <host>" message. The Apollo error is
  deliberately **not** attached as `cause` on the HTTP paths even though it would be useful: it
  carries a live `Response`, which `safe-fetch.ts` would `console.warn` and Node would expand
  into the terminal
- **What Apollo cost in bytes was measured, not estimated — and then measured again when the
  route took it back off.** Both numbers are kept, because the pair is the argument for the
  route:
  - **With Apollo in the browser** (before the route): **242,588 → 436,036 raw** and
    **92,861 → 150,129 gzip**, i.e. **+193,448 raw (+80%)** and **+57,268 gzip (+62%)**. The
    baseline contained no Apollo at all (0 `__APOLLO_CLIENT__` markers — fully tree-shaken
    when nothing imports it), so that was Apollo's weight and nothing else. It landed in the
    **browser** bundle because the composables importing the layer ran client-side.
  - **After the route**: **236,632 raw / 90,695 gzip** — **5,956 raw and 2,166 gzip *below*
    the pre-Apollo baseline**, at 0 `__APOLLO_CLIENT__` markers. Smaller than the baseline
    rather than merely back to it, because the client also stopped carrying the GraphQL
    documents, `schema.ts`, `config.ts`, `safe-fetch.ts` and the adapters, all of which are
    now server-only. The client keeps one small `$fetch` wrapper instead
  Both figures are `.output/public/*.js`, raw length plus `zlib.gzipSync(b, { level: 9 })`.
  The lesson worth keeping is that the second measurement is what made the first one
  actionable: "Apollo costs 57 KB gzipped" is a fact, and "and here is the change that gets
  it back" is a decision
- **Normalised values are shared and must be treated as immutable.** `useAsyncData` caches
  per key, so the array a page receives is the same array another consumer has; the SSR
  payload even serialises it once and references it twice. Anything derived goes through
  `computed`; nothing mutates what the layer returned. `DeepReadonly<>` would enforce this
  and was rejected — it ripples through every type and prop to guard a mistake nobody has
  made
- `schema.ts` is the single place to edit when the Contentful model changes. Every
  collection is queried under a fixed alias (`homepage:`, `categories:`, `products:`), so
  renaming a content type changes the query but never the shape of the response or the
  types. The **by-id query reuses the same alias**, which is why adding it needed no change
  to `types.ts` at all — and it deliberately reuses `FIELDS.product` verbatim, so it cannot
  drift from the listing's query
- **One singleton holds the whole page.** The `Homepage` content type carries the header
  wordmark, both nav labels, both footer lines, and the page's own `pageTitle` (the `<h1>`)
  and `browserTitle` (the document `<title>`), so that copy is authored once instead of
  duplicated per page. The consequence, which is deliberate: every route fetches that one
  entry, so it is load-bearing for the whole site
- `fetchHomepageContent` normalises that entry into a `HomepageContent` with a nested
  `chrome` slice, rather than flattening it. The consumers differ — the layout wants the
  header and footer labels, the page wants its `<h1>`, the document head wants the browser
  title — so naming the slice for what it is *for* keeps the layout's contract honest and
  means moving the chrome fields to a dedicated settings singleton later would not touch a
  component
- **`pageTitle` and `browserTitle` can only ever describe one page.** They are single
  values on one shared entry, so the listing uses them and the detail page cannot: it
  derives its own title from the product (`${title} · Northwind Supply`) and ignores both.
  That is a real limitation of the singleton, not a bug, and the fix is a per-page title
  field keyed by route or a separate content type per page — neither is worth it for one
  page. `useSeoMeta`'s `title` takes a function, so the derived title keeps tracking the
  product after a client-side navigation instead of freezing at the first render
- `browserTitle` drives the document title through `useHead({ title })`, and an absent value
  is passed straight through rather than defaulted here: unhead ignores an absent title and
  leaves the one `nuxt.config.ts` sets, which is the fallback the prototype's static
  `<title>` used to provide. Substituting a string would overwrite that fallback with
  something the page invented. In Nuxt the prototype's `useDocumentTitle` composable has no
  equivalent because there is nothing left for it to do
- **Collections state their `limit` and always request `total`.** Contentful caps a query
  at 100 entries without saying so, and `total` is the only way to notice the cap biting —
  `fetchCategories` logs when `items.length < total`. The GraphQL API does not expose the
  order entries are dragged into in the web app, so `ORDER` in `schema.ts` supplies a
  deterministic one; a curated order needs its own field
- A category with no name is dropped in the adapter rather than passed on: it would render as
  an unlabelled filter chip. `fetchCategories` reports how many were dropped, because losing
  content silently is worse than either keeping it or refusing it — and that **counting was
  deliberately kept** when the adapters arrived, rather than being replaced by the adapter's
  return type: `name: string` describes the survivors and says nothing about what was dropped,
  so removing the log would have been a pure observability regression. The normalised
  `CatalogueCategory` carries `sys.id` as well as `name`, since the ID — not display text an
  editor may rewrite — is what a filter value or route param should be built from
- A **product** is dropped only when it cannot function at all: no `title` to render, or no
  `price`. Price counts as load-bearing because it feeds the cart's arithmetic — a missing
  one would carry `null` through `subtotal` into `total`. A missing `image` or `category` is
  not load-bearing, so those products are kept with `image: null` / `category: null`: still
  sellable, just without media, and simply not matching a category filter. `fetchProducts`
  reports what it dropped, for the same reason `fetchCategories` does
- **`price` is a whole number of euros, read as-is.** `18` is €18.00 — the `.00` is
  `Intl.NumberFormat`'s doing, not the stored value — and the adapter passes the number
  through with no arithmetic, matching the prototype's `formatPrice(product.price)`
- An `Int` field **cannot hold €18.50**: GraphQL's `Int` is a signed 32-bit integer with no
  fractional part, so a decimal is rejected by the API rather than quietly rounded. Pricing
  in cents, or in euros-and-cents, therefore needs the field's type changed in Contentful
  from **Integer** to **Number** (GraphQL `Float`) — `asNumber` already accepts a decimal and
  nothing else in the layer would change. **This collides with the prototype catalogue**,
  which has decimal prices (`nordic-ceramic-mug` at 18.50, as `HTML/js/store.js` and the
  literal markup both show): with an `Int` that mug can only be €18 or €19, so either those
  prices get rounded or the field type changes. Worth knowing where the tension really is:
  it is only in Contentful. The app already adds fractional euros happily — shipping is a
  flat €4.95 and the free-shipping threshold is €75 — so `Int` prices and a `Float` shipping
  rate coexist, and a total can end in cents that no product price could produce
- **Asset URLs come back protocol-relative** (`//images.ctfassets.net/…`), which is no use
  as an `img src`, so the adapter makes them absolute. Alt text comes from the asset's
  **Description** field — Contentful has no separate alt field — falling back to the product
  title when Description is empty, because a non-empty `alt` on a content image is
  non-negotiable. **The fallback is what is currently in use**: every asset in the real space
  has an empty Description, so the detail page's hero reads `alt="Aurora Desk Lamp"`, which
  duplicates the `<h1>` directly beneath it. The code is right and the content is thin — the
  fix is authoring Description, and a description of what the picture *shows* is better than
  the name it repeats. `width` and `height` are carried through as a pair so the `<img>` can
  declare intrinsic dimensions and the grid does not jump while images load
- **A missing field must never be added to a query speculatively.** Contentful rejects the
  entire query if any field is unknown, so a field added to `FIELDS.product` for one page's
  benefit would take the listing down with it. That is why the three things the reference
  shows but the model lacks are omitted from the query rather than asked for optimistically
- A **reference** resolves inline, one level deep, and needs a sub-selection rather than a
  field name. `products.category` uses `... on Category`, because a reference typed as "any
  entry" resolves to the generic `Entry` interface — the inline fragment is valid either way.
  Those sub-selections live in `SELECTIONS` in `schema.ts`, alongside the scalar field lists,
  so a model change is still a one-file edit
- Category filtering is **client-side** for now: one `fetchProducts` call returns the whole
  catalogue and the listing filters the array, matching the prototype's filter chips. When
  the catalogue outgrows a single response, the query gains a
  `where: { category: { sys: { id } } }` argument instead — `request` already accepts
  variables
- **The adapters narrow; they do not translate.** Contentful's values are made safe before a
  component sees them, but nothing is renamed, moved or dropped on the way: the fields keep
  Contentful's own names (`title`, `teaserText`, `price`, `category`, `image`) and the id
  stays at `sys.id`. Only three things change, and each is a value that cannot be rendered as
  it arrives — `price` is a number rather than possibly `null` (the cart must not do
  arithmetic on `null`), `image.url` is absolute, and `image.alt` is a non-empty string. The
  helpers behind that are unchanged: `asText` / `asNumber` accept whatever the field really
  holds (a Rich Text field arrives as an object, not a string) and return `undefined` when
  there is nothing usable, so a component falls back to its own copy instead of rendering
  `[object Object]`
- Content that fails to load falls back to built-in copy rather than an empty page, and the
  reason is logged. A wrong field name is therefore a log line, not a blank screen:
  Contentful rejects the whole query if any field is unknown. The guard lives in
  `loadOrFallback`, which checks `isContentfulConfigured` **before** reaching for a config —
  without it, an empty `.env` would make every detail URL throw out of the route and answer
  500, while the listing page quietly worked
- **The token boundary is a security boundary, and the route is what enforces it.**
  `NUXT_PUBLIC_*` variables are inlined into the client bundle and serialised into the SSR
  payload; unprefixed `NUXT_*` ones are not. The Contentful settings are therefore
  `runtimeConfig.contentful` (**private**), not `runtimeConfig.public.contentful`, and the
  Delivery token is under `NUXT_CONTENTFUL_ACCESS_TOKEN`. This used to be the other way
  round, and the old rule was conditional — a Delivery token *may* be public, a Preview or
  Management token may not. Rather than run two classes of credential with two safety
  stories, everything moved behind the route, so the rule is now unconditional: **no
  Contentful credential is ever client-side.** Verified by grepping the whole of `.output`
  (client *and* server) for the token — 0 hits, because the build does not embed `.env` at
  all. The remaining consequence is that a Preview token needs no new machinery, only the
  variable
- **Preview is still not implemented, but it is now a small change rather than a
  restructure.** The config, the queries and the env files do not know about it. When it
  comes back it belongs in the same route — reading
  `useRuntimeConfig(event).contentful.previewToken` (`NUXT_CONTENTFUL_PREVIEW_TOKEN`,
  unprefixed, which is where it would have had to go anyway — and it must accept **only a
  named operation, never a raw query**, or the origin becomes an open GraphQL proxy pointed
  at the space. **The route satisfies that by construction:** the operation is a path segment
  matched against a `switch`, so there is no query document in the request to abuse. What is
  left is a `preview` flag on the request, its own queries, and a cache key that keeps drafts
  from being served to everyone else
- **Every runtime-config key must be declared** in `nuxt.config.ts`, or its environment
  variable is silently ignored — which in this app looks exactly like "Contentful has no
  content", the single most confusing failure available here. The mitigation is
  `describeConfig`, logged once in dev, which prints the resolved target without the token
- Credentials live in `.env`, which is gitignored; `.env.example` is the committed template.
  The dev server reads `.env` at startup, so changing it means restarting `npm run dev` — and
  in production nothing reads `.env` at all, only the real environment
- **`.env` is not baked into a build.** `nuxt build` does not embed it, and grepping the
  output for the token or the space ID finds nothing; the node-server preset reads
  `NUXT_*` from its environment at **runtime**. So `node .output/server/index.mjs` on its own
  renders the fallback copy, and a production check has to supply the variables —
  `set -a; . ./.env; set +a; node .output/server/index.mjs`. This is a property of how Nuxt
  works, not a bug, and getting it wrong produces a false "Contentful is broken" conclusion
- **`import.meta.dev`, not `import.meta.env.DEV`.** The layer runs inside Nitro; `import.meta.dev`
  is injected by both Nuxt's Vite build and Nitro, while `import.meta.env` is a Vite-client
  concept. Getting this wrong does not crash — the dev-only warnings simply stop appearing on
  the server, which is the kind of silence that costs an afternoon. It gates two things: the
  layer's warnings and Apollo's logging link. That has a consequence for verification worth
  stating, because it produces false confidence in both directions: **an empty production log
  is not evidence that content loaded**, since nothing in the layer logs on success there.
  Rendering the pages and reading the HTML is what proves it. And one thing is deliberately
  **not** gated on it — a *failure* is logged unconditionally, in production too, because the
  request now happens in the Nitro process where a production operator is the only one who
  can see it

### The Nitro route

This is the section to read before changing anything about how content is fetched.

- **One route carries every Contentful read**: `server/api/contentful/[operation].get.ts`,
  serving `GET /api/contentful/:operation` for `homepage`, `products`, `categories` and
  `product?id=<entry id>`. The four composables call it through
  `composables/useContentfulRequest.ts`'s `requestContentful()`, which is the only place in
  the app that knows the URL shape. `composables/useContentful.ts` — which used to read the
  runtime config — is gone; its job moved to `server/utils/contentful.ts`
- **The route reuses `loadOrFallback` verbatim**, so the four calls moved rather than being
  rewritten: the never-rejects policy, the config guard and the once-per-process
  `describeConfig` log all survive intact. If the composables and the route ever disagree
  about the fallback for an operation, that is the bug, not a symptom
- **A Contentful failure is a `200` carrying fallback data, never a `5xx` — deliberately.**
  A rejected handler leaves **no entry in the SSR payload**, so on hydration the client finds
  no data where the server had some and re-requests. That is the `ProductLookup` trap in its
  general form, and it is why the failure has to stay a *value* at every hop. Genuine misuse
  still throws: an unknown operation is a 404 and a missing `id` a 400, both of which the
  composable's `catch` turns into the fallback
- ⚠️ **The route inherits the "a handler must not resolve to `null`" rule.** An h3 handler
  returning `null` answers **204 with no body**, `$fetch` resolves to `undefined`, and the
  composable's handler has nothing to return — a duplicate request on every unknown id. So
  `product` returns `{ product }`, wrapping a `null` rather than being one. `ProductLookup`
  now lives in `lib/contentful/content.ts`, because it is a **wire shape** the route and the
  composable both have to honour, not a local `useAsyncData` workaround
- **SSR dispatch of the route is in-process — no loopback, no TCP.** A relative `$fetch` on
  the server goes through Nitro's `localFetch`, which calls the route handler against a
  synthetic `node-mock-http` request/response pair. So the route costs no extra round trip
  during SSR, which is why moving the fetch behind it did not slow the server render down.
  Two consequences: incoming headers and cookies are **not** forwarded (the route needs no
  auth — it adds its own `Authorization` to Contentful), and it is why instrumenting the
  route to print `getRequestIP(event)` shows **`undefined`** rather than `127.0.0.1`. That is
  the check to re-run if this is ever in doubt
- **`retry: 0` on the client's `$fetch` is not optional.** ofetch retries `408/409/425/429/500/502/503/504`
  once by default, so a 5xx from our own route would silently double the Contentful round trip
  behind it
- **No caching on the route.** No `defineCachedEventHandler`: `useAsyncData` is the app's only
  cache, keyed per page and shared through the SSR payload, and a second cache in front of
  Contentful would be a layer whose invalidation nobody owns
- **A cancelled request stops one hop short of Contentful.** `useAsyncData` really does hand
  its handler a signal — it is the handler's **second** argument, `(nuxtApp, { signal })`, and
  the comment in `client.ts` that claimed otherwise was wrong for a long time. The composables
  pass it to `$fetch`, so cancellation aborts the request to our route; the route's own call
  to Contentful has no client signal to inherit, because h3 does not wire a client disconnect
  to a handler abort. Shallower than before, when the signal reached Apollo directly, and the
  only place it *can* go now that the browser is not the caller

## What the app does today, and what it deliberately does not

### Routes

| Route | State |
| --- | --- |
| `/` | Built — SSR, homepage + catalogue + categories awaited, category filtering client-side |
| `/products/[id]` | Built — SSR, `useAsyncData` keyed on the id |
| `/cart` | Built — SSR renders the empty state (see below), so the table is client-only; fetches the catalogue itself |
| `GET /api/contentful/:operation` | Built — the only path to Contentful; see The Nitro route above. Not a page, and there is no UI for it |

Each page's requests are the route's operations: `/` wants `homepage`, `products` and
`categories`; `/cart` wants `homepage` and `products`; a product page wants `homepage` and
`product`. Measured, not assumed — instrumenting the route and rendering each page shows
exactly those, with one exception: the **listing** asks for `homepage` twice, which is the
duplicate-fetch follow-up recorded below and not something the route introduced.

The dev server runs on **port 3000**, Nuxt's default, where the prototype's Vite setup used
5173. Scripts are `npm run dev` / `build` / `preview` / `typecheck`, and `postinstall` runs
`nuxt prepare` — load-bearing, because `tsconfig.json` extends a generated file that does not
exist on a fresh clone otherwise.

### The cart

The store is complete — state, all five getters, `add` / `remove` / `setQty` / `clear` /
`setCatalogue` — and all three pages drive it. All five getters now have a consumer, on
`/cart`; `.btn--link` gained one there too, and **`.btn--ghost` still has none** (the
reference's cart uses `.btn--primary` and `.btn--link`). Two things follow from the
rehydration timing:

- **The badge *and the whole cart table* are client-only.** The store starts empty on the
  server, so the SSR HTML says `0` and renders the empty state; the persistence plugin
  patches both inside `onNuxtReady` — after hydration, deliberately, because patching earlier
  would make the client's first render disagree with the SSR HTML and Vue would discard the
  DOM. The cost is a page that briefly says "Your cart is empty" and then fills in. The
  proper fix is a cookie the server can read; deferred
- **`/cart` fetches the catalogue itself** (`useProducts()` + `setCatalogue`), because
  `lines` joins the stored items against `cart.catalogue` and a reload or a bookmarked link
  never ran the listing. Without that request every line would be dropped and the page would
  report an empty cart while the badge said otherwise. It shares the listing's `useAsyncData`
  key, so it is one request, cached, not a second copy of the catalogue
- **A stored id with no product behind it is counted, not hidden.** `lines` drops it — the
  arithmetic must never see a `null` price — so the page subtracts: `items.length -
  lines.length` is a "not shown" count, rendered as a `role="status"` note above the table,
  and when *nothing* can be shown the empty-state panel says the same thing in its own words
  instead. Which of the two states it is, is the one place `count` and `lines.length` are
  allowed to disagree

`setCatalogue` **merges by id rather than replacing**, which is a deviation from what its name
suggests and is documented at the action. It has to: a deep-linked `/products/<id>` never ran
the listing, so it hands over the single product it fetched — and replace semantics would make
that call wipe the catalogue the listing had already provided. Merging makes all three callers
correct at once.

**Four places the reference was not copied**, each commented where it lives, because the
prototype is normally the thing to follow:

1. `.cart-col--num { text-align: right }` as written has specificity (0,1,0) and loses to
   `.cart-table th, .cart-table td { text-align: left }` at (0,1,1) — so the numeric columns
   were in fact left-aligned. The intent is restored with a selector that wins
2. `display: flex` on the `<th>` makes CSS table fixup wrap it in an anonymous table-cell, so
   the cell's padding and border are drawn at the wrong box. The cell stays a cell; a `<div>`
   inside it does the flexing
3. A stepper press that **disables the button that was pressed** dropped focus to `<body>`,
   which this file forbids outright. Fixed in `CartRow` and in `QuantityPicker`, which had
   the same latent bug. The store keeps one rule as a result: a quantity is always
   `1…MAX_QTY`, and a cleared field is translated into a removal by the row rather than
   overloaded onto `setQty` as the reference did
4. The free-shipping note read "on orders **over** 75,00 €" while the rule is
   `subtotal >= 75`. The copy is built from `formatPrice(FREE_SHIPPING_FROM)` so the number
   cannot drift from the threshold

One further departure is a coherence fix rather than a defect: pressing a stepper while the
field holds a typed value fires `change` and then `click`, and the reference announced both.
The page's writer holds the message for a moment so one interaction announces once.

### Follow-ups

Named so they are known gaps rather than discoveries:

- **Three things the reference shows that the model cannot supply**, all omitted from the
  detail page: the `.stock` line (there is no stock count anywhere), the long
  `.detail__description` (only `teaserText`, already shown as the tagline), and the `.specs`
  `<dl>` (no specification fields). Each needs a Contentful field before it needs markup, and
  each is a `FIELDS.product` addition that must land *with* the model change and never before
  it. A consequence worth keeping: the detail page has exactly one heading, so "no heading
  level skipped" still holds
- **An unknown product returns HTTP 200.** The not-found state is rendered inside the page
  rather than thrown with `createError`, because `error.vue` renders outside the layout
  system: it cannot use `NuxtLayout`, so the skip link, header, `<main>` and footer would all
  have to be duplicated there, and its own `useHomepage()` would share no cache key with any
  layout's. That is a lot of chrome to buy a status code the accessibility contract never
  asked for. The page carries `noindex` instead, and the honest fix — `createError` plus a
  chrome-owning `error.vue` — is small whenever it is wanted
- **No JavaScript means no filtering, no add-to-cart and no cart.** The first two are click
  handlers over content that *is* server-rendered, so the catalogue is readable and every
  product reachable without JS; but `/cart` renders its empty state and stays there, because
  the store it would read is rehydrated from `localStorage` by a plugin. Parity with the
  prototype rather than a regression, and the same is true of the badge
- **Remove and Clear cart have no confirmation and no undo.** The reference has neither, and
  an undo is a feature rather than a port — but Clear cart in particular is one click that
  empties everything, and the toast only says it happened
- **A line whose product has gone cannot be removed individually.** It is not in `lines`, so
  it has no row and no Remove button; the counts say something is missing, and the only way
  to clear it is Clear cart (or `localStorage`). Rare — it needs a product deleted from
  Contentful after it was added — and the fix is to render such lines as rows with no price
  rather than skipping them
- **The row's Remove button is a link-styled control, under 44px tall.** It is the
  `.btn--link` the reference specifies, and it is the smallest pointer target on the cart
  page; worth padding out when someone next touches the cart CSS
- **`watch: [id]` is not on the detail page's `useAsyncData`, though the plan called for it.**
  It is redundant: a reactive `key` already causes a new entry and a fetch when it changes
  (`asyncData.js` watches the key with `flush: 'sync'`), so a `watch` on the same ref asks for
  what is already happening
- **Client-side navigation now depends on our own server being up.** The browser no longer
  reaches Contentful directly, so a client-side route change needs `/api/contentful/*` to
  answer. If the Nitro process is down, the page renders fallback copy rather than failing —
  the composable's `catch` sees to that — but the content is wrong and only the server log
  says why. Before the route, a client-side navigation would still have worked with the
  Nitro server wedged. That is the price of the token leaving the browser, and it is
  accepted rather than mitigated; SSR is unaffected, since an in-process dispatch cannot
  fail for this reason
- **`/api/contentful/*` is a new public endpoint on our own origin.** Anyone can call it, so
  the space's published content is readable without the token — which is exactly what
  publishing it already meant. What bounds the exposure is the allowlist: four read-only
  operations, no mutations, no way to pass a query document, and no preview content. Worth
  remembering before adding a fifth operation, particularly if it ever reads draft entries
- **The listing page fetches the `Homepage` singleton twice.** The layout and `pages/index.vue`
  both `await useHomepage()`, and Nuxt's `useAsyncData` does not save the second call: on the
  server `getCachedData` returns nothing, and with the default `dedupe: 'cancel'` a second call
  under the same key **re-runs the handler** rather than reusing the in-flight or completed
  promise (`asyncData.js`, the `cause: 'initial'` branch). Measured rather than inferred:
  instrumenting the handler shows **two invocations ~43 ms apart for a single request to `/`** —
  and the same two on the pre-Apollo transport, so this is Nuxt's semantics and not something
  any rewrite introduced. It survived the move to the route unchanged, and the easiest way to
  see it now is to log at the top of the route handler and render `/`: two `homepage` hits,
  one `products`, one `categories`. (Apollo's logging link is what first made it visible;
  before that, the duplicate request left no trace anywhere.) `/cart` and `/products/[id]`
  fetch the entry once each, because only the layout asks there. Harmless — the second result
  overwrites the first under the same payload key, so every page is correct — but it is one
  wasted request per listing view. Fixing it means one caller stops fetching (a
  `useState`-style handoff, or a `getCachedData` that reads `payload.data[key]` on the server
  too), which changes how the layout gets its copy
- **No automated accessibility scanning.** axe or Lighthouse would be worth adding and has not
  been; the contract is currently held by the prototype, the markup, and manual checks
- **Part of the contract is verified only in the SSR HTML.** Landmarks, labels,
  `aria-current`, the `role="status"` regions and the heading structure are all visible in the
  source and were checked there. What has **not** been checked in a real browser: that a
  client-side navigation between two product pages issues a fresh request rather than reusing
  the cached one — and, since the route, that it issues **exactly one** request to
  `/api/contentful/product` rather than one per `useAsyncData` key change — that the badge
  changes without a flicker, that focus survives filtering and
  the cart re-render, and that a screen reader actually announces the live regions. On `/cart`
  specifically, the unverified list is the empty-state-to-table swap without a hydration
  warning, focus after a removal and at the ends of a stepper's range (`document.activeElement`
  must not be `<body>`), and the `localStorage['enbw-cart']` round-trip holding `{ id, qty }`
  and nothing else. Those need a browser, and no amount of HTML inspection substitutes
- **An empty `src/` directory is left over** from before the migration. It cannot currently be
  removed — another process holds it — and both git and Nuxt ignore it. Harmless, and worth
  deleting by hand whenever it unlocks
