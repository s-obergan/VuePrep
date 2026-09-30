export const CONTENT_TYPES = {

  homepage: 'homepage',
  category: 'category',
  product: 'product',
} as const

export const FIELDS = {
  homepage: ['headerText', 'shopLabel', 'cartLabel', 'footerLeftLabel', 'footerRightLabel', 'pageTitle', 'browserTitle'],
  category: ['name'],
  product: ['title', 'teaserText', 'price'],
} as const

export const SELECTIONS = {
  product: {
    category: `category {
  ... on Category {
    sys { id }
    name
  }
}`,
    image: `image {
  url
  description
  width
  height
}`,
  },
} as const

export const ORDER = {
  category: 'name_ASC',
  product: 'title_ASC',
} as const
