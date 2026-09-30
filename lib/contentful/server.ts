export { request } from './client'
export type { RequestOptions } from './client'

export {
  fetchCategories,
  fetchHomepageContent,
  fetchHomepageEntry,
  fetchProduct,
  fetchProducts,
} from './fetchers'

export { loadOrFallback } from './safe-fetch'

export {
  categoryQuery,
  DEFAULT_LIMIT,
  homepageQuery,
  productByIdQuery,
  productQuery,
} from './queries'
export { CONTENT_TYPES, FIELDS, ORDER, SELECTIONS } from './schema'
