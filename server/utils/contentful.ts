import type { H3Event } from 'h3'

import type { ContentfulRuntime } from '~/lib/contentful'

export function useServerContentful(event: H3Event): ContentfulRuntime {
  return useRuntimeConfig(event).contentful
}
