import { defineStore } from 'pinia'

import type { CatalogueProduct } from '~/lib/contentful'

export interface CartItem {
  id: string
  qty: number
}

export interface CartLine {
  id: string
  qty: number
  product: CatalogueProduct
  lineTotal: number
}

export const CART_KEY = 'enbw-cart'

export const MAX_QTY = 99

export const SHIPPING_FLAT = 4.95

export const FREE_SHIPPING_FROM = 75

export function clampQty(qty: unknown): number {
  const parsed = typeof qty === 'number' ? qty : Number.parseInt(String(qty), 10)
  if (!Number.isFinite(parsed)) return 1
  return Math.min(MAX_QTY, Math.max(1, Math.trunc(parsed)))
}

export function readStoredItems(raw: unknown): CartItem[] {
  let parsed: unknown = raw

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) return []

  const totals = new Map<string, number>()

  for (const entry of parsed) {
    if (typeof entry !== 'object' || entry === null) continue
    const { id, qty } = entry as Partial<CartItem>
    if (typeof id !== 'string' || id === '') continue

    const parsedQty = typeof qty === 'number' ? Math.trunc(qty) : Number.NaN
    if (!Number.isFinite(parsedQty) || parsedQty < 1) continue

    totals.set(id, (totals.get(id) ?? 0) + parsedQty)
  }

  return [...totals].map(([id, qty]) => ({ id, qty: Math.min(MAX_QTY, qty) }))
}

export const useCartStore = defineStore('cart', {
  state: () => ({

    items: [] as CartItem[],

    catalogue: [] as CatalogueProduct[],
  }),

  getters: {

    count: (state): number => state.items.reduce((sum, item) => sum + item.qty, 0),

    lines(state): CartLine[] {

      const byId = new Map(state.catalogue.map((product) => [product.sys.id, product]))
      const lines: CartLine[] = []

      for (const item of state.items) {
        const product = byId.get(item.id)
        if (product === undefined) continue
        lines.push({
          id: item.id,
          qty: item.qty,
          product,
          lineTotal: product.price * item.qty,
        })
      }

      return lines
    },

    subtotal(): number {
      return this.lines.reduce((sum, line) => sum + line.lineTotal, 0)
    },

    shipping(): number {
      const subtotal = this.subtotal
      if (subtotal === 0) return 0
      return subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FLAT
    },

    total(): number {
      return this.subtotal + this.shipping
    },
  },

  actions: {

    setCatalogue(products: CatalogueProduct[]) {
      const byId = new Map(this.catalogue.map((product) => [product.sys.id, product]))
      for (const product of products) byId.set(product.sys.id, product)
      this.catalogue = [...byId.values()]
    },

    add(id: string, qty: number) {
      if (!this.catalogue.some((product) => product.sys.id === id)) return

      const amount = clampQty(qty)
      const existing = this.items.find((item) => item.id === id)

      if (existing) {
        existing.qty = Math.min(MAX_QTY, existing.qty + amount)
        return
      }

      this.items.push({ id, qty: amount })
    },

    remove(id: string) {
      this.items = this.items.filter((item) => item.id !== id)
    },

    setQty(id: string, qty: number) {
      const existing = this.items.find((item) => item.id === id)
      if (existing === undefined) return
      existing.qty = clampQty(qty)
    },

    clear() {
      this.items = []
    },
  },
})
