<script setup lang="ts">
defineProps<{ rating: number; label?: string }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-0.5 text-[#d59b34]"
    :aria-label="label ?? `${rating} out of 5 stars`"
    role="img"
  >
    <span
      v-for="star in 5"
      :key="star"
      :class="star <= Math.round(rating) ? 'text-[#d59b34]' : 'text-[#c8d0c4]'"
      class="text-lg leading-none"
      aria-hidden="true"
      >{{ star <= Math.round(rating) ? '★' : '☆' }}</span
    >
  </span>
</template>
