<script setup lang="ts">
const { toast } = useToast()
</script>

<template>
  <p class="toast" :class="{ 'is-visible': toast.visible }" role="status">
    {{ toast.message }}
  </p>
</template>
