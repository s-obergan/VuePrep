import { request, type RequestOptions } from './client'
import {
  toCategories,
  toHomepageContent,
  toProduct,
  toProducts,
  type CatalogueCategory,
  type CatalogueProduct,
  type HomepageContent,
} from './content'
import {
  categoryQuery,
  DEFAULT_LIMIT,
  homepageQuery,
  productByIdQuery,
  productQuery,
} from './queries'
import type {
  CategoryResponse,
  HomepageEntry,
  HomepageResponse,
  ProductResponse,
} from './types'

function warnIfTruncated(what: string, received: number, total: number): void {
  if (!import.meta.dev || received >= total) return
  console.warn(
    `[contentful] Asked for ${received} of ${total} ${what} — anything past the first ` +
      `${DEFAULT_LIMIT} is missing. Raise DEFAULT_LIMIT in queries.ts, or paginate.`,
  )
}

function warnIfSkipped(what: string, skipped: number, why: string): void {
  if (!import.meta.dev || skipped === 0) return
  console.warn(
    `[contentful] Skipped ${skipped} ${what} ${skipped === 1 ? 'entry' : 'entries'} ${why}.`,
  )
}

export async function fetchHomepageEntry(
  options: RequestOptions,
): Promise<HomepageEntry | null> {
  const data = await request<HomepageResponse>(homepageQuery(), options)
  return data.homepage.items[0] ?? null
}

export async function fetchHomepageContent(options: RequestOptions): Promise<HomepageContent> {
  return toHomepageContent(await fetchHomepageEntry(options))
}

export async function fetchCategories(options: RequestOptions): Promise<CatalogueCategory[]> {
  const data = await request<CategoryResponse>(categoryQuery(), options)

  const { total, items } = data.categories
  const categories = toCategories(items)

  warnIfTruncated('categories', items.length, total)
  warnIfSkipped('category', items.length - categories.length, 'with an empty Name field')

  return categories
}

export async function fetchProducts(options: RequestOptions): Promise<CatalogueProduct[]> {
  const data = await request<ProductResponse>(productQuery(), options)

  const { total, items } = data.products
  const products = toProducts(items)

  warnIfTruncated('products', items.length, total)
  warnIfSkipped('product', items.length - products.length, 'with no title or no price')

  return products
}

export async function fetchProduct(
  id: string,
  options: RequestOptions,
): Promise<CatalogueProduct | null> {
  const data = await request<ProductResponse>(productByIdQuery(), {
    ...options,
    variables: { id },
  })

  const entry = data.products.items[0]
  if (entry === undefined) return null

  const product = toProduct(entry)
  if (product === null) warnIfSkipped('product', 1, `for id ${id} (no title or no price)`)

  return product
}
