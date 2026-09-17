<script setup lang="ts">
import {
  businessCategories,
  businessLinkError,
  businessTypes,
  operationModes,
  type BusinessDraft,
} from '~~/shared/businesses'
import LocationInput from '@/components/businesses/LocationInput.vue'
import { apiErrorMessage } from '@/utils/apiError'

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
const linkError = ref('')
const locationError = ref('')
const mediaError = ref('')
const uploading = ref<'logo' | 'cover' | 'gallery' | null>(null)
const uploadedProofs = new Map<string, string>()
const locationRequired = computed(() => draft.operationMode !== 'online')
const needsWebsite = computed(() =>
  draft.businessTypes.some((type) => ['web_app', 'desktop_app', 'online_store'].includes(type)),
)
const showWebsite = computed(() => needsWebsite.value || Boolean(props.initial?.websiteUrl))
const needsMobileStores = computed(
  () =>
    draft.businessTypes.includes('mobile_app') ||
    Boolean(props.initial?.appStoreUrl || props.initial?.playStoreUrl),
)
const showSocialContact = computed(
  () =>
    Boolean(props.initial?.socialUrl || props.initial?.contactUrl) ||
    draft.businessTypes.some((type) =>
      ['online_store', 'service_business', 'physical_business'].includes(type),
    ),
)
watch(
  () => props.initial,
  (value) => {
    if (value) {
      uploadedProofs.clear()
      Object.assign(draft, {
        ...value,
        businessTypes: [...value.businessTypes],
        galleryUrls: [...value.galleryUrls],
        mediaProofs: [...value.mediaProofs],
      })
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
    galleryUrls: [...draft.galleryUrls],
    mediaProofs: [draft.logoUrl, draft.coverUrl, ...draft.galleryUrls]
      .map((url) => uploadedProofs.get(url))
      .filter((proof): proof is string => Boolean(proof)),
    websiteUrl: showWebsite.value ? draft.websiteUrl : '',
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
            <LocationInput
              v-model="draft.location"
              v-model:google-place-id="draft.googlePlaceId"
              :required="locationRequired"
            />
            <p v-if="locationError" role="alert" class="mt-2 text-sm text-red-700">
              {{ locationError }}
            </p>
          </UFormField>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
      <div class="mb-7 flex items-start gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e7f3d8] text-xl text-[#315e42]"
        >
          <UIcon name="i-lucide-images" />
        </span>
        <div>
          <h2 class="text-xl font-semibold tracking-tight text-[#143e32]">Make it yours</h2>
          <p class="mt-1 text-sm text-[#657069]">
            Add a logo, a cover image, and photos that show what you do.
          </p>
        </div>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="rounded-2xl border border-[#dfe6dc] bg-[#fbfcf8] p-5">
          <p class="text-sm font-semibold text-[#143e32]">Logo</p>
          <p class="mt-1 text-xs text-[#657069]">A square image works best.</p>
          <div class="mt-4 flex h-28 items-center rounded-xl bg-[#e7f3d8] p-4">
            <img
              v-if="draft.logoUrl"
              :src="draft.logoUrl"
              alt="Logo preview"
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
          <img
            v-if="draft.coverUrl"
            :src="draft.coverUrl"
            alt="Cover preview"
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
              Optional · up to 8 photos. The gallery appears only when you add some.
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
            <img
              :src="url"
              :alt="`Gallery photo ${index + 1}`"
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
          v-if="showWebsite"
          :label="
            draft.businessTypes.includes('desktop_app') ? 'Website or download page' : 'Website'
          "
          name="websiteUrl"
          :required="needsWebsite"
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
            :required="needsWebsite"
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
        :disabled="!!uploading"
        class="!rounded-xl !bg-[#143e32] !px-6 !py-3 !font-semibold !text-white hover:!bg-[#24563f]"
        >{{ submitLabel }} <UIcon name="i-lucide-arrow-right"
      /></UButton>
    </div>
  </form>
</template>
