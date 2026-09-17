<script setup lang="ts">
import {
  businessCategories,
  businessLinkError,
  businessTypes,
  operationModes,
  type BusinessDraft,
} from '~~/shared/businesses'

const props = withDefaults(
  defineProps<{
    initial?: BusinessDraft
    submitting?: boolean
    submitLabel?: string
    error?: string
  }>(),
  { submitting: false, submitLabel: 'List my business' },
)
const emit = defineEmits<{ submit: [draft: BusinessDraft] }>()

function emptyDraft(): BusinessDraft {
  return {
    name: '',
    description: '',
    category: 'services',
    businessTypes: ['service_business'],
    operationMode: 'physical',
    location: '',
    websiteUrl: '',
    appStoreUrl: '',
    playStoreUrl: '',
    socialUrl: '',
    contactUrl: '',
    logoUrl: '',
  }
}

const draft = reactive<BusinessDraft>(emptyDraft())
const linkError = ref('')
const locationError = ref('')
const locationRequired = computed(() => draft.operationMode !== 'online')
const needsWebsite = computed(() =>
  draft.businessTypes.some((type) => ['web_app', 'desktop_app', 'online_store'].includes(type)),
)
const needsMobileStores = computed(() => draft.businessTypes.includes('mobile_app'))
const showSocialContact = computed(() =>
  draft.businessTypes.some((type) =>
    ['online_store', 'service_business', 'physical_business'].includes(type),
  ),
)
watch(
  () => props.initial,
  (value) => {
    if (value) Object.assign(draft, { ...value, businessTypes: [...value.businessTypes] })
  },
  { immediate: true },
)

const fieldUi = {
  base: '!rounded-xl !border !border-[#d9e2d8] !bg-white !shadow-none !ring-0 focus:!border-[#4f805c] focus:!ring-0',
}

function submit() {
  locationError.value = ''
  linkError.value = ''
  if (!draft.businessTypes.length) {
    linkError.value = 'Choose at least one business type.'
    return
  }
  if (locationRequired.value && draft.location.trim().length < 2) {
    locationError.value = 'Add a location for an in-person business.'
    return
  }
  const payload: BusinessDraft = {
    ...draft,
    businessTypes: [...draft.businessTypes],
    websiteUrl: needsWebsite.value ? draft.websiteUrl : '',
    appStoreUrl: needsMobileStores.value ? draft.appStoreUrl : '',
    playStoreUrl: needsMobileStores.value ? draft.playStoreUrl : '',
    socialUrl: showSocialContact.value ? draft.socialUrl : '',
    contactUrl: showSocialContact.value ? draft.contactUrl : '',
  }
  const linkIssue = businessLinkError(payload)
  if (linkIssue) {
    linkError.value = linkIssue
    return
  }
  emit('submit', payload)
}
</script>

