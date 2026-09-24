<script setup lang="ts">
import {
  offeringPriceLabel,
  practicalFields,
  type BusinessProfileDetails,
  type BusinessProfileSource,
} from '~~/shared/business-profile'
const props = defineProps<{
  details: BusinessProfileDetails
  source?: BusinessProfileSource | null
}>()
const practical = computed(() =>
  practicalFields.filter((field) => props.details.practical[field.key] !== undefined),
)
</script>
<template>
  <section
    v-if="details.offerings.length"
    aria-labelledby="offerings-heading"
    class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8"
  >
    <h2 id="offerings-heading" class="text-2xl font-semibold tracking-tight text-[#143e32]">
      Services & offerings
    </h2>
    <p v-if="source" class="mt-2 text-sm text-[#657069]">
      Summarised from the
      <a
        :href="source.url"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-[#315840] underline underline-offset-4"
        >official website</a
      >.
    </p>
    <div class="mt-5 grid gap-4 sm:grid-cols-2">
      <article
        v-for="offering in details.offerings"
        :key="offering.name"
        class="flex min-w-0 flex-col rounded-xl border border-[#e1e8dc] bg-[#fafcf7] p-5"
      >
        <span class="text-xs font-medium uppercase tracking-wide text-[#63765f]">{{
          offering.kind
        }}</span>
        <h3 class="mt-2 break-words text-lg font-semibold text-[#143e32]">{{ offering.name }}</h3>
        <p
          v-if="offering.description"
          class="mt-2 whitespace-pre-line break-words text-sm leading-6 text-[#657069]"
        >
          {{ offering.description }}
        </p>
        <p
          v-if="offeringPriceLabel(offering.price)"
          class="mt-auto break-words pt-4 text-sm font-semibold text-[#315840]"
        >
          {{ offeringPriceLabel(offering.price) }}
        </p>
      </article>
    </div>
    <p
      v-if="details.offerings.some((item) => item.price.type !== 'unspecified')"
      class="mt-4 text-xs leading-5 text-[#657069]"
    >
      Prices are provided by the business. Confirm the final price and availability before booking
      or buying.
    </p>
  </section>
  <section
    v-if="practical.length"
    aria-labelledby="practical-heading"
    class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8"
  >
    <h2 id="practical-heading" class="text-2xl font-semibold tracking-tight text-[#143e32]">
      Good to know
    </h2>
    <dl class="mt-5 grid gap-x-7 gap-y-4 sm:grid-cols-2">
      <div
        v-for="field in practical"
        :key="field.key"
        class="flex items-start justify-between gap-3 border-b border-[#edf0e9] pb-3"
      >
        <dt class="flex items-start gap-2 text-sm text-[#45614d]">
          <UIcon :name="field.icon" class="mt-0.5 size-4 shrink-0" />{{ field.label }}
        </dt>
        <dd
          class="shrink-0 text-sm font-semibold"
          :class="details.practical[field.key] === 'yes' ? 'text-[#315840]' : 'text-[#657069]'"
        >
          {{ details.practical[field.key] === 'yes' ? 'Yes' : 'No' }}
        </dd>
      </div>
    </dl>
  </section>
  <section
    v-if="details.faqs.length"
    aria-labelledby="business-faqs-heading"
    class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8"
  >
    <h2 id="business-faqs-heading" class="text-2xl font-semibold tracking-tight text-[#143e32]">
      Frequently asked questions
    </h2>
    <p class="mt-2 text-sm text-[#657069]">
      <template v-if="source">
        Summarised from the
        <a
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-[#315840] underline underline-offset-4"
          >official website</a
        >. Reviewed
        {{
          new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          }).format(new Date(source.reviewedAt))
        }}.
      </template>
      <template v-else>Answers from the business.</template>
    </p>
    <div class="mt-5 divide-y divide-[#e5ebdf]">
      <details v-for="faq in details.faqs" :key="faq.question" class="group py-4">
        <summary
          class="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-[#143e32] [&::-webkit-details-marker]:hidden"
        >
          <span class="break-words">{{ faq.question }}</span
          ><UIcon
            name="i-lucide-plus"
            class="mt-0.5 shrink-0 transition-transform group-open:rotate-45"
          />
        </summary>
        <p class="mt-3 whitespace-pre-line break-words text-sm leading-7 text-[#657069]">
          {{ faq.answer }}
        </p>
      </details>
    </div>
  </section>
</template>
