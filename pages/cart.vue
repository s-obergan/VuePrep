<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

import CartRow from '~/components/CartRow.vue'
import CartSummary from '~/components/CartSummary.vue'
import { formatPrice } from '~/lib/format'
import { useCartStore, type CartLine } from '~/stores/cart'

const { data: products } = await useProducts()

const cart = useCartStore()
cart.setCatalogue(products.value)

const { show } = useToast()

useSeoMeta({
  title: 'Your cart · Northwind Supply',
  description: 'Review the items in your Northwind Supply cart.',
})

const summaryLine = computed(() => {
  const count = cart.count
  if (count === 0) return ''
  return `${count} ${count === 1 ? 'item' : 'items'} in your cart`
})

const missingCount = computed(() => cart.items.length - cart.lines.length)

const emptyHeadingText = computed(() =>
  cart.count === 0 ? 'Your cart is empty' : 'Your cart cannot be shown right now',
)

const emptyCopy = computed(() => {
  const count = cart.count
  if (count === 0) {
    return 'Nothing here yet — browse the catalogue and add something you like.'
  }
  return `Your cart has ${count} ${count === 1 ? 'item' : 'items'}. ${
    count === 1 ? 'It may have been' : 'They may have been'
  } removed from the catalogue, or the catalogue may not be reachable right now.`
})

const missingNote = computed(() => {
  const missing = missingCount.value
  if (missing === 0 || cart.lines.length === 0) return ''

  return missing === 1
    ? 'One product in your cart is not shown. It may have been removed from the catalogue, or the catalogue may not be reachable right now.'
    : `${missing} products in your cart are not shown. They may have been removed from the catalogue, or the catalogue may not be reachable right now.`
})

const tableWrap = ref<HTMLElement | null>(null)
const emptyHeading = ref<HTMLElement | null>(null)

function focusAfterRemoval(index: number): void {
  if (cart.lines.length === 0) {
    emptyHeading.value?.focus()
    return
  }

  const buttons = tableWrap.value?.querySelectorAll<HTMLButtonElement>('[data-remove]') ?? []
  buttons[Math.min(index, buttons.length - 1)]?.focus()
}

const ANNOUNCE_SETTLE_MS = 250

const status = ref('')
let announceTimer: ReturnType<typeof setTimeout> | undefined

function announce(message: string): void {
  clearTimeout(announceTimer)
  announceTimer = setTimeout(() => {
    status.value = message
  }, ANNOUNCE_SETTLE_MS)
}

function setQty(id: string, qty: number): void {
  cart.setQty(id, qty)
  const line = cart.lines.find((entry) => entry.id === id)
  if (line !== undefined) {
    announce(`${line.product.title} quantity ${line.qty}. Cart total ${formatPrice(cart.total)}.`)
  }
}

function removeLine(line: CartLine, index: number): void {
  cart.remove(line.id)
  show(`${line.product.title} removed from cart.`)
  void nextTick(() => focusAfterRemoval(index))
}

function clearCart(): void {
  cart.clear()
  show('Cart cleared.')
  void nextTick(() => emptyHeading.value?.focus())
}

function checkout(): void {
  show('Checkout is not implemented in this storefront.')
}
</script>

<template>
  <header class="page-head">
    <h1>Your cart</h1>
    <p class="muted">{{ summaryLine }}</p>
  </header>
  <p class="visually-hidden" role="status">{{ status }}</p>
  <p class="note" role="status">{{ missingNote }}</p>
  <div v-if="cart.lines.length > 0" class="cart-layout">
    <div
      ref="tableWrap"
      class="cart-table-wrap"
      role="region"
      aria-labelledby="cart-caption"
      tabindex="0"
    >
      <table class="cart-table">
        <caption id="cart-caption">
          Items in your cart
        </caption>
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col" class="cart-col--num">Unit price</th>
            <th scope="col">Quantity</th>
            <th scope="col" class="cart-col--num">Total</th>
            <th scope="col"><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <CartRow
            v-for="(line, index) in cart.lines"
            :key="line.id"
            :line="line"
            @update:qty="setQty(line.id, $event)"
            @remove="removeLine(line, index)"
          />
        </tbody>
      </table>
    </div>
    <CartSummary
      :subtotal="cart.subtotal"
      :shipping="cart.shipping"
      :total="cart.total"
      @checkout="checkout"
      @clear="clearCart"
    />
  </div>
  <div v-else class="empty-state">
    <h2 ref="emptyHeading" tabindex="-1">{{ emptyHeadingText }}</h2>
    <p>{{ emptyCopy }}</p>
    <NuxtLink class="btn btn--primary" to="/">Start shopping</NuxtLink>
  </div>
</template>
