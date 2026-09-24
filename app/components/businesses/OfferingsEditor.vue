<script setup lang="ts">
import type { OfferingDraft } from '@/composables/businesses/useBusinessProfileEditor'
import { MAX_OFFERINGS, priceCurrencies, priceUnits } from '~~/shared/business-profile'
const items = defineModel<OfferingDraft[]>({ required: true })
defineProps<{ errors: Record<string, string> }>()
defineEmits<{ add: []; remove: [index: number] }>()
const field =
  'mt-2 min-h-12 w-full rounded-xl border border-[#d9e2d8] bg-white px-3 py-2 text-sm text-[#143e32] outline-none focus:border-[#4f805c] focus:ring-2 focus:ring-[#e7f3d8]'
function move(index: number, offset: number) {
  const item = items.value.splice(index, 1)[0]
  if (item) items.value.splice(index + offset, 0, item)
}
</script>
<template>
  <div class="space-y-5">
    <p class="text-sm leading-6 text-[#657069]">
      Show what you offer with a short description and a price, if you have one. Add up to
      {{ MAX_OFFERINGS }} services or products.
    </p>
    <p v-if="!items.length" class="rounded-xl bg-[#f5f8f1] p-4 text-sm text-[#526a58]">
      Start with the service or product customers ask about most.
    </p>
    <p v-if="errors.offerings" role="alert" class="text-sm text-red-700">{{ errors.offerings }}</p>
    <fieldset
      v-for="(item, index) in items"
      :key="item.key"
      class="min-w-0 rounded-2xl border border-[#dfe6dc] p-4 sm:p-5"
    >
      <legend class="px-2 text-sm font-semibold text-[#143e32]">Offering {{ index + 1 }}</legend>
      <div class="mb-4 flex items-center justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="soft"
          icon="i-lucide-arrow-up"
          :aria-label="`Move offering ${index + 1} up`"
          :disabled="index === 0"
          @click="move(index, -1)"
        />
        <UButton
          type="button"
          color="neutral"
          variant="soft"
          icon="i-lucide-arrow-down"
          :aria-label="`Move offering ${index + 1} down`"
          :disabled="index === items.length - 1"
          @click="move(index, 1)"
        />
        <UButton
          type="button"
          color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          :aria-label="`Remove offering ${index + 1}`"
          @click="$emit('remove', index)"
          >Remove</UButton
        >
      </div>
      <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
        <div>
          <label :for="`offering-name-${item.key}`" class="text-sm font-medium"
            >Name <span aria-hidden="true" class="text-red-600">*</span></label
          >
          <input
            :id="`offering-name-${item.key}`"
            v-model="item.name"
            :class="field"
            maxlength="80"
            aria-required="true"
            :aria-invalid="!!errors[`offerings.${index}.name`]"
            :aria-describedby="
              errors[`offerings.${index}.name`] ? `offering-error-${item.key}` : undefined
            "
            placeholder="e.g. Wedding photography"
          />
          <p
            v-if="errors[`offerings.${index}.name`]"
            :id="`offering-error-${item.key}`"
            role="alert"
            class="mt-2 text-sm text-red-700"
          >
            {{ errors[`offerings.${index}.name`] }}
          </p>
        </div>
        <div>
          <label :for="`offering-kind-${item.key}`" class="text-sm font-medium">Type</label
          ><select :id="`offering-kind-${item.key}`" v-model="item.kind" :class="field">
            <option value="service">Service</option>
            <option value="product">Product</option>
          </select>
        </div>
      </div>
      <label :for="`offering-description-${item.key}`" class="mt-4 block text-sm font-medium"
        >Description</label
      >
      <textarea
        :id="`offering-description-${item.key}`"
        v-model="item.description"
        :class="field"
        rows="2"
        maxlength="300"
        placeholder="What is included, and who is it for?"
      />
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label :for="`offering-price-type-${item.key}`" class="text-sm font-medium">Pricing</label
          ><select :id="`offering-price-type-${item.key}`" v-model="item.priceType" :class="field">
            <option value="unspecified">Don't show a price</option>
            <option value="fixed">Fixed price</option>
            <option value="from">Starting from</option>
            <option value="quote">Request a quote</option>
          </select>
        </div>
        <template v-if="item.priceType === 'fixed' || item.priceType === 'from'">
          <div>
            <label :for="`offering-amount-${item.key}`" class="text-sm font-medium"
              >Amount <span aria-hidden="true" class="text-red-600">*</span></label
            ><input
              :id="`offering-amount-${item.key}`"
              v-model="item.amount"
              :class="field"
              inputmode="decimal"
              placeholder="e.g. 25000"
              aria-required="true"
              :aria-invalid="!!errors[`offerings.${index}.price.amountMinor`]"
              :aria-describedby="
                errors[`offerings.${index}.price.amountMinor`]
                  ? `price-error-${item.key}`
                  : undefined
              "
            />
            <p
              v-if="errors[`offerings.${index}.price.amountMinor`]"
              :id="`price-error-${item.key}`"
              role="alert"
              class="mt-2 text-sm text-red-700"
            >
              {{ errors[`offerings.${index}.price.amountMinor`] }}
            </p>
          </div>
          <div>
            <label :for="`offering-currency-${item.key}`" class="text-sm font-medium"
              >Currency</label
            ><select :id="`offering-currency-${item.key}`" v-model="item.currency" :class="field">
              <option v-for="currency in priceCurrencies" :key="currency" :value="currency">
                {{ currency }}
              </option>
            </select>
          </div>
          <div>
            <label :for="`offering-unit-${item.key}`" class="text-sm font-medium"
              >Price applies</label
            ><select :id="`offering-unit-${item.key}`" v-model="item.unit" :class="field">
              <option v-for="unit in priceUnits" :key="unit.value" :value="unit.value">
                {{ unit.label }}
              </option>
            </select>
          </div>
        </template>
      </div>
    </fieldset>
    <UButton
      v-if="items.length < MAX_OFFERINGS"
      type="button"
      color="neutral"
      variant="soft"
      icon="i-lucide-plus"
      size="lg"
      @click="$emit('add')"
      >Add an offering</UButton
    >
    <p v-else role="status" class="text-sm text-[#657069]">
      All {{ MAX_OFFERINGS }} offerings added.
    </p>
  </div>
</template>
