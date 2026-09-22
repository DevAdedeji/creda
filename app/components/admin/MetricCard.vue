<script setup lang="ts">
defineProps<{
  label: string
  value: number
  icon: string
  added: number
  days: number
  detail: string
}>()
const numberFormat = new Intl.NumberFormat('en-NG')
</script>

<template>
  <article class="rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-6">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-medium text-[#657069]">{{ label }}</h2>
      <span class="grid size-9 place-items-center rounded-xl bg-[#eef5e8] text-[#426a46]">
        <UIcon :name="icon" class="size-4" />
      </span>
    </div>
    <p class="mt-4 text-4xl font-semibold tracking-[-.06em] text-[#143e32] tabular-nums">
      {{ numberFormat.format(value) }}
    </p>
    <p class="mt-3 text-xs font-medium text-[#46694b]">
      {{ numberFormat.format(added) }} added in {{ days }} days
    </p>
    <p class="mt-2 text-xs leading-5 text-[#7b887d]">{{ detail }}</p>
  </article>
</template>
