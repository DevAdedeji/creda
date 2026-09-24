<script setup lang="ts">
import {
  businessCategories,
  businessLinkError,
  type BusinessCategory,
  type BusinessDraft,
} from '~~/shared/businesses'
import LocationInput from '@/components/businesses/LocationInput.vue'
import BusinessHoursEditor from '@/components/businesses/BusinessHoursEditor.vue'
import { apiErrorMessage } from '@/utils/apiError'
import { matchingNigeriaState, nigeriaStates } from '~~/shared/nigeriaStates'

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
    category: '',
    operationMode: 'physical',
    location: '',
    city: '',
    state: '',
    serviceArea: '',
    openingHours: '',
    weeklyHours: [],
    hoursTimeZone: '',
    services: [],
    googlePlaceId: '',
    websiteUrl: '',
    appStoreUrl: '',
    playStoreUrl: '',
    socialUrl: '',
    contactUrl: '',
    logoUrl: '',
    coverUrl: '',
    galleryUrls: [],
    mediaProofs: [],
  }
}

const draft = reactive<BusinessDraft>(emptyDraft())
const servicesText = ref('')
const linkError = ref('')
const locationError = ref('')
const areaError = ref('')
const categoryError = ref('')
const hoursError = ref('')
const mediaError = ref('')
const uploading = ref<'logo' | 'cover' | 'gallery' | null>(null)
const customState = ref(false)
const uploadedProofs = new Map<string, string>()
const locationRequired = computed(() => draft.operationMode !== 'online')
const selectedCategory = computed<BusinessCategory | undefined>({
  get: () => draft.category || undefined,
  set: (value) => {
    draft.category = value ?? ''
  },
})
const stateItems = [
  ...nigeriaStates.map((state) => ({ label: state, value: state })),
  { label: 'Another state or region', value: 'other' },
]
const selectedState = computed<string | undefined>({
  get: () => (customState.value ? 'other' : matchingNigeriaState(draft.state)),
  set: (value) => {
    customState.value = value === 'other'
    draft.state = customState.value ? '' : (value ?? '')
  },
})
const modeChoices = [
  {
    value: 'online',
    icon: 'i-lucide-globe-2',
    title: 'Online',
    detail: 'Website, app, or online service',
  },
  {
    value: 'physical',
    icon: 'i-lucide-map-pin',
    title: 'In person',
    detail: 'A location or local service area',
  },
  { value: 'hybrid', icon: 'i-lucide-store', title: 'Both', detail: 'Online and in person' },
] as const
const showAppStores = computed(
  () => draft.operationMode !== 'physical' || Boolean(draft.appStoreUrl || draft.playStoreUrl),
)
function onPlaceSelected(place: { city: string; state: string }) {
  draft.city = place.city
  const state = matchingNigeriaState(place.state)
  draft.state = state ?? place.state
  customState.value = Boolean(place.state && !state)
}
function onPlaceCleared() {
  draft.city = ''
  draft.state = ''
  customState.value = false
}
watch(
  () => props.initial,
  (value) => {
    if (value) {
      uploadedProofs.clear()
      Object.assign(draft, {
        ...value,
        weeklyHours: value.weeklyHours.map((day) => ({ ...day })),
        services: [...value.services],
        galleryUrls: [...value.galleryUrls],
        mediaProofs: [...value.mediaProofs],
      })
      customState.value = Boolean(value.state && !matchingNigeriaState(value.state))
      draft.state = matchingNigeriaState(value.state) ?? value.state
      servicesText.value = value.services.join('\n')
    }
  },
  { immediate: true },
)

const fieldUi = {
  base: '!rounded-xl !border !border-[#d9e2d8] !bg-white !shadow-none !ring-0 focus:!border-[#4f805c] focus:!ring-0',
}

