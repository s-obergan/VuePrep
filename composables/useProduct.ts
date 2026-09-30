import { computed, type Ref } from 'vue'

import { requestContentful } from '~/composables/useContentfulRequest'
import type { ProductLookup } from '~/lib/contentful'

export function useProduct(id: Ref<string>) {
  return useAsyncData<ProductLookup>(
    computed(() => `product:${id.value}`),
    (_nuxtApp, { signal }) =>
      requestContentful(
        `/api/contentful/product?id=${encodeURIComponent(id.value)}`,
        () => ({ product: null }),
        signal,
      ),

    { default: () => ({ product: null }) },
  )
}
