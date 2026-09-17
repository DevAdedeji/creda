<script setup lang="ts">
const route = useRoute()

await navigateTo(
  { path: '/explore', query: route.query, hash: route.hash },
  { redirectCode: 301, replace: true },
)
</script>

<template>
  <div />
</template>