function submit() {
  if (uploading.value) return
  locationError.value = ''
  areaError.value = ''
  categoryError.value = ''
  hoursError.value = ''
  linkError.value = ''
  if (!draft.category) {
    categoryError.value = 'Choose a category for this business.'
    return
  }
  if (locationRequired.value && draft.location.trim().length < 2) {
    locationError.value = 'Add a location for an in-person business.'
    return
  }
  if (locationRequired.value && (draft.city.trim().length < 2 || draft.state.trim().length < 2)) {
    areaError.value = 'Add the city and state for an in-person business.'
    return
  }
  if (draft.weeklyHours.some((row) => !row.start || !row.end || row.start >= row.end)) {
    hoursError.value = 'Each open day needs a closing time after its opening time.'
    return
  }
  const payload: BusinessDraft = {
    ...draft,
    location: locationRequired.value ? draft.location : '',
    googlePlaceId: locationRequired.value ? draft.googlePlaceId : '',
    serviceArea: locationRequired.value ? draft.serviceArea : '',
    services: servicesText.value
      .split(/[,\n]/)
      .map((value) => value.trim())
      .filter(Boolean),
    weeklyHours: draft.weeklyHours.map((day) => ({ ...day })),
    hoursTimeZone: draft.weeklyHours.length ? draft.hoursTimeZone : '',
    openingHours: draft.weeklyHours.length ? '' : draft.openingHours,
    galleryUrls: [...draft.galleryUrls],
    mediaProofs: [draft.logoUrl, draft.coverUrl, ...draft.galleryUrls]
      .map((url) => uploadedProofs.get(url))
      .filter((proof): proof is string => Boolean(proof)),
    websiteUrl: draft.websiteUrl,
    appStoreUrl: showAppStores.value ? draft.appStoreUrl : '',
    playStoreUrl: showAppStores.value ? draft.playStoreUrl : '',
    socialUrl: draft.socialUrl,
    contactUrl: draft.contactUrl,
  }
  const linkIssue = businessLinkError(payload)
  if (linkIssue) {
    linkError.value = linkIssue
    return
  }
  emit('submit', payload)
}

async function selectImages(event: Event, kind: 'logo' | 'cover' | 'gallery') {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length || uploading.value) return
  mediaError.value = ''
  if (kind === 'gallery' && files.length + draft.galleryUrls.length > 8) {
    mediaError.value = 'Choose up to 8 gallery photos.'
    return
  }
  uploading.value = kind
  try {
    for (const file of files) {
      if (
        !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      ) {
        mediaError.value = 'Use PNG, JPEG, or WebP images up to 5 MB each.'
        break
      }
      const body = new FormData()
      body.append('image', file)
      const result = await $fetch<{ url: string; proof: string }>('/api/businesses/images', {
        method: 'POST',
        body,
      })
      uploadedProofs.set(result.url, result.proof)
      if (kind === 'logo') draft.logoUrl = result.url
      else if (kind === 'cover') draft.coverUrl = result.url
      else draft.galleryUrls.push(result.url)
    }
  } catch (error) {
    mediaError.value = apiErrorMessage(error, 'This image could not be uploaded. Please try again.')
  } finally {
    uploading.value = null
  }
}
</script>

