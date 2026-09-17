<script setup lang="ts">
import { businessCategories, type BusinessListItem } from '~~/shared/businesses'

defineProps<{ business: BusinessListItem }>()
const categoryLabel = (value: BusinessListItem['category']) =>
  businessCategories.find((item) => item.value === value)?.label ?? value
</script>

<template>
  <NuxtLink
    :to="'/businesses/' + business.slug"
    class="group flex h-full flex-col rounded-2xl border border-[#dfe6dc] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#b9cdb4] hover:shadow-[0_16px_40px_#143e3212]"
  >
    <div class="flex items-start justify-between gap-4">
      <img
        v-if="business.logoUrl"
        :src="business.logoUrl"
        alt=""
        width="60"
        height="60"
        loading="lazy"
        referrerpolicy="no-referrer"
        class="size-15 rounded-xl border border-[#e0e7db] object-cover"
      />
      <span
        v-else
        class="grid size-15 place-items-center rounded-xl bg-[#dff0d7] text-2xl font-bold text-[#28583c]"
        >{{ business.name.charAt(0).toUpperCase() }}</span
      >
      <UIcon
        name="i-lucide-arrow-up-right"
        class="text-xl text-[#819482] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#143e32]"
      />
    </div>
    <div class="mt-6 flex flex-wrap items-center gap-2">
      <span class="rounded-full bg-[#eff4e9] px-2.5 py-1 text-xs font-semibold text-[#466c4e]">{{
        categoryLabel(business.category)
      }}</span>
      <span
        v-if="business.ownershipStatus === 'verified'"
        class="inline-flex items-center gap-1 rounded-full bg-[#e4f2db] px-2.5 py-1 text-xs font-semibold text-[#2f6241]"
        ><UIcon name="i-lucide-badge-check" /> Ownership verified</span
      >
    </div>
    <h2 class="mt-4 text-[22px] font-semibold tracking-[-.04em] text-[#143e32]">
      {{ business.name }}
    </h2>
    <div
      v-if="business.reviewCount"
      class="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#795c20]"
      :aria-label="`${business.averageRating} out of 5 stars from ${business.reviewCount} ${business.reviewCount === 1 ? 'review' : 'reviews'}`"
    >
      <span class="text-lg leading-none text-[#d59b34]" aria-hidden="true">★</span>
      <span>{{ business.averageRating }}</span>
      <span class="font-normal text-[#738076]">({{ business.reviewCount }})</span>
    </div>
    <p class="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[#657069]">
      {{ business.description }}
    </p>
    <div
      class="mt-6 flex items-center gap-1.5 border-t border-[#edf0e9] pt-4 text-xs font-medium text-[#6b796e]"
    >
      <UIcon name="i-lucide-map-pin" /> {{ business.location || 'Online' }}
    </div>
  </NuxtLink>
</template>
