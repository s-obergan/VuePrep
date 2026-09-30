import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import type { CatalogueProduct } from '~/lib/contentful'
import { FREE_SHIPPING_FROM, SHIPPING_FLAT, useCartStore } from '~/stores/cart'

function product(id: string, price: number): CatalogueProduct {
  return { sys: { id }, title: id, category: null, image: null, price }
}

describe('cart totals', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('recalculates totals as the cart changes', () => {
    const cart = useCartStore()
    cart.setCatalogue([product('lamp', 40), product('mug', 35)])

    cart.add('lamp', 1)
    expect(cart.count).toBe(1)
    expect(cart.subtotal).toBe(40)
    expect(cart.shipping).toBe(SHIPPING_FLAT)
    expect(cart.total).toBe(44.95)

    cart.add('mug', 1)
    expect(cart.count).toBe(2)
    expect(cart.subtotal).toBe(FREE_SHIPPING_FROM)
    expect(cart.shipping).toBe(0)
    expect(cart.total).toBe(75)

    cart.setQty('mug', 2)
    expect(cart.subtotal).toBe(110)
    expect(cart.total).toBe(110)

    cart.remove('lamp')
    expect(cart.count).toBe(2)
    expect(cart.subtotal).toBe(70)
    expect(cart.shipping).toBe(SHIPPING_FLAT)
    expect(cart.total).toBe(74.95)

    cart.clear()
    expect(cart.subtotal).toBe(0)
    expect(cart.shipping).toBe(0)
    expect(cart.total).toBe(0)
  })
})
