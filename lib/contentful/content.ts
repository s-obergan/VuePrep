import type { AssetEntry, CategoryEntry, HomepageEntry, ProductEntry } from './types'

export function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export interface SiteChrome {
  headerText?: string
  shopLabel?: string
  cartLabel?: string
  footerLeftLabel?: string
  footerRightLabel?: string
}

export interface HomepageContent {
  chrome: SiteChrome
  pageTitle?: string
  browserTitle?: string
}

export function toSiteChrome(entry: HomepageEntry | null | undefined): SiteChrome {
  return {
    headerText: asText(entry?.headerText),
    shopLabel: asText(entry?.shopLabel),
    cartLabel: asText(entry?.cartLabel),
    footerLeftLabel: asText(entry?.footerLeftLabel),
    footerRightLabel: asText(entry?.footerRightLabel),
  }
}

export function toHomepageContent(entry: HomepageEntry | null | undefined): HomepageContent {
  return {
    chrome: toSiteChrome(entry),
    pageTitle: asText(entry?.pageTitle),
    browserTitle: asText(entry?.browserTitle),
  }
}

export function emptyHomepageContent(): HomepageContent {
  return toHomepageContent(null)
}

export interface CatalogueCategory extends Omit<CategoryEntry, 'name'> {
  name: string
}

export function toCategory(entry: CategoryEntry): CatalogueCategory | null {
  const name = asText(entry.name)
  return name === undefined ? null : { ...entry, name }
}

export function toCategories(entries: readonly CategoryEntry[]): CatalogueCategory[] {
  return entries
    .map(toCategory)
    .filter((category): category is CatalogueCategory => category !== null)
}

export interface ProductImage {
  url: string

  alt: string
  width?: number
  height?: number
}

export interface CatalogueProduct
  extends Omit<ProductEntry, 'title' | 'teaserText' | 'price' | 'image' | 'category'> {
  title: string

  teaserText?: string

  category: CatalogueCategory | null

  image: ProductImage | null

  price: number
}

function absoluteAssetUrl(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url
}

export function toProductImage(
  entry: AssetEntry | null | undefined,
  altFallback: string,
): ProductImage | null {
  const url = asText(entry?.url)
  if (url === undefined) return null

  const image: ProductImage = {
    url: absoluteAssetUrl(url),
    alt: asText(entry?.description) ?? altFallback,
  }

  const width = asNumber(entry?.width)
  const height = asNumber(entry?.height)
  if (width !== undefined && height !== undefined) {
    image.width = width
    image.height = height
  }

  return image
}

export function toProduct(entry: ProductEntry): CatalogueProduct | null {
  const title = asText(entry.title)
  const price = asNumber(entry.price)
  if (title === undefined || price === undefined) return null

  return {
    ...entry,
    title,
    teaserText: asText(entry.teaserText),
    category: entry.category == null ? null : toCategory(entry.category),
    image: toProductImage(entry.image, title),
    price,
  }
}

export function toProducts(entries: readonly ProductEntry[]): CatalogueProduct[] {
  return entries
    .map(toProduct)
    .filter((product): product is CatalogueProduct => product !== null)
}

export interface ProductLookup {
  product: CatalogueProduct | null
}
