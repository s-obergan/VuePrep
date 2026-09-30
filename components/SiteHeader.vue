<script setup lang="ts">
import { computed } from 'vue'

import brandMark from '~/assets/brand-mark.svg'
import cartIcon from '~/assets/icons/cart.svg'

interface Props {
  headerText?: string
  shopLabel?: string
  cartLabel?: string
  cartCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  headerText: 'Northwind Supply',
  shopLabel: 'Shop',
  cartLabel: 'Cart',
  cartCount: 0,
})

const cartCountLabel = computed(
  () => `${props.cartCount} ${props.cartCount === 1 ? 'item' : 'items'}`,
)
</script>

<template>
  <header class="site-header">
    <div class="container">
      <NuxtLink class="brand" to="/" aria-current="false">
        <img class="brand__mark" :src="brandMark" alt="" width="28" height="28" />
        {{ props.headerText }}
      </NuxtLink>
      <nav class="site-nav" aria-label="Main">
        <ul>
          <li>
            <NuxtLink to="/">{{ props.shopLabel }}</NuxtLink>
          </li>
          <li>
            <NuxtLink class="cart-link" to="/cart">
              <img class="cart-link__icon" :src="cartIcon" alt="" width="20" height="20" />
              <span>{{ props.cartLabel }}</span>
              <span class="cart-count" aria-hidden="true">{{ props.cartCount }}</span>
              <span class="visually-hidden">, {{ cartCountLabel }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>
