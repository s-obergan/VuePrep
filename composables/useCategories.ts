import { requestContentful } from '~/composables/useContentfulRequest'
import type { CatalogueCategory } from '~/lib/contentful'

export function useCategories() {
  return useAsyncData<CatalogueCategory[]>(
    'categories',
    (_nuxtApp, { signal }) => requestContentful('/api/contentful/categories', () => [], signal),
    { default: () => [] },
  )
}
