<script setup lang="ts">
interface Props {
  leftLabel?: string
  rightLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  leftLabel: 'Northwind Supply — a demo storefront.',
  rightLabel: 'Demo project · no orders are processed.',
})
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <p>{{ props.leftLabel }}</p>
      <p>{{ props.rightLabel }}</p>
    </div>
  </footer>
</template>
