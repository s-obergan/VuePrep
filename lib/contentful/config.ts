import { ContentfulConfigError } from './errors'

export interface ContentfulConfig {
  spaceId: string
  accessToken: string

  environment: string

  host: string
}

export interface ContentfulRuntime {
  spaceId?: string
  accessToken?: string
  environment?: string
  graphqlHost?: string
}

export const DEFAULT_HOST = 'graphql.contentful.com'
export const DEFAULT_ENVIRONMENT = 'master'

function readSetting(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export function isContentfulConfigured(runtime: ContentfulRuntime | undefined): boolean {
  return (
    readSetting(runtime?.spaceId) !== undefined && readSetting(runtime?.accessToken) !== undefined
  )
}

export function getContentfulConfig(runtime: ContentfulRuntime | undefined): ContentfulConfig {
  const spaceId = readSetting(runtime?.spaceId)
  const accessToken = readSetting(runtime?.accessToken)

  if (spaceId === undefined || accessToken === undefined) {
    const missing = [
      ...(spaceId === undefined ? ['NUXT_CONTENTFUL_SPACE_ID'] : []),
      ...(accessToken === undefined ? ['NUXT_CONTENTFUL_ACCESS_TOKEN'] : []),
    ]

    throw new ContentfulConfigError(
      `Contentful is not configured — missing ${missing.join(' and ')}. ` +
        'Copy .env.example to .env and fill in the values from Contentful under ' +
        'Settings → API keys, then restart the dev server: Nuxt reads .env only at ' +
        'startup. Each variable must also be declared in nuxt.config.ts under ' +
        'runtimeConfig.contentful — an undeclared key is ignored without an error.',
    )
  }

  return {
    spaceId,
    accessToken,
    environment: readSetting(runtime?.environment) ?? DEFAULT_ENVIRONMENT,
    host: readSetting(runtime?.graphqlHost) ?? DEFAULT_HOST,
  }
}

export function graphqlEndpoint(config: ContentfulConfig): string {
  const space = encodeURIComponent(config.spaceId)
  const environment = encodeURIComponent(config.environment)
  return `https://${config.host}/content/v1/spaces/${space}/environments/${environment}`
}

export function describeConfig(config: ContentfulConfig): string {
  return `${config.spaceId}/${config.environment} on ${config.host}`
}
