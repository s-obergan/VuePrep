<script setup lang="ts">
  import SiteFooter from '~/components/SiteFooter.vue'
  import SiteHeader from '~/components/SiteHeader.vue'
  import SiteToast from '~/components/SiteToast.vue'
  import { useCartStore } from '~/stores/cart'

  const { data: homepage } = await useHomepage()
  const cart = useCartStore()
</script>

<template>
  <a class="skip-link" href="#main">Skip to main content</a>
  <SiteHeader
    :header-text="homepage.chrome.headerText"
    :shop-label="homepage.chrome.shopLabel"
    :cart-label="homepage.chrome.cartLabel"
    :cart-count="cart.count"
  />
  <main id="main" class="page">
    <div class="container">
      <slot />
    </div>
  </main>
  <SiteFooter
    :left-label="homepage.chrome.footerLeftLabel"
    :right-label="homepage.chrome.footerRightLabel"
  />
  <SiteToast />
</template>