<template>
  <form class="space-y-8" @submit.prevent="submit">
    <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
      <div class="mb-6 flex items-start gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f3d8] text-xl text-[#315e42]"
          ><UIcon name="i-lucide-compass"
        /></span>
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-[#143e32]">
            How can people find this business?
          </h2>
          <p class="mt-1 text-sm text-[#657069]">
            Choose the option that best describes how customers use it.
          </p>
        </div>
      </div>
      <div
        class="grid gap-3 sm:grid-cols-3"
        role="radiogroup"
        aria-label="How the business operates"
      >
        <label
          v-for="choice in modeChoices"
          :key="choice.value"
          class="relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors"
          :class="
            draft.operationMode === choice.value
              ? 'border-[#315e42] bg-[#eff6e9] ring-1 ring-[#315e42]'
              : 'border-[#dfe6dc] hover:border-[#9bb79b]'
          "
        >
          <input
            v-model="draft.operationMode"
            type="radio"
            name="operationMode"
            :value="choice.value"
            class="sr-only"
          />
          <UIcon :name="choice.icon" class="mt-0.5 shrink-0 text-xl text-[#315e42]" />
          <span
            ><span class="block text-sm font-semibold text-[#143e32]">{{ choice.title }}</span
            ><span class="mt-1 block text-xs leading-5 text-[#657069]">{{
              choice.detail
            }}</span></span
          >
        </label>
      </div>
    </section>
    <details
      class="group rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8"
      :open="!!(draft.logoUrl || draft.coverUrl || draft.galleryUrls.length) || undefined"
    >
      <summary
        class="flex cursor-pointer list-none items-start gap-3 [&::-webkit-details-marker]:hidden"
      >
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f3d8] text-xl text-[#315e42]"
        >
          <UIcon name="i-lucide-images" />
        </span>
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-[#143e32]">Add photos</h2>
          <p class="mt-1 text-sm text-[#657069]">
            Add a logo, a cover image, and photos that show what you do.
          </p>
        </div>
        <UIcon
          name="i-lucide-chevron-down"
          class="ml-auto mt-2 shrink-0 text-[#49604e] transition-transform group-open:rotate-180"
        />
      </summary>
      <div class="mt-7 grid gap-5 sm:grid-cols-2">
        <div class="rounded-2xl border border-[#dfe6dc] bg-[#fbfcf8] p-5">
          <p class="text-sm font-semibold text-[#143e32]">Logo</p>
          <p class="mt-1 text-xs text-[#657069]">A square image works best.</p>
          <div class="mt-4 flex h-28 items-center rounded-xl bg-[#e7f3d8] p-4">
            <NuxtImg
              v-if="draft.logoUrl"
              :src="draft.logoUrl"
              alt="Logo preview"
              width="80"
              height="80"
              format="webp"
              class="size-20 rounded-xl border border-[#dfe6dc] bg-white object-cover"
            />
            <div v-else class="grid size-20 place-items-center rounded-xl text-2xl text-[#315e42]">
              <UIcon name="i-lucide-image-plus" />
            </div>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-4">
            <input
              id="business-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="peer sr-only"
              :disabled="!!uploading"
              @change="selectImages($event, 'logo')"
            />
            <label
              for="business-logo"
              class="inline-flex min-w-32 cursor-pointer justify-center rounded-xl border border-[#c9d9c7] bg-white px-4 py-2 text-sm font-semibold text-[#234532] hover:bg-[#f2f7ec] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#315e42]"
            >
              {{
                uploading === 'logo' ? 'Uploading…' : draft.logoUrl ? 'Change logo' : 'Upload logo'
              }}
            </label>
            <button
              v-if="draft.logoUrl"
              type="button"
              class="text-xs font-semibold text-[#657069] hover:underline"
              @click="draft.logoUrl = ''"
            >
              Remove
            </button>
          </div>
        </div>
        <div class="rounded-2xl border border-[#dfe6dc] bg-[#fbfcf8] p-5">
          <p class="text-sm font-semibold text-[#143e32]">Cover image</p>
          <p class="mt-1 text-xs text-[#657069]">Set the tone at the top of your profile.</p>
          <NuxtImg
            v-if="draft.coverUrl"
            :src="draft.coverUrl"
            alt="Cover preview"
            width="512"
            height="112"
            format="webp"
            class="mt-4 h-28 w-full rounded-xl object-cover"
          />
          <div
            v-else
            class="mt-4 grid h-28 place-items-center rounded-xl bg-[#e7f3d8] text-2xl text-[#315e42]"
          >
            <UIcon name="i-lucide-image-plus" />
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-4">
            <input
              id="business-cover"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="peer sr-only"
              :disabled="!!uploading"
              @change="selectImages($event, 'cover')"
            />
            <label
              for="business-cover"
              class="inline-flex min-w-32 cursor-pointer justify-center rounded-xl border border-[#c9d9c7] bg-white px-4 py-2 text-sm font-semibold text-[#234532] hover:bg-[#f2f7ec] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#315e42]"
            >
              {{
                uploading === 'cover'
                  ? 'Uploading…'
                  : draft.coverUrl
                    ? 'Change cover'
                    : 'Upload cover'
              }}
            </label>
            <button
              v-if="draft.coverUrl"
              type="button"
              class="text-xs font-semibold text-[#657069] hover:underline"
              @click="draft.coverUrl = ''"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
      <div class="mt-5 rounded-2xl border border-[#dfe6dc] bg-[#fbfcf8] p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[#143e32]">Gallery photos</p>
            <p class="mt-1 text-xs text-[#657069]">
              Add up to 8 photos. The gallery appears when you add some.
            </p>
          </div>
          <input
            id="business-gallery"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            class="peer sr-only"
            :disabled="!!uploading || draft.galleryUrls.length >= 8"
            @change="selectImages($event, 'gallery')"
          />
          <label
            v-if="draft.galleryUrls.length < 8"
            for="business-gallery"
            class="cursor-pointer rounded-xl border border-[#c9d9c7] bg-white px-4 py-2 text-sm font-semibold text-[#234532] hover:bg-[#f2f7ec] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#315e42]"
          >
            {{ uploading === 'gallery' ? 'Uploading…' : 'Add photos' }}
          </label>
        </div>
        <div v-if="draft.galleryUrls.length" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            v-for="(url, index) in draft.galleryUrls"
            :key="url"
            class="relative overflow-hidden rounded-xl"
          >
            <NuxtImg
              :src="url"
              :alt="`Gallery photo ${index + 1}`"
              width="256"
              height="256"
              format="webp"
              class="aspect-square w-full object-cover"
            />
            <button
              type="button"
              :aria-label="`Remove gallery photo ${index + 1}`"
              class="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/95 text-[#143e32] shadow-sm hover:bg-white"
              @click="draft.galleryUrls.splice(index, 1)"
            >
              <UIcon name="i-lucide-x" />
            </button>
          </div>
        </div>
      </div>
      <p class="mt-3 text-xs text-[#657069]">PNG, JPEG, or WebP · 5 MB maximum per image.</p>
      <p v-if="mediaError" role="alert" class="mt-3 text-sm font-medium text-red-700">
        {{ mediaError }}
      </p>
    </details>

    <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
      <div class="mb-7 flex items-start gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f3d8] text-xl text-[#315e42]"
          ><UIcon name="i-lucide-store"
        /></span>
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-[#143e32]">The basics</h2>
          <p class="mt-1 text-sm text-[#657069]">
            Start with the details people need to recognize it.
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
        <UFormField label="Category" name="category" required>
          <USelectMenu
            v-model="selectedCategory"
            :items="[...businessCategories]"
            value-key="value"
            :search-input="{ placeholder: 'Find a category' }"
            placeholder="Choose a category"
            name="category"
            class="w-full"
            size="xl"
            :ui="fieldUi"
          />
          <p v-if="categoryError" role="alert" class="mt-2 text-sm text-red-700">
            {{ categoryError }}
          </p>
        </UFormField>
        <div class="rounded-2xl border border-[#dfe6dc] bg-[#fbfcf8] p-5 sm:p-6">
          <h3 class="text-base font-semibold text-[#143e32]">
            {{ locationRequired ? 'Where is it located?' : 'Where is it based?' }}
          </h3>
          <p class="mt-1 text-sm text-[#657069]">
            {{
              locationRequired
                ? 'Start with an address or area. Choosing a Google Maps suggestion fills in the city and state.'
                : 'Online businesses can add a city and state to appear in local searches.'
            }}
          </p>
          <UFormField
            v-if="locationRequired"
            label="Address or area"
            name="location"
            required
            class="mt-5"
          >
            <LocationInput
              v-model="draft.location"
              v-model:google-place-id="draft.googlePlaceId"
              :required="true"
              @place-selected="onPlaceSelected"
              @place-cleared="onPlaceCleared"
            />
            <p v-if="locationError" role="alert" class="mt-2 text-sm text-red-700">
              {{ locationError }}
            </p>
          </UFormField>
          <div class="mt-5 grid gap-5 sm:grid-cols-2">
            <UFormField label="City" name="city" :required="locationRequired">
              <UInput
                v-model="draft.city"
                name="city"
                placeholder="e.g. Lagos"
                :maxlength="100"
                class="w-full"
                size="xl"
                :ui="fieldUi"
                :required="locationRequired"
              />
            </UFormField>
            <UFormField label="State" name="state" :required="locationRequired">
              <USelectMenu
                v-model="selectedState"
                :items="stateItems"
                value-key="value"
                :search-input="{ placeholder: 'Find a state' }"
                name="state"
                placeholder="Choose a state"
                class="w-full"
                size="xl"
                :ui="fieldUi"
              />
              <UInput
                v-if="customState"
                v-model="draft.state"
                name="customState"
                placeholder="Enter a state or region"
                :maxlength="100"
                class="mt-2 w-full"
                size="xl"
                :ui="fieldUi"
                :required="locationRequired"
              />
            </UFormField>
          </div>
          <p v-if="areaError" role="alert" class="mt-2 text-sm text-red-700">{{ areaError }}</p>
        </div>
      </div>
    </section>

    <details
      class="group rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8"
      :open="!!(draft.weeklyHours.length || draft.openingHours) || undefined"
    >
      <summary
        class="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden"
      >
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f3d8] text-xl text-[#315e42]"
          ><UIcon name="i-lucide-clock-3"
        /></span>
        <span class="text-xl font-semibold tracking-tight text-[#143e32]">Business hours</span>
        <UIcon
          name="i-lucide-chevron-down"
          class="ml-auto text-[#49604e] transition-transform group-open:rotate-180"
        />
      </summary>
      <p class="mb-5 mt-4 text-sm text-[#657069]">
        Turn on the days you are open, then set the start and end times.
      </p>
      <BusinessHoursEditor v-model="draft.weeklyHours" v-model:time-zone="draft.hoursTimeZone" />
      <p v-if="hoursError" role="alert" class="mt-3 text-sm text-red-700">{{ hoursError }}</p>
      <p v-if="draft.openingHours && !draft.weeklyHours.length" class="mt-3 text-xs text-[#657069]">
        Previously listed hours: {{ draft.openingHours }}
      </p>
    </details>

    <details
      class="group rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8"
      :open="!!(draft.serviceArea || servicesText) || undefined"
    >
      <summary
        class="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden"
      >
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f3d8] text-xl text-[#315e42]"
          ><UIcon name="i-lucide-sparkles"
        /></span>
        <span class="text-xl font-semibold tracking-tight text-[#143e32]">More details</span>
        <UIcon
          name="i-lucide-chevron-down"
          class="ml-auto text-[#49604e] transition-transform group-open:rotate-180"
        />
      </summary>
      <div class="mt-6 space-y-5">
        <UFormField
          v-if="locationRequired"
          label="Service area"
          name="serviceArea"
          description="Where can you serve customers?"
        >
          <UInput
            v-model="draft.serviceArea"
            name="serviceArea"
            :maxlength="160"
            placeholder="e.g. Lagos and nearby areas"
            class="w-full"
            size="xl"
            :ui="fieldUi"
          />
        </UFormField>
        <UFormField
          label="Services & specialties"
          name="services"
          description="Add up to 8, one per line."
        >
          <UTextarea
            v-model="servicesText"
            name="services"
            :rows="3"
            placeholder="Brand design&#10;Website design"
            class="w-full"
            :ui="fieldUi"
          />
        </UFormField>
      </div>
    </details>

    <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
      <div class="mb-7 flex items-start gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f3d8] text-xl text-[#315e42]"
          ><UIcon name="i-lucide-link-2"
        /></span>
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-[#143e32]">
            Where can people reach this business?
          </h2>
          <p class="mt-1 text-sm text-[#657069]">Add at least one official link.</p>
        </div>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <UFormField label="Website" name="websiteUrl">
          <UInput
            v-model="draft.websiteUrl"
            name="websiteUrl"
            type="url"
            placeholder="https://yourbusiness.com"
            :maxlength="500"
            class="w-full"
            size="xl"
            :ui="fieldUi"
          />
        </UFormField>
        <template v-if="showAppStores">
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
      </div>
      <details
        class="group mt-6 rounded-xl border border-[#dfe6dc] bg-[#fbfcf8] p-4"
        :open="!!(draft.socialUrl || draft.contactUrl) || undefined"
      >
        <summary
          class="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#143e32] [&::-webkit-details-marker]:hidden"
        >
          <UIcon name="i-lucide-message-circle" /> Social profile or contact link
          <UIcon
            name="i-lucide-chevron-down"
            class="ml-auto transition-transform group-open:rotate-180"
          />
        </summary>
        <div class="mt-5 grid gap-5 sm:grid-cols-2">
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
          <UFormField
            label="Contact link"
            name="contactUrl"
            help="A website, WhatsApp link or phone link: tel:+2348012345678."
          >
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
        </div>
      </details>
      <p v-if="linkError" role="alert" class="mt-4 text-sm font-medium text-red-700">
        {{ linkError }}
      </p>
    </section>

    <div class="rounded-2xl bg-[#edf3e7] p-5 text-sm leading-6 text-[#49604e]">
      <div class="flex items-start gap-3">
        <UIcon name="i-lucide-info" class="mt-0.5 shrink-0 text-lg" />
        <p>
          Your business will appear in public search right away. Ownership verification is a
          separate check, and verified businesses get an ownership check mark.
        </p>
      </div>
    </div>
    <UiFeedbackAlert v-if="error" tone="error" :message="error" />
    <div class="flex flex-wrap items-center gap-4">
      <UButton
        type="submit"
        size="xl"
        :loading="submitting"
        :disabled="!!uploading"
        class="!rounded-xl !bg-[#143e32] !px-6 !py-3 !font-semibold !text-white hover:!bg-[#24563f]"
        >{{ submitLabel }} <UIcon name="i-lucide-arrow-right"
      /></UButton>
    </div>
  </form>
</template>
