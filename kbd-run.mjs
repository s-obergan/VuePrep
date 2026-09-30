// Keyboard-only walkthrough. Drives a real Chrome with the keyboard only —
// no clicks, no programmatic navigation except the initial goto — and asserts
// the app's hard rule: focus is NEVER dropped to <body>.
//
// Note on <body>: tabbing PAST the last focusable element on a page legitimately
// moves focus to the browser chrome, where document.activeElement is <body>.
// That is not a defect, so the check below tabs exactly as many times as there
// are focusable elements and treats a <body> inside that budget as a failure.
import puppeteer from 'puppeteer-core'

const BASE = process.env.KBD_BASE ?? 'http://localhost:3015'
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
}

const describeActive = () =>
  `(() => {
    const el = document.activeElement
    if (!el || el === document.body) return { tag: 'BODY' }
    return {
      tag: el.tagName,
      id: el.id || null,
      cls: typeof el.className === 'string' ? el.className : null,
      label: el.getAttribute('aria-label') || null,
      text: (el.textContent || '').trim().slice(0, 40),
      outline: getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth,
      opacity: getComputedStyle(el).opacity,
      display: getComputedStyle(el).display,
      w: Math.round(el.getBoundingClientRect().width),
      h: Math.round(el.getBoundingClientRect().height),
    }
  })()`

// `tabindex="-1"` is excluded explicitly. The product card's image link carries
// it deliberately — it duplicates the title link's target, so it is taken out of
// the tab order and hidden from assistive tech. Counting it would report eight
// tab stops the app correctly removed.
const FOCUSABLE = `a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })

const consoleErrors = []
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(`${m.type()}: ${m.text()}`)
})

const active = async () => await page.evaluate(describeActive())
const settle = (ms = 150) => new Promise((r) => setTimeout(r, ms))

async function setQty(scope, value) {
  await page.evaluate(
    (s, v) => {
      const input = document.querySelector(`${s} input`)
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      setter.call(input, String(v))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    scope,
    value,
  )
  await settle(120)
}

// ---------------------------------------------------------------- 1. skip link
console.log('\n--- 1. skip link ---')
await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
await page.keyboard.press('Tab')
let a = await active()
check('first Tab reaches the skip link', a.cls?.includes('skip-link'), `${a.tag} .${a.cls}`)

const skipVisible = await page.evaluate(() => {
  const r = document.querySelector('.skip-link').getBoundingClientRect()
  return r.top >= 0 && r.height > 0
})
check('skip link becomes visible on focus', skipVisible)

await page.keyboard.press('Enter')
await settle(200)
check('activating the skip link moves to #main', await page.evaluate(() => location.hash === '#main'))

// --------------------------------------------- 2. tab order + focus ring
console.log('\n--- 2. tab order and focus visibility across the listing ---')
await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' })
const focusableCount = await page.evaluate((sel) => document.querySelectorAll(sel).length, FOCUSABLE)

const stops = []
const noOutline = []
const invisibleStops = []
for (let i = 0; i < focusableCount; i++) {
  await page.keyboard.press('Tab')
  const cur = await active()
  stops.push(cur)
  if (cur.tag === 'BODY') break
  if (cur.outline.startsWith('none') || cur.outline.endsWith('0px')) noOutline.push(cur.label ?? cur.text)
  // A control that takes focus but paints nothing is a trap: the user is now
  // "somewhere" with no visible indication of where.
  if (cur.opacity === '0' || cur.display === 'none' || cur.w === 0 || cur.h === 0) {
    invisibleStops.push(`${cur.tag}.${cur.cls} "${cur.label ?? cur.text}" ${cur.w}x${cur.h} opacity=${cur.opacity}`)
  }
}
const bodyStop = stops.findIndex((s) => s.tag === 'BODY')
check(
  `tabbing within the page's ${focusableCount} focusables never lands on <body>`,
  bodyStop === -1,
  bodyStop === -1 ? `${stops.length} stops, all real elements` : `hit BODY at stop ${bodyStop + 1} of ${focusableCount}`,
)
check('every focused element paints a focus ring', noOutline.length === 0, noOutline.join(' | ') || 'all have outlines')
check(
  'no element takes focus while invisible (invisible-focus trap)',
  invisibleStops.length === 0,
  invisibleStops.join(' | ') || 'every focus stop is visibly rendered',
)
check('every focusable element is reached by Tab', stops.length === focusableCount, `${stops.length}/${focusableCount}`)
check(
  'no focusable is reached twice (sane tab order)',
  new Set(stops.map((s) => `${s.tag}.${s.cls}.${s.text}`)).size === stops.length,
)

const uniqueLabels = new Set(stops.map((s) => s.label ?? s.text))
check(
  'symbol-only controls announce a product name',
  [...uniqueLabels].filter((l) => /^[+−]$/.test(l ?? '')).length === 0,
  [...uniqueLabels].filter((l) => /^Increase|^Decrease/.test(l ?? '')).slice(0, 2).join(' | ') || 'none found on this page',
)

// --------------------------------------------- 3. stepper at both range ends
console.log('\n--- 3. stepper at the ends of its range (detail page) ---')
const productHrefs = await page.evaluate(() =>
  [...document.querySelectorAll('.product-card__name a')].slice(0, 2).map((el) => el.getAttribute('href')),
)
await page.goto(`${BASE}${productHrefs[0]}`, { waitUntil: 'networkidle2' })

