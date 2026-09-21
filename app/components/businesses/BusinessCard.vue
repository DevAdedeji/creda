<script setup lang="ts">
import { businessCategories, operationModes, type BusinessListItem } from '~~/shared/businesses'

defineProps<{
  business: BusinessListItem
  showSave?: boolean
  saved?: boolean
  savePending?: boolean
  matchReasons?: string[]
}>()
defineEmits<{ toggleSave: [] }>()
const categoryLabel = (value: BusinessListItem['category']) =>
  businessCategories.find((item) => item.value === value)?.label ?? value
const modeLabel = (value: BusinessListItem['operationMode']) =>
  operationModes.find((item) => item.value === value)?.label ?? value
</script>

<template>
  <article
    class="group relative h-full rounded-2xl border border-[#dfe6dc] bg-white transition duration-200 hover:-translate-y-1 hover:border-[#b9cdb4] hover:shadow-[0_16px_40px_#143e3212]"
  >
    <NuxtLink
      :to="'/businesses/' + business.slug"
      class="flex h-full flex-col rounded-2xl p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315b3a]"
    >
      <div class="flex items-start justify-between gap-4">
        <NuxtImg
          v-if="business.logoUrl"
          :src="business.logoUrl"
          alt=""
          width="60"
          height="60"
          loading="lazy"
          format="webp"
          class="size-15 rounded-xl border border-[#e0e7db] object-cover"
        />
        <span
          v-else
          class="grid size-15 place-items-center rounded-xl bg-[#dff0d7] text-2xl font-bold text-[#28583c]"
          >{{ business.name.charAt(0).toUpperCase() }}</span
        >
        <UIcon
          v-if="!showSave"
          name="i-lucide-arrow-up-right"
          class="text-xl text-[#819482] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#143e32]"
        />
      </div>
      <div class="mt-6 flex flex-wrap items-center gap-2">
        <span class="rounded-full bg-[#eff4e9] px-2.5 py-1 text-xs font-semibold text-[#466c4e]">{{
          categoryLabel(business.category)
        }}</span>
        <span class="rounded-full bg-[#f2f5f1] px-2.5 py-1 text-xs font-semibold text-[#536c59]">{{
          modeLabel(business.operationMode)
        }}</span>
      </div>
      <h2 class="mt-4 text-[22px] font-semibold tracking-[-.04em] text-[#143e32]">
        {{ business.name }}
        <BusinessesVerifiedMark v-if="business.ownershipStatus === 'verified'" in-link />
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
      <div v-if="matchReasons?.length" class="mt-4 rounded-xl bg-[#f1f6ec] p-3">
        <p class="text-xs font-semibold text-[#345341]">Why it matches</p>
        <ul class="mt-2 space-y-1.5 text-xs leading-5 text-[#5c7157]">
          <li v-for="reason in matchReasons" :key="reason" class="flex items-start gap-1.5">
            <UIcon name="i-lucide-check" class="mt-1 shrink-0" />{{ reason }}
          </li>
        </ul>
      </div>
      <div
        class="mt-6 flex items-center gap-1.5 border-t border-[#edf0e9] pt-4 text-xs font-medium text-[#6b796e]"
      >
        <UIcon
          :name="business.operationMode === 'online' ? 'i-lucide-globe-2' : 'i-lucide-map-pin'"
        />
        {{
          [business.city, business.state].filter(Boolean).join(', ') ||
          business.location ||
          'Online'
        }}
      </div>
    </NuxtLink>
    <button
      v-if="showSave"
      type="button"
      class="absolute right-4 top-4 grid size-10 place-items-center rounded-xl border text-lg shadow-sm transition hover:border-[#adc9a4] hover:bg-[#eff6e9] hover:text-[#143e32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315b3a] disabled:cursor-wait disabled:opacity-60"
      :class="
        saved
          ? 'border-[#bcd5ad] bg-[#e8f4da] text-[#24573b]'
          : 'border-[#dce6d9] bg-white text-[#496b50]'
      "
      :disabled="savePending"
      :aria-label="`${saved ? 'Remove' : 'Save'} ${business.name} ${saved ? 'from' : 'to'} saved businesses`"
      :aria-pressed="Boolean(saved)"
      :title="saved ? 'Remove from saved' : 'Save business'"
      @click="$emit('toggleSave')"
    >
      <UIcon :name="saved ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'" />
    </button>
  </article>
</template>
