<script setup lang="ts">
import { businessCategories, type PublicBusiness } from '~~/shared/businesses'

defineProps<{ business: PublicBusiness | null }>()
const categoryLabel = (category: PublicBusiness['category']) =>
  businessCategories.find((item) => item.value === category)?.label ?? category
</script>

<template>
  <div
    class="relative isolate flex min-h-[395px] flex-col justify-between overflow-hidden rounded-2xl bg-[#e6edde] p-5 sm:min-h-[450px] sm:px-[30px] sm:py-[26px] lg:min-h-[440px] xl:min-h-[472px]"
  >
    <div
      class="pointer-events-none absolute top-20 -right-[190px] -z-10 size-[480px] rounded-full border border-[#c6d3bd]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute top-[5px] -right-[265px] -z-10 size-[630px] rounded-full border border-[#c6d3bd]"
      aria-hidden="true"
    />
    <div
      class="z-10 flex items-center gap-2 text-[11px] font-semibold tracking-[.17em] text-[#172f27]"
    >
      <span class="text-2xl leading-none text-[#506f3c]" aria-hidden="true">✳</span> GOOD FINDS
      START HERE.
    </div>

    <div
      class="relative mx-auto mb-[54px] mt-[30px] w-[94%] rotate-[-5deg] rounded-xl border border-[#e3e5d8] bg-[#fffef8] p-[17px] shadow-[0_16px_45px_#29422519] transition-transform duration-300 hover:-translate-y-1 hover:rotate-[-2deg] sm:mb-[65px] sm:p-[22px] xl:w-[88%]"
    >
      <template v-if="business">
        <div class="flex items-center justify-between gap-3">
          <NuxtImg
            v-if="business.logoUrl"
            :src="business.logoUrl"
            alt=""
            width="60"
            height="60"
            format="webp"
            class="size-[53px] rounded-[13px] object-cover"
          />
          <span
            v-else
            class="grid size-[53px] place-items-center rounded-[13px] bg-[#f6b789] text-xl font-bold text-[#703622]"
            >{{ business.name.charAt(0).toUpperCase() }}</span
          >
          <span
            v-if="business.ownershipStatus === 'verified'"
            class="inline-flex items-center gap-1 text-[9px] tracking-[.16em] text-[#727967]"
            ><UIcon name="i-lucide-badge-check" /> VERIFIED</span
          >
        </div>
        <h2
          class="mt-[18px] flex items-center justify-between gap-2 text-[27px] font-bold tracking-[-.05em] text-[#143e32]"
        >
          {{ business.name }}<span class="text-2xl font-normal">↗</span>
        </h2>
        <p class="mt-1 line-clamp-2 text-[13px] leading-5 text-[#667064]">
          {{ business.description }}
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-1 text-[10px] text-[#71796b]">
          <UIcon name="i-lucide-map-pin" /> {{ business.location || 'Online' }}
          <span class="mx-1">·</span> {{ categoryLabel(business.category) }}
        </div>
        <div class="my-[18px] h-px bg-[#e6e8df]" />
        <div class="flex flex-col gap-2.5 text-[11px] text-[#172f27]">
          <span class="flex items-center gap-2"
            ><UIcon name="i-lucide-building-2" class="text-[15px] text-[#64814a]" /> Get to know the
            business</span
          ><span class="flex items-center gap-2"
            ><UIcon name="i-lucide-link-2" class="text-[15px] text-[#64814a]" /> Find official
            links</span
          >
        </div>
        <NuxtLink
          :to="'/businesses/' + business.slug"
          class="mt-5 flex w-full items-center justify-between rounded-md bg-[#edf1e5] px-3 py-2.5 text-xs font-semibold text-[#143e32] transition hover:bg-[#dce8c6]"
          >Explore this business <UIcon name="i-lucide-arrow-up-right" class="text-base"
        /></NuxtLink>
      </template>
      <template v-else>
        <div class="flex items-center justify-between gap-3">
          <span
            class="grid size-[53px] place-items-center rounded-[13px] bg-[#f6b789] text-[34px] text-[#703622]"
            ><UIcon name="i-lucide-sparkles" /></span
          ><span class="text-[9px] tracking-[.16em] text-[#727967]">CREDA DIRECTORY</span>
        </div>
        <h2
          class="mt-[18px] flex items-center justify-between text-[27px] font-bold leading-tight tracking-[-.05em] text-[#143e32]"
        >
          Your next<br />good find<span class="text-2xl font-normal">↗</span>
        </h2>
        <p class="mt-1 text-[13px] leading-5 text-[#667064]">
          A home for independent businesses worth knowing.
        </p>
        <div class="my-[18px] h-px bg-[#e6e8df]" />
        <div class="flex flex-col gap-2.5 text-[11px]">
          <span class="flex items-center gap-2"
            ><UIcon name="i-lucide-compass" class="text-[15px] text-[#64814a]" /> Discover what’s
            nearby</span
          ><span class="flex items-center gap-2"
            ><UIcon name="i-lucide-store" class="text-[15px] text-[#64814a]" /> Share what you’re
            building</span
          >
        </div>
        <NuxtLink
          to="/businesses/new"
          class="mt-5 flex w-full items-center justify-between rounded-md bg-[#edf1e5] px-3 py-2.5 text-xs font-semibold text-[#143e32] transition hover:bg-[#dce8c6]"
          >Be one of the first <UIcon name="i-lucide-arrow-up-right" class="text-base"
        /></NuxtLink>
      </template>
    </div>

    <div
      class="absolute bottom-12 right-5 flex rotate-[5deg] items-center gap-3 rounded-lg bg-[#d4c5ed] p-3 text-[11px] leading-[1.55] text-[#3e3053] shadow-[0_8px_20px_#31284015] sm:bottom-[57px] sm:px-5 sm:py-4 sm:text-[13px]"
    >
      <span
        class="grid size-7 place-items-center rounded-full border border-[#9e89bd] text-xl sm:size-[34px]"
        ><UIcon name="i-lucide-scan-eye"
      /></span>
      <span
        >A little context.<br /><strong class="font-semibold">A lot more confidence.</strong></span
      >
    </div>
    <div class="flex items-center justify-between text-[11px] text-[#576c4b]">
      <span>Less guesswork. More discovery.</span><span class="text-2xl" aria-hidden="true">↗</span>
    </div>
  </div>
</template>