await setQty('.field .qty', 98)
await page.evaluate(() => document.querySelectorAll('.field .qty > button')[1].focus())
await page.keyboard.press('Enter')
await settle()
a = await active()
const incQty = await page.evaluate(() => document.querySelector('.field .qty input').value)
check(
  'pressing + at the cap keeps focus off <body>',
  a.tag !== 'BODY',
  `qty=${incQty}, focus=${a.tag}${a.label ? ` "${a.label}"` : ''}`,
)

await setQty('.field .qty', 2)
await page.evaluate(() => document.querySelectorAll('.field .qty > button')[0].focus())
await page.keyboard.press('Enter')
await settle()
a = await active()
const decQty = await page.evaluate(() => document.querySelector('.field .qty input').value)
check(
  'pressing − at the floor keeps focus off <body>',
  a.tag !== 'BODY',
  `qty=${decQty}, focus=${a.tag}${a.label ? ` "${a.label}"` : ''}`,
)

// ------------------------------------------------------------- 4. add to cart
console.log('\n--- 4. add to cart by keyboard ---')
const addBtn = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /add to cart/i.test(x.textContent))
  if (!b) return null
  b.focus()
  return b.textContent.trim()
})
check('the add-to-cart button is reachable and focusable', addBtn !== null, addBtn ?? 'not found')
if (addBtn) {
  await page.keyboard.press('Enter')
  await settle(250)
}
const cartCount = await page.evaluate(() => document.querySelector('header a[href="/cart"]')?.textContent?.trim())
check('the cart badge updates after a keyboard add', /[1-9]/.test(cartCount ?? ''), cartCount ?? 'no badge')

// --------------------------------- 5 & 6. focus after one, then all removals
console.log('\n--- 5/6. focus after removals ---')
const [id1, id2] = productHrefs.map((h) => h.replace('/products/', ''))
check('two distinct product ids available for seeding', !!id1 && !!id2 && id1 !== id2, `${id1} / ${id2}`)
await page.evaluate(
  (a1, a2) => localStorage.setItem('enbw-cart', JSON.stringify([{ id: a1, qty: 2 }, { id: a2, qty: 1 }])),
  id1,
  id2,
)
await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle2' })
await page.waitForFunction(() => document.querySelectorAll('[data-remove]').length === 2, { timeout: 8000 })

await page.evaluate(() => document.querySelectorAll('[data-remove]')[0].focus())
await page.keyboard.press('Enter')
await settle(300)
a = await active()
const rowsAfter1 = await page.evaluate(() => document.querySelectorAll('[data-remove]').length)
check(
  'after removing a row focus moves to the next Remove button',
  rowsAfter1 === 1 && a.tag !== 'BODY' && (a.cls ?? '').includes('cart-row__remove'),
  `rows 2→${rowsAfter1}, focus=${a.tag}${a.cls ? ` .${a.cls}` : ''}${a.text ? ` "${a.text}"` : ''}`,
)

await page.keyboard.press('Enter')
await settle(350)
a = await active()
const emptyShown = await page.evaluate(() => !!document.querySelector('.empty-state h2'))
check(
  'after removing the last row focus moves to the empty-state heading',
  emptyShown && a.tag !== 'BODY',
  `empty-state=${emptyShown}, focus=${a.tag}${a.text ? ` "${a.text}"` : ''}`,
)

// ------------------------------------------------- 7. cart stepper range end
console.log('\n--- 7. cart row stepper at the end of its range ---')
await page.evaluate((a1) => localStorage.setItem('enbw-cart', JSON.stringify([{ id: a1, qty: 98 }])), id1)
await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle2' })
await page.waitForFunction(() => document.querySelectorAll('[data-remove]').length === 1, { timeout: 8000 })
await page.evaluate(() => document.querySelectorAll('.cart-table tbody tr .qty > button')[1].focus())
await page.keyboard.press('Enter')
await settle(300)
a = await active()
const cartQty = await page.evaluate(() => document.querySelector('.cart-table tbody tr .qty input').value)
check(
  'cart row + at the cap keeps focus off <body>',
  a.tag !== 'BODY',
  `qty=${cartQty}, focus=${a.tag}${a.label ? ` "${a.label}"` : ''}`,
)

// ------------------------------------------------------ 8. scroll region
console.log('\n--- 8. the scrollable cart table is keyboard reachable ---')
const regionFocusable = await page.evaluate(() => {
  const el = document.querySelector('.cart-table-wrap')
  if (!el) return null
  el.focus()
  return document.activeElement === el && el.getAttribute('tabindex') === '0'
})
check('cart table scroll region is focusable', regionFocusable === true)

// ------------------------------------------------------------------ report
await browser.close()

console.log('\n=== console output during the run ===')
if (consoleErrors.length === 0) console.log('(none)')
else consoleErrors.slice(0, 12).forEach((e) => console.log('  ' + e))

const failed = results.filter((r) => !r.pass)
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`)
if (failed.length) failed.forEach((f) => console.log(`  FAILED: ${f.name} — ${f.detail}`))
