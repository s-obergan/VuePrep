<script setup lang="ts">
import { computed } from 'vue'

import type { CatalogueCategory, CatalogueProduct } from '~/lib/contentful'

interface Props {
  categories: CatalogueCategory[]
  products: CatalogueProduct[]
  active: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:active': [value: string | null] }>()

const counts = computed(() => {
  const totals = new Map<string, number>()
  for (const product of props.products) {
    const id = product.category?.sys.id
    if (id === undefined) continue
    totals.set(id, (totals.get(id) ?? 0) + 1)
  }
  return totals
})

function pressed(isActive: boolean): 'true' | 'false' {
  return isActive ? 'true' : 'false'
}
</script>

<template>
  <section aria-labelledby="filter-heading">
    <h2 id="filter-heading" class="visually-hidden">Filter by category</h2>
    <div class="filters">
      <button
        type="button"
        class="chip"
        :aria-pressed="pressed(active === null)"
        @click="emit('update:active', null)"
      >
        All <span class="chip__count">({{ products.length }})</span>
      </button>
      <button
        v-for="category in categories"
        :key="category.sys.id"
        type="button"
        class="chip"
        :aria-pressed="pressed(active === category.sys.id)"
        @click="emit('update:active', category.sys.id)"
      >
        {{ category.name }}
        <span class="chip__count">({{ counts.get(category.sys.id) ?? 0 }})</span>
      </button>
    </div>
  </section>
</template>
