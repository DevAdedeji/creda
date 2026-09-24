<script setup lang="ts">
import type { ManagedBusiness } from '~~/shared/businesses'
import { MAX_FAQS, suggestedPracticalFields } from '~~/shared/business-profile'
import { useBusinessProfileEditor } from '@/composables/businesses/useBusinessProfileEditor'
import OfferingsEditor from './OfferingsEditor.vue'
const props = defineProps<{ business: ManagedBusiness }>()
const {
  offerings,
  practical,
  faqs,
  saving,
  error,
  fieldErrors,
  dirty,
  addOffering,
  removeOffering,
  offeringCount,
  addFaq,
  reset,
  save,
} = useBusinessProfileEditor(props.business)
const form = ref<HTMLFormElement>()
const discardOpen = ref(false)
function discard() {
  reset()
  discardOpen.value = false
}
const sections = computed(() => [
  {
    key: 'offerings',
    title: 'Services & offerings',
    description: 'Show customers what they can come to you for.',
    icon: 'i-lucide-package',
    count: offeringCount.value,
  },
  {
    key: 'practical',
    title: 'Good to know',
    description: 'Help people plan their visit or purchase.',
    icon: 'i-lucide-list-checks',
    count: Object.keys(practical.value).length,
  },
  {
    key: 'faqs',
    title: 'Frequently asked questions',
    description: 'Answer the questions you hear most.',
    icon: 'i-lucide-messages-square',
    count: faqs.value.length,
  },
])
const completed = computed(() => sections.value.filter((section) => section.count > 0).length)
const fields = computed(() =>
  suggestedPracticalFields(props.business.category, props.business.operationMode, practical.value),
)
const field =
  'mt-2 min-h-12 w-full rounded-xl border border-[#d9e2d8] bg-white px-3 py-2 text-sm text-[#143e32] outline-none focus:border-[#4f805c] focus:ring-2 focus:ring-[#e7f3d8]'
