<script setup lang="ts">
import type { HomepageBusiness } from '~~/shared/homepage'

defineProps<{ business: HomepageBusiness; position?: number }>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 rounded-xl border border-[#e1e8dc] bg-white p-4">
    <span v-if="position" class="w-4 text-center text-xs font-semibold text-[#7a8c7b]">{{
      position
    }}</span>
    <NuxtImg
      v-if="business.logoUrl"
      :src="business.logoUrl"
      alt=""
      width="44"
      height="44"
      class="size-11 shrink-0 rounded-xl border border-[#e4e9df] object-cover"
    />
    <span
      v-else
      class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#edf4e4] font-semibold text-[#315b3a]"
      >{{ business.name.charAt(0) }}</span
    >
    <div class="min-w-0 flex-1 basis-28">
      <p class="truncate text-sm font-semibold text-[#143e32]">{{ business.name }}</p>
      <p class="mt-1 truncate text-xs text-[#738174]">/{{ business.slug }}</p>
      <p v-if="business.status !== 'approved'" class="mt-1 text-xs text-amber-800">
        Not public — replace or remove before saving.
      </p>
    </div>
    <div class="flex shrink-0 items-center gap-1"><slot /></div>
  </div>
</template>
