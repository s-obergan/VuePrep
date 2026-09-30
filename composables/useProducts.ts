import { requestContentful } from '~/composables/useContentfulRequest'
import type { CatalogueProduct } from '~/lib/contentful'

export function useProducts() {
  return useAsyncData<CatalogueProduct[]>(
    'products',
    (_nuxtApp, { signal }) => requestContentful('/api/contentful/products', () => [], signal),
    { default: () => [] },
  )
}