function setPractical(key: (typeof fields.value)[number]['key'], event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'yes' || value === 'no') practical.value[key] = value
  else delete practical.value[key]
}
async function submit() {
  if (await save()) return
  for (const element of form.value?.querySelectorAll<HTMLDetailsElement>('details[data-section]') ??
    []) {
    if (Object.keys(fieldErrors.value).some((key) => key.startsWith(element.dataset.section!)))
      element.open = true
  }
  await nextTick()
  const target =
    form.value?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
    form.value?.querySelector<HTMLElement>('[role="alert"]')
  target?.focus()
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
onBeforeRouteLeave(
  () => !dirty.value || window.confirm('You have unsaved business details. Leave without saving?'),
)
</script>
<template>
  <form ref="form" class="space-y-5 text-[#143e32]" @submit.prevent="submit">
    <div class="rounded-2xl border border-[#dce7d5] bg-[#f1f7eb] p-5 sm:p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold">Give customers the full picture</h2>
          <p class="mt-2 text-sm leading-6 text-[#526a58]">
            Add the details that matter to your business. Completed sections appear on your profile
            and bio-link page.
          </p>
        </div>
        <span
          class="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-semibold"
          :aria-label="`${completed} of 3 sections filled`"
          >{{ completed }}/3</span
        >
      </div>
      <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium">
        <li v-for="section in sections" :key="section.key" class="flex items-center gap-1.5">
          <UIcon :name="section.count ? 'i-lucide-circle-check' : 'i-lucide-circle'" />{{
            section.title
          }}
        </li>
      </ul>
    </div>
    <fieldset :disabled="saving" class="min-w-0 space-y-5">
      <details
        v-for="section in sections"
        :key="section.key"
        :data-section="section.key"
        :open="section.key === 'offerings'"
        class="group rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-7"
      >
        <summary
          class="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f3d8]"
            ><UIcon :name="section.icon" class="size-5"
          /></span>
          <span class="min-w-0 flex-1"
            ><span class="block text-lg font-semibold">{{ section.title }}</span
            ><span class="mt-1 block text-sm font-normal text-[#657069]">{{
              section.description
            }}</span></span
          >
          <span class="shrink-0 text-sm text-[#657069]">{{ section.count || '' }}</span
          ><UIcon
            name="i-lucide-chevron-down"
            class="shrink-0 transition-transform group-open:rotate-180"
          />
        </summary>
        <div class="mt-6">
          <OfferingsEditor
            v-if="section.key === 'offerings'"
            v-model="offerings"
            :errors="fieldErrors"
            @add="addOffering"
            @remove="removeOffering"
          />
          <template v-else-if="section.key === 'practical'">
            <p class="mb-5 text-sm leading-6 text-[#657069]">
              These suggestions match your business category. Choose “Not specified” to leave a
              detail off your page.
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div v-for="item in fields" :key="item.key">
                <label
                  :for="`practical-${item.key}`"
                  class="flex items-center gap-2 text-sm font-medium"
                  ><UIcon :name="item.icon" />{{ item.label }}</label
                ><select
                  :id="`practical-${item.key}`"
                  :value="practical[item.key] ?? ''"
                  :class="field"
                  @change="setPractical(item.key, $event)"
                >
                  <option value="">Not specified</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </template>
          <template v-else>
            <p class="mb-5 text-sm leading-6 text-[#657069]">
              Add up to {{ MAX_FAQS }} answers about booking, delivery, returns, or how your
              business works.
            </p>
            <p v-if="!faqs.length" class="mb-4 rounded-xl bg-[#f5f8f1] p-4 text-sm text-[#526a58]">
              A helpful first question: “How do I get started?”
            </p>
            <p v-if="fieldErrors.faqs" role="alert" class="mb-4 text-sm text-red-700">
              {{ fieldErrors.faqs }}
            </p>
            <div
              v-for="(faq, index) in faqs"
              :key="faq.key"
              class="mb-5 rounded-2xl border border-[#dfe6dc] p-4 sm:p-5"
            >
              <div class="mb-4 flex items-center justify-between gap-3">
                <h3 class="text-sm font-semibold">Question {{ index + 1 }}</h3>
                <UButton
                  type="button"
                  color="error"
                  variant="soft"
                  icon="i-lucide-trash-2"
                  :aria-label="`Remove question ${index + 1}`"
                  @click="faqs.splice(index, 1)"
                  >Remove</UButton
                >
              </div>
              <label :for="`faq-question-${faq.key}`" class="text-sm font-medium"
                >Question <span class="text-red-600" aria-hidden="true">*</span></label
              ><input
                :id="`faq-question-${faq.key}`"
                v-model="faq.question"
                :class="field"
                maxlength="160"
                placeholder="e.g. Do I need to book in advance?"
                aria-required="true"
                :aria-invalid="!!fieldErrors[`faqs.${index}.question`]"
                :aria-describedby="
                  fieldErrors[`faqs.${index}.question`]
                    ? `faq-question-error-${faq.key}`
                    : undefined
                "
              />
              <p
                v-if="fieldErrors[`faqs.${index}.question`]"
                :id="`faq-question-error-${faq.key}`"
                role="alert"
                class="mt-2 text-sm text-red-700"
              >
                {{ fieldErrors[`faqs.${index}.question`] }}
              </p>
              <label :for="`faq-answer-${faq.key}`" class="mt-4 block text-sm font-medium"
                >Answer <span class="text-red-600" aria-hidden="true">*</span></label
              ><textarea
                :id="`faq-answer-${faq.key}`"
                v-model="faq.answer"
                :class="field"
                rows="3"
                maxlength="600"
                placeholder="Give a clear, helpful answer."
                aria-required="true"
                :aria-invalid="!!fieldErrors[`faqs.${index}.answer`]"
                :aria-describedby="
                  fieldErrors[`faqs.${index}.answer`] ? `faq-answer-error-${faq.key}` : undefined
                "
              />
              <p
                v-if="fieldErrors[`faqs.${index}.answer`]"
                :id="`faq-answer-error-${faq.key}`"
                role="alert"
                class="mt-2 text-sm text-red-700"
              >
                {{ fieldErrors[`faqs.${index}.answer`] }}
              </p>
            </div>
            <UButton
              v-if="faqs.length < MAX_FAQS"
              type="button"
              color="neutral"
              variant="soft"
              icon="i-lucide-plus"
              size="lg"
              @click="addFaq"
              >Add a question</UButton
            >
            <p v-else role="status" class="text-sm text-[#657069]">
              All {{ MAX_FAQS }} questions added.
            </p>
          </template>
        </div>
      </details>
    </fieldset>
    <UiFeedbackAlert v-if="error" tone="error" :message="error" tabindex="-1" />
    <div
      class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dfe6dc] bg-white p-4 sm:p-5"
    >
      <UButton
        type="button"
        color="neutral"
        variant="soft"
        size="lg"
        :disabled="!dirty || saving"
        @click="discardOpen = true"
        >Discard changes</UButton
      >
      <UButton
        type="submit"
        size="lg"
        :loading="saving"
        :disabled="!dirty"
        class="!bg-[#143e32] !text-white"
        >Save profile details</UButton
      >
    </div>
    <p class="text-center text-xs text-[#657069]">
      Changes here are saved separately from the Business profile tab.
    </p>
    <UModal
      v-model:open="discardOpen"
      title="Discard unsaved details?"
      description="Your saved services, business information and FAQs will stay as they are."
    >
      <template #footer
        ><div class="flex w-full justify-between gap-4">
          <UButton color="neutral" variant="soft" @click="discardOpen = false">Keep editing</UButton
          ><UButton color="error" @click="discard">Discard changes</UButton>
        </div></template
      >
    </UModal>
  </form>
</template>
