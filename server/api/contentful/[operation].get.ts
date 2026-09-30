import {
  emptyHomepageContent,
  type CatalogueCategory,
  type CatalogueProduct,
  type HomepageContent,
  type ProductLookup,
} from '~/lib/contentful'
import {
  fetchCategories,
  fetchHomepageContent,
  fetchProduct,
  fetchProducts,
  loadOrFallback,
} from '~/lib/contentful/server'

export default defineEventHandler(async (event) => {
  const operation = getRouterParam(event, 'operation')
  const runtime = useServerContentful(event)

  switch (operation) {
    case 'homepage':
      return loadOrFallback<HomepageContent>(
        'the homepage entry',
        runtime,
        fetchHomepageContent,
        emptyHomepageContent,
      )

    case 'products':
      return loadOrFallback<CatalogueProduct[]>('the catalogue', runtime, fetchProducts, () => [])

    case 'categories':
      return loadOrFallback<CatalogueCategory[]>('the categories', runtime, fetchCategories, () => [])

    case 'product': {
      const id = getQuery(event).id
      if (typeof id !== 'string' || id === '') {
        throw createError({ statusCode: 400, statusMessage: 'Missing id' })
      }

      const product = await loadOrFallback<CatalogueProduct | null>(
        `product ${id}`,
        runtime,
        (options) => fetchProduct(id, options),
        () => null,
      )

      return { product } satisfies ProductLookup
    }

    default:
      throw createError({ statusCode: 404, statusMessage: `Unknown operation: ${operation}` })
  }
})
