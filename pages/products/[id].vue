<script setup lang="ts">
import { computed, ref } from 'vue'

import QuantityPicker from '~/components/QuantityPicker.vue'
import { formatPrice } from '~/lib/format'
import { clampQty, useCartStore } from '~/stores/cart'

const route = useRoute()
const id = computed(() => String(route.params.id))

const { data } = await useProduct(id)
const product = computed(() => data.value.product)

const cart = useCartStore()
const quantity = ref(1)

useSeoMeta({
  title: () => (product.value ? `${product.value.title} · Northwind Supply` : 'Product not found · Northwind Supply'),
  description: () =>
    product.value
      ? [product.value.title, product.value.teaserText].filter(Boolean).join(' — ')
      : 'That product is not in the Northwind Supply catalogue.',
})

useHead({
  meta: computed(() =>
    product.value ? [] : [{ name: 'robots', content: 'noindex' }],
  ),
})

function addToCart(): void {
  if (!product.value) return

  const qty = clampQty(quantity.value)
  quantity.value = qty

  cart.add(product.value.sys.id, qty)
  const count = cart.count
  show(
    `${qty} × ${product.value.title} added to cart. Cart now has ${count} ${count === 1 ? 'item' : 'items'}.`,
  )
}

const { show } = useToast()

if (product.value) cart.setCatalogue([product.value])
</script>

<template>
  <div v-if="!product" class="empty-state">
    <h1>Product not found</h1>
    <p>
      We could not find that product. It may have been removed from the catalogue, or the
      catalogue may not be reachable right now.
    </p>
    <NuxtLink class="btn btn--primary" to="/">Back to all products</NuxtLink>
  </div>
  <template v-else>
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><NuxtLink to="/">Shop</NuxtLink></li>
        <li v-if="product.category"><NuxtLink to="/">{{ product.category.name }}</NuxtLink></li>
        <li><span aria-current="page">{{ product.title }}</span></li>
      </ol>
    </nav>
    <article class="detail" aria-labelledby="product-title">
      <img
        v-if="product.image"
        class="detail__media"
        :src="product.image.url"
        :alt="product.image.alt"
        :width="product.image.width"
        :height="product.image.height"
        decoding="async"
      />
      <div class="detail__info">
        <p v-if="product.category" class="product-card__cat">{{ product.category.name }}</p>
        <h1 id="product-title">{{ product.title }}</h1>
        <p v-if="product.teaserText" class="detail__tagline">{{ product.teaserText }}</p>
        <p class="detail__price">
          <span class="visually-hidden">Price: </span>{{ formatPrice(product.price) }}
        </p>
        <form class="buy-form" @submit.prevent="addToCart">
          <QuantityPicker v-model="quantity" :product-title="product.title" />
          <button type="submit" class="btn btn--primary">Add to cart</button>
        </form>
      </div>
    </article>
  </template>
</template>

<style scoped>
.detail {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: var(--sp-7);
  align-items: start;
}

@media (max-width: 860px) {
  .detail { grid-template-columns: 1fr; gap: var(--sp-5); }
}

.detail__media {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.detail__info {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.detail__tagline { color: var(--text-muted); }

.detail__price {
  font-size: 1.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.buy-form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-4);
  align-items: flex-start;
  padding-block: var(--sp-2);
}
</style>
