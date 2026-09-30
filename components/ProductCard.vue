<script setup lang="ts">
import { computed } from 'vue'

import { formatPrice } from '~/lib/format'
import type { CatalogueProduct } from '~/lib/contentful'
import { useCartStore } from '~/stores/cart'

interface Props {
  product: CatalogueProduct
  hidden?: boolean
}

const props = withDefaults(defineProps<Props>(), { hidden: false })

const cart = useCartStore()
const { show } = useToast()

const titleId = computed(() => `name-${props.product.sys.id}`)

const hiddenAttr = computed(() => (props.hidden ? '' : undefined))

function addToCart(): void {
  cart.add(props.product.sys.id, 1)
  const count = cart.count
  show(
    `${props.product.title} added to cart. Cart now has ${count} ${count === 1 ? 'item' : 'items'}.`,
  )
}
</script>

<template>
  <li :hidden="hiddenAttr">
    <article class="product-card" :aria-labelledby="titleId">
      <NuxtLink
        v-if="product.image"
        class="product-card__media"
        :to="`/products/${product.sys.id}`"
        tabindex="-1"
        aria-hidden="true"
      >
        <img
          :src="product.image.url"
          alt=""
          :width="product.image.width"
          :height="product.image.height"
          loading="lazy"
          decoding="async"
        />
      </NuxtLink>
      <div class="product-card__body">
        <p v-if="product.category" class="product-card__cat">{{ product.category.name }}</p>
        <h3 :id="titleId" class="product-card__name">
          <NuxtLink :to="`/products/${product.sys.id}`">{{ product.title }}</NuxtLink>
        </h3>
        <p v-if="product.teaserText" class="product-card__tagline">{{ product.teaserText }}</p>
        <p class="price">
          <span class="visually-hidden">Price: </span>{{ formatPrice(product.price) }}
        </p>
        <button type="button" class="btn btn--primary btn--block" @click="addToCart">
          Add to cart<span class="visually-hidden">: {{ product.title }}</span>
        </button>
      </div>
    </article>
  </li>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}

.product-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.product-card:focus-within {
  border-color: var(--focus);
}

.product-card__media {
  display: block;
  aspect-ratio: 4 / 3;
  background: var(--surface-alt);
  border-bottom: 1px solid var(--border);
}

.product-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-4);
  flex: 1;
}

.product-card__name { font-size: 1.02rem; }

.product-card__name a:hover { color: var(--accent); }

.product-card__tagline {
  font-size: 0.88rem;
  color: var(--text-muted);
}

.product-card .price { margin-top: auto; padding-top: var(--sp-2); }

@media (prefers-reduced-motion: reduce) {
  .product-card:hover { transform: none; }
}
</style>
