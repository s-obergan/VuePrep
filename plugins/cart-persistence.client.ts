import { CART_KEY, readStoredItems, useCartStore } from '~/stores/cart'

export default defineNuxtPlugin(() => {
  const cart = useCartStore()

  function read(): string | null {
    try {
      return window.localStorage.getItem(CART_KEY)
    } catch {
      return null
    }
  }

  function write(items: unknown): void {
    try {
      const serialised = JSON.stringify(items)

      if (serialised === read()) return

      window.localStorage.setItem(CART_KEY, serialised)
    } catch {

    }
  }

  onNuxtReady(() => {
    cart.$patch({ items: readStoredItems(read()) })

    cart.$subscribe((_mutation, state) => write(state.items))

    window.addEventListener('storage', (event) => {
      if (event.key !== CART_KEY) return
      cart.$patch({ items: readStoredItems(event.newValue) })
    })
  })
})
