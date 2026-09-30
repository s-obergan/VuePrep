import type { RequestOptions } from './client'
import { describeConfig, getContentfulConfig, isContentfulConfigured } from './config'
import type { ContentfulConfig, ContentfulRuntime } from './config'

const NOT_CONFIGURED_HINT =
  '[contentful] Not configured — using the built-in copy. Copy .env.example to .env and fill ' +
  'in NUXT_CONTENTFUL_SPACE_ID and NUXT_CONTENTFUL_ACCESS_TOKEN, then restart the dev ' +
  'server: Nuxt reads .env only at startup.'

let targetLogged = false

function logTargetOnce(config: ContentfulConfig): void {
  if (!import.meta.dev || targetLogged) return
  targetLogged = true
  console.info(`[contentful] Reading ${describeConfig(config)}.`)
}

export async function loadOrFallback<T>(
  what: string,
  runtime: ContentfulRuntime | undefined,
  load: (options: RequestOptions) => Promise<T>,
  fallback: () => T,
): Promise<T> {
  if (!isContentfulConfigured(runtime)) {
    if (import.meta.dev) console.info(NOT_CONFIGURED_HINT)
    return fallback()
  }

  const config = getContentfulConfig(runtime)
  logTargetOnce(config)

  try {
    return await load({ config })
  } catch (cause) {

    console.warn(`[contentful] Could not load ${what} — using the built-in copy.`, cause)
    return fallback()
  }
}
