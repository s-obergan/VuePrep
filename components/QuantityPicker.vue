<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from 'vue'

import { MAX_QTY, clampQty } from '~/stores/cart'

interface Props {
  modelValue: number

  productTitle: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const uid = useId()
const inputId = `${uid}-quantity`
const hintId = `${uid}-quantity-hint`
const statusId = `${uid}-quantity-status`

const status = ref('')

const decrease = useTemplateRef<HTMLButtonElement>('decrease')
const increase = useTemplateRef<HTMLButtonElement>('increase')

const { canDecrease, canIncrease, keepFocusAfterStep } = useStepper({
  qty: computed(() => props.modelValue),
  decrease,
  increase,
})

function step(delta: number): void {
  const next = clampQty(props.modelValue + delta)
  emit('update:modelValue', next)
  status.value = `Quantity: ${next}.`
  keepFocusAfterStep(delta)
}

function onChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const next = clampQty(input.value)
  input.value = String(next)
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="field">
    <label :for="inputId">Quantity</label>
    <div class="qty">
      <button
        ref="decrease"
        type="button"
        :disabled="!canDecrease"
        :aria-label="`Decrease quantity of ${props.productTitle}`"
        @click="step(-1)"
      >
        −
      </button>
      <input
        :id="inputId"
        type="number"
        :value="props.modelValue"
        min="1"
        :max="MAX_QTY"
        step="1"
        inputmode="numeric"
        :aria-describedby="hintId"
        @change="onChange"
      />
      <button
        ref="increase"
        type="button"
        :disabled="!canIncrease"
        :aria-label="`Increase quantity of ${props.productTitle}`"
        @click="step(1)"
      >
        +
      </button>
    </div>
    <p :id="hintId" class="field__hint">Maximum {{ MAX_QTY }} per order.</p>
    <p :id="statusId" class="visually-hidden" role="status">{{ status }}</p>
  </div>
</template>
