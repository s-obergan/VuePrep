export interface Sys {

  id: string
}

export interface Collection<T> {
  total: number
  items: T[]
}

export interface HomepageEntry {
  sys: Sys

  headerText?: string | null

  shopLabel?: string | null

  cartLabel?: string | null

  footerLeftLabel?: string | null

  footerRightLabel?: string | null

  pageTitle?: string | null

  browserTitle?: string | null
}

export interface HomepageResponse {

  homepage: Collection<HomepageEntry>
}

export interface CategoryEntry {
  sys: Sys

  name?: string | null
}

export interface CategoryResponse {

  categories: Collection<CategoryEntry>
}

export interface AssetEntry {
  url?: string | null
  description?: string | null
  width?: number | null
  height?: number | null
}

export interface ProductEntry {
  sys: Sys

  title?: string | null

  teaserText?: string | null

  price?: number | null

  category?: CategoryEntry | null

  image?: AssetEntry | null
}

export interface ProductResponse {

  products: Collection<ProductEntry>
}