<template>
  <form class="space-y-8" @submit.prevent="submit">
    <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
      <div class="mb-7 flex items-start gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f3d8] text-xl text-[#315e42]"
          ><UIcon name="i-lucide-store"
        /></span>
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-[#143e32]">The basics</h2>
          <p class="mt-1 text-sm text-[#657069]">
            Tell people what this business does and where it operates.
          </p>
        </div>
      </div>
      <div class="space-y-5">
        <UFormField label="Business name" name="name" required>
          <UInput
            v-model="draft.name"
            name="name"
            placeholder="e.g. Kora Studio"
            :maxlength="120"
            class="w-full"
            size="xl"
            :ui="fieldUi"
            required
          />
        </UFormField>
        <UFormField label="Short description" name="description" required>
          <UTextarea
            v-model="draft.description"
            name="description"
            placeholder="What does the business offer, and who is it for?"
            :rows="4"
            :maxlength="600"
            class="w-full"
            :ui="fieldUi"
            required
          />
        </UFormField>
        <div class="grid gap-5 sm:grid-cols-2">
          <UFormField label="Category" name="category" required>
            <USelect
              v-model="draft.category"
              :items="[...businessCategories]"
              name="category"
              class="w-full"
              size="xl"
              :ui="fieldUi"
            />
          </UFormField>
          <UFormField label="Business types" name="businessTypes" required>
            <USelectMenu
              v-model="draft.businessTypes"
              :items="[...businessTypes]"
              value-key="value"
              multiple
              :search-input="false"
              placeholder="Select all that apply"
              name="businessTypes"
              class="w-full"
              size="xl"
              :ui="fieldUi"
            />
          </UFormField>
          <UFormField label="How it operates" name="operationMode" required>
            <USelect
              v-model="draft.operationMode"
              :items="[...operationModes]"
              name="operationMode"
              class="w-full"
              size="xl"
              :ui="fieldUi"
            />
          </UFormField>
          <UFormField label="Location" name="location" :required="locationRequired">
            <UInput
              v-model="draft.location"
              name="location"
              placeholder="e.g. Yaba, Lagos, Nigeria"
              :maxlength="160"
              class="w-full"
              size="xl"
              :ui="fieldUi"
              :required="locationRequired"
            />
            <p v-if="locationError" role="alert" class="mt-2 text-sm text-red-700">
              {{ locationError }}
            </p>
          </UFormField>
          <UFormField label="Logo image URL" name="logoUrl">
            <UInput
              v-model="draft.logoUrl"
              name="logoUrl"
              type="url"
              placeholder="https://example.com/logo.png"
              :maxlength="500"
              class="w-full"
              size="xl"
              :ui="fieldUi"
            />
          </UFormField>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
      <div class="mb-7 flex items-start gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f3d8] text-xl text-[#315e42]"
          ><UIcon name="i-lucide-link-2"
        /></span>
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-[#143e32]">
            Where can people find you?
          </h2>
          <p class="mt-1 text-sm text-[#657069]">
            The links we ask for match the business types you selected.
          </p>
        </div>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <UFormField
          v-if="needsWebsite"
          :label="
            draft.businessTypes.includes('desktop_app') ? 'Website or download page' : 'Website'
          "
          name="websiteUrl"
          required
        >
          <UInput
            v-model="draft.websiteUrl"
            name="websiteUrl"
            type="url"
            placeholder="https://yourbusiness.com"
            :maxlength="500"
            class="w-full"
            size="xl"
            :ui="fieldUi"
            required
          />
        </UFormField>
        <template v-if="needsMobileStores">
          <UFormField label="Apple App Store" name="appStoreUrl">
            <UInput
              v-model="draft.appStoreUrl"
              name="appStoreUrl"
              type="url"
              placeholder="https://apps.apple.com/…"
              :maxlength="500"
              class="w-full"
              size="xl"
              :ui="fieldUi"
            />
          </UFormField>
          <UFormField label="Google Play Store" name="playStoreUrl">
            <UInput
              v-model="draft.playStoreUrl"
              name="playStoreUrl"
              type="url"
              placeholder="https://play.google.com/store/apps/…"
              :maxlength="500"
              class="w-full"
              size="xl"
              :ui="fieldUi"
            />
          </UFormField>
        </template>
        <template v-if="showSocialContact">
          <UFormField label="Official social profile" name="socialUrl">
            <UInput
              v-model="draft.socialUrl"
              name="socialUrl"
              type="url"
              placeholder="https://instagram.com/…"
              :maxlength="500"
              class="w-full"
              size="xl"
              :ui="fieldUi"
            />
          </UFormField>
          <UFormField label="Contact link" name="contactUrl">
            <UInput
              v-model="draft.contactUrl"
              name="contactUrl"
              type="url"
              placeholder="https://wa.me/…"
              :maxlength="500"
              class="w-full"
              size="xl"
              :ui="fieldUi"
            />
          </UFormField>
        </template>
      </div>
      <p v-if="linkError" role="alert" class="mt-4 text-sm font-medium text-red-700">
        {{ linkError }}
      </p>
    </section>

    <div class="rounded-2xl bg-[#edf3e7] p-5 text-sm leading-6 text-[#49604e]">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-info" class="mt-0.5 shrink-0 text-lg" />
        <p>
          Your business will appear in public search right away. Ownership verification is a
          separate check, and only verified businesses get a badge.
        </p>
      </div>
    </div>
    <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-sm text-red-800">
      {{ error }}
    </p>
    <div class="flex flex-wrap items-center gap-4">
      <UButton
        type="submit"
        size="xl"
        :loading="submitting"
        class="!rounded-xl !bg-[#143e32] !px-6 !py-3 !font-semibold !text-white hover:!bg-[#24563f]"
        >{{ submitLabel }} <UIcon name="i-lucide-arrow-right"
      /></UButton>
    </div>
  </form>
</template>
