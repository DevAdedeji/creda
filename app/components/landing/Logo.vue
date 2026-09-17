<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean; to?: string }>(), { compact: false, to: '/' })
</script>

<template>
  <NuxtLink
    :to="to"
    :class="
      compact ? 'text-[28px] tracking-[-.07em]' : 'text-[32px] tracking-[-.07em] lg:text-[37px]'
    "
    class="inline-flex items-center gap-2 font-extrabold leading-none text-[#143e32] focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#668b48]"
    aria-label="Creda home"
  >
    <span
      :class="compact ? 'size-[29px] text-[23px]' : 'size-9 text-[29px]'"
      class="grid shrink-0 place-items-center rounded-full bg-[#d8f36a]"
      aria-hidden="true"
      ><UIcon name="i-lucide-asterisk"
    /></span>
    <span>creda<span>.</span></span>
  </NuxtLink>
</template>
