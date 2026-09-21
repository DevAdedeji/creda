<script setup lang="ts">
defineOptions({ inheritAttrs: false })
defineProps<{ inLink?: boolean }>()
const open = ref(false)
</script>

<template>
  <UTooltip v-model:open="open" text="Ownership verified" :delay-duration="0">
    <span
      v-bind="$attrs"
      role="img"
      aria-label="Ownership verified"
      :tabindex="inLink ? undefined : 0"
      class="ml-1 inline-flex size-5 shrink-0 cursor-help items-center justify-center align-middle rounded-full text-[#28784b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#28784b]"
      @click.stop.prevent="open = !open"
      @keydown.enter.stop.prevent="open = !open"
      @keydown.space.stop.prevent="open = !open"
    >
      <svg viewBox="0 0 24 24" class="size-full" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M3.85 8.62a4 4 0 0 1 4.78-4.77a4 4 0 0 1 6.74 0a4 4 0 0 1 4.78 4.78a4 4 0 0 1 0 6.74a4 4 0 0 1-4.77 4.78a4 4 0 0 1-6.75 0a4 4 0 0 1-4.78-4.77a4 4 0 0 1 0-6.76Z"
        />
        <path
          d="m16 9-5.5 5.5L8 12"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  </UTooltip>
</template>
