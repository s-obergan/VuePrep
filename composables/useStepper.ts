import { computed, nextTick, type Ref } from 'vue'

import { MAX_QTY } from '~/stores/cart'

interface ButtonRef {
  readonly value: HTMLButtonElement | null
}

interface StepperParts {

  qty: Ref<number>

  decrease: ButtonRef
  increase: ButtonRef
}

export function useStepper({ qty, decrease, increase }: StepperParts) {

  const canDecrease = computed(() => qty.value > 1)
  const canIncrease = computed(() => qty.value < MAX_QTY)

  function keepFocusAfterStep(delta: number): void {
    const pressed = delta > 0 ? increase.value : decrease.value
    const sibling = delta > 0 ? decrease.value : increase.value

    void nextTick(() => {
      if (pressed?.disabled && sibling !== null) sibling.focus()
    })
  }

  return { canDecrease, canIncrease, keepFocusAfterStep }
}
