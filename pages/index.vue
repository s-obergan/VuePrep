<script setup lang="ts">
import { computed, ref } from 'vue'

import CategoryFilter from '~/components/CategoryFilter.vue'
import ProductCard from '~/components/ProductCard.vue'
import type { CatalogueProduct } from '~/lib/contentful'
import { useCartStore } from '~/stores/cart'

const { data: homepage } = await useHomepage()
const { data: products } = await useProducts()
const { data: categories } = await useCategories()

const cart = useCartStore()
cart.setCatalogue(products.value)

const activeCategory = ref<string | null>(null)

function matches(product: CatalogueProduct): boolean {
  if (activeCategory.value === null) return true
  return product.category?.sys.id === activeCategory.value
}

const resultLabel = computed(() => {
  const shown = products.value.filter(matches).length
  return `${shown} ${shown === 1 ? 'product' : 'products'}`
})

useHead({ title: homepage.value.browserTitle })
</script>

<template>
  <header class="page-head">
    <h1>{{ homepage.pageTitle ?? 'All products' }}</h1>
    <p id="result-count" class="muted" role="status">{{ resultLabel }}</p>
  </header>
  <CategoryFilter v-model:active="activeCategory" :categories="categories" :products="products" />
  <section aria-labelledby="products-heading">
    <h2 id="products-heading" class="visually-hidden">Products</h2>
    <div v-if="products.length === 0" class="empty-state">
      <h2>No products to show</h2>
      <p>
        The catalogue came back empty. If you are setting this up, check that the
        Contentful environment variables are filled in — see <code>.env.example</code>.
      </p>
    </div>
    <ul v-else class="product-grid">
      <ProductCard
        v-for="product in products"
        :key="product.sys.id"
        :product="product"
        :hidden="!matches(product)"
      />
    </ul>
  </section>
</template>
