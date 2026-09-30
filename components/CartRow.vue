<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

import { formatPrice } from '~/lib/format'
import { MAX_QTY, clampQty, type CartLine } from '~/stores/cart'

interface Props {
  line: CartLine
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:qty': [qty: number]
  remove: []
}>()

const uid = useId()
const inputId = `${uid}-quantity`

const decrease = useTemplateRef<HTMLButtonElement>('decrease')
const increase = useTemplateRef<HTMLButtonElement>('increase')

const { canDecrease, canIncrease, keepFocusAfterStep } = useStepper({
  qty: computed(() => props.line.qty),
  decrease,
  increase,
})

function step(delta: number): void {
  emit('update:qty', clampQty(props.line.qty + delta))
  keepFocusAfterStep(delta)
}

function onChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const typed = Number.parseInt(input.value, 10)

  if (!Number.isFinite(typed) || typed < 1) {
    emit('remove')
    return
  }

  const next = clampQty(typed)
  input.value = String(next)
  emit('update:qty', next)
}
</script>

<template>
  <tr>
    <th scope="row">
      <div class="cart-row__product">
        <img
          v-if="line.product.image"
          class="cart-row__thumb"
          :src="line.product.image.url"
          alt=""
          :width="line.product.image.width"
          :height="line.product.image.height"
          decoding="async"
        />
        <NuxtLink :to="`/products/${line.id}`">{{ line.product.title }}</NuxtLink>
      </div>
    </th>
    <td class="cart-col--num">{{ formatPrice(line.product.price) }}</td>
    <td>
      <div class="qty">
        <button
          ref="decrease"
          type="button"
          :disabled="!canDecrease"
          :aria-label="`Decrease quantity of ${line.product.title}`"
          @click="step(-1)"
        >
          −
        </button>
        <label class="visually-hidden" :for="inputId">Quantity of {{ line.product.title }}</label>
        <input
          :id="inputId"
          type="number"
          :value="line.qty"
          min="1"
          :max="MAX_QTY"
          step="1"
          inputmode="numeric"
          @change="onChange"
        />
        <button
          ref="increase"
          type="button"
          :disabled="!canIncrease"
          :aria-label="`Increase quantity of ${line.product.title}`"
          @click="step(1)"
        >
          +
        </button>
      </div>
    </td>
    <td class="cart-col--num cart-row__total">{{ formatPrice(line.lineTotal) }}</td>
    <td>
      <button type="button" class="btn--link cart-row__remove" data-remove @click="emit('remove')">
        Remove<span class="visually-hidden"> {{ line.product.title }} from cart</span>
      </button>
    </td>
  </tr>
</template>
