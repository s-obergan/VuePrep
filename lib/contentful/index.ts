export {
  DEFAULT_ENVIRONMENT,
  DEFAULT_HOST,
  describeConfig,
  getContentfulConfig,
  graphqlEndpoint,
  isContentfulConfigured,
} from './config'
export type { ContentfulConfig, ContentfulRuntime } from './config'

export {
  ContentfulConfigError,
  ContentfulError,
  ContentfulHttpError,
  ContentfulQueryError,
} from './errors'

export {
  asNumber,
  asText,
  emptyHomepageContent,
  toCategories,
  toCategory,
  toHomepageContent,
  toProduct,
  toProductImage,
  toProducts,
  toSiteChrome,
} from './content'
export type {
  CatalogueCategory,
  CatalogueProduct,
  HomepageContent,
  ProductImage,
  ProductLookup,
  SiteChrome,
} from './content'

export type {
  AssetEntry,
  CategoryEntry,
  CategoryResponse,
  Collection,
  HomepageEntry,
  HomepageResponse,
  ProductEntry,
  ProductResponse,
  Sys,
} from './types'
