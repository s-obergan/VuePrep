// Renders the `.json` Lighthouse reports in this folder to standalone `.html`.
//
// The HTML is derived from the JSON, never the other way round — so if the two
// ever disagree, the JSON is the report and the HTML is a stale render. Re-run
// this after replacing a JSON file:
//
//   node LH/render.mjs
//
// The HTML files are self-contained (Lighthouse inlines its own CSS and JS), so
// they open directly from disk with no server and no network.
import fs from 'node:fs'
import path from 'node:path'

import { ReportGenerator } from 'lighthouse/report/generator/report-generator.js'

const dir = import.meta.dirname

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const lhr = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  const html = ReportGenerator.generateReport(lhr, 'html')
  const out = path.join(dir, file.replace(/\.json$/, '.html'))
  fs.writeFileSync(out, html)

  const score = (key) => Math.round((lhr.categories[key]?.score ?? 0) * 100)
  console.log(
    `${file.padEnd(20)} -> ${path.basename(out).padEnd(20)} ` +
      `perf ${score('performance')}  a11y ${score('accessibility')}  ` +
      `bp ${score('best-practices')}  seo ${score('seo')}`,
  )
}
