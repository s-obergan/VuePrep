import { CONTENT_TYPES, FIELDS, ORDER, SELECTIONS } from './schema'

export const DEFAULT_LIMIT = 100

const INDENT = '      '

interface CollectionArgs {
  limit: number
  order?: string
}

function collectionArgs({ limit, order }: CollectionArgs): string {
  const args = [`limit: ${limit}`]
  if (order !== undefined) args.push(`order: [${order}]`)
  return args.join(', ')
}

function indentBlock(selection: string): string {
  return selection
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : INDENT + line))
    .join('\n')
}

function indentFields(fields: readonly string[]): string {
  return fields.map((field) => INDENT + field).join('\n')
}

export function homepageQuery(): string {
  return `query Homepage {
  homepage: ${CONTENT_TYPES.homepage}Collection(${collectionArgs({ limit: 1 })}) {
    total
    items {
      sys { id }
${indentFields(FIELDS.homepage)}
    }
  }
}`
}

export function categoryQuery(): string {
  return `query Categories {
  categories: ${CONTENT_TYPES.category}Collection(${collectionArgs({
    limit: DEFAULT_LIMIT,
    order: ORDER.category,
  })}) {
    total
    items {
      sys { id }
${indentFields(FIELDS.category)}
    }
  }
}`
}

export function productQuery(): string {
  return `query Products {
  products: ${CONTENT_TYPES.product}Collection(${collectionArgs({
    limit: DEFAULT_LIMIT,
    order: ORDER.product,
  })}) {
    total
    items {
      sys { id }
${indentFields(FIELDS.product)}
${indentBlock(SELECTIONS.product.category)}
${indentBlock(SELECTIONS.product.image)}
    }
  }
}`
}

export function productByIdQuery(): string {
  return `query ProductById($id: String!) {
  products: ${CONTENT_TYPES.product}Collection(where: { sys: { id: $id } }, ${collectionArgs({
    limit: 1,
  })}) {
    total
    items {
      sys { id }
${indentFields(FIELDS.product)}
${indentBlock(SELECTIONS.product.category)}
${indentBlock(SELECTIONS.product.image)}
    }
  }
}`
}
