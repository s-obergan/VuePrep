import fs from 'node:fs'

import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const AXE = 'C:/Temp/EnBW/node_modules/axe-core/axe.min.js'

const base = process.argv[2]
const routes = process.argv.slice(3)
const axeSource = fs.readFileSync(AXE, 'utf8')

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})

let violations = 0
let passes = 0

for (const route of routes) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  const scheme = process.env.AXE_SCHEME === 'dark' ? 'dark' : 'light'
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }])

  try {
    await page.goto(base + route, { waitUntil: 'networkidle2', timeout: 60000 })
  } catch {
    await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
  }

  await page.addScriptTag({ content: axeSource })

  const results = await page.evaluate(async () => {
    return await window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
      },
    })
  })

  console.log(`\n${'='.repeat(72)}`)
  console.log(`${route}   ${results.violations.length} violation type(s), ${results.passes.length} passed rule(s)`)
  console.log('='.repeat(72))

  for (const v of results.violations) {
    violations++
    console.log(`\n  [${v.impact}] ${v.id}  (${v.nodes.length} node(s))`)
    console.log(`  ${v.help}`)
    console.log(`  ${v.helpUrl}`)
    for (const n of v.nodes.slice(0, 5)) {
      console.log(`    target: ${JSON.stringify(n.target)}`)
      const summary = (n.failureSummary || '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(' | ')
      if (summary) console.log(`      ${summary}`)
      if (n.html) console.log(`      html: ${n.html.slice(0, 160)}`)
    }
    if (v.nodes.length > 5) console.log(`    ...and ${v.nodes.length - 5} more node(s)`)
  }

  passes += results.passes.length
  await page.close()
}

await browser.close()
console.log(`\n${'='.repeat(72)}`)
console.log(`TOTAL: ${violations} violation type(s), ${passes} passing rule(s) across ${routes.length} route(s)`)
