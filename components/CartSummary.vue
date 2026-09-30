<script setup lang="ts">
import { computed } from 'vue'

import { formatPrice } from '~/lib/format'
import { FREE_SHIPPING_FROM } from '~/stores/cart'

interface Props {
  subtotal: number
  shipping: number
  total: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ checkout: []; clear: [] }>()

const shippingLabel = computed(() =>
  props.shipping === 0 ? 'Free' : formatPrice(props.shipping),
)

const note = computed(() =>
  props.shipping === 0
    ? `Shipping is free on orders of ${formatPrice(FREE_SHIPPING_FROM)} or more.`
    : `Add ${formatPrice(FREE_SHIPPING_FROM - props.subtotal)} more for free shipping.`,
)
</script>

<template>
  <aside class="summary" aria-labelledby="summary-heading">
    <h2 id="summary-heading">Order summary</h2>
    <dl class="summary__list">
      <div class="summary__row">
        <dt>Subtotal</dt>
        <dd>{{ formatPrice(subtotal) }}</dd>
      </div>
      <div class="summary__row">
        <dt>Shipping</dt>
        <dd>{{ shippingLabel }}</dd>
      </div>
      <div class="summary__row summary__row--total">
        <dt>Total</dt>
        <dd>{{ formatPrice(total) }}</dd>
      </div>
    </dl>
    <button type="button" class="btn btn--primary btn--block" @click="emit('checkout')">
      Checkout
    </button>
    <button type="button" class="btn--link" @click="emit('clear')">Clear cart</button>
    <p class="note">{{ note }}</p>
  </aside>
</template>
