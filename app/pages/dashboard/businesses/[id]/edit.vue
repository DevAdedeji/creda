<script setup lang="ts">
import BusinessProfileEditor from '@/components/businesses/BusinessProfileEditor.vue'
import BusinessForm from '@/components/businesses/BusinessForm.vue'
import { apiErrorMessage } from '@/utils/apiError'
import { authClient } from '~~/lib/auth-client'
import type { BusinessDraft, ManagedBusiness } from '~~/shared/businesses'
import { isAvailableBusinessSlugFormat } from '~~/shared/business-slugs'

useSeoMeta({ title: 'Edit your business — Creda', robots: 'noindex, nofollow' })
const route = useRoute()
const id = String(route.params.id)
const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')

const {
  data: business,
  status,
  error,
} = await useFetch<ManagedBusiness>('/api/my/businesses/' + encodeURIComponent(id))
const initial = computed<BusinessDraft | undefined>(() => {
  if (!business.value) return undefined
  const item = business.value
  return {
    name: item.name,
    description: item.description,
    category: item.category,
    operationMode: item.operationMode,
    location: item.location ?? '',
    city: item.city ?? '',
    state: item.state ?? '',
    serviceArea: item.serviceArea ?? '',
    openingHours: item.openingHours ?? '',
    weeklyHours: item.weeklyHours.map((day) => ({ ...day })),
    hoursTimeZone: item.hoursTimeZone ?? '',
    services: [...item.services],
    googlePlaceId: item.googlePlaceId ?? '',
    websiteUrl: item.websiteUrl ?? '',
    appStoreUrl: item.appStoreUrl ?? '',
    playStoreUrl: item.playStoreUrl ?? '',
    socialUrl: item.socialUrl ?? '',
    contactUrl: item.contactUrl ?? '',
    logoUrl: item.logoUrl ?? '',
    coverUrl: item.coverUrl ?? '',
    galleryUrls: [...item.galleryUrls],
    mediaProofs: [],
  }
})
const activeTab = ref<'basics' | 'details'>('basics')
function moveTab(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  activeTab.value =
    event.key === 'Home'
      ? 'basics'
      : event.key === 'End'
        ? 'details'
        : activeTab.value === 'basics'
          ? 'details'
          : 'basics'
  const group = event.currentTarget as HTMLElement
  group.querySelector<HTMLButtonElement>(`#${activeTab.value}-tab`)?.focus()
}
const submitting = ref(false)
const errorMessage = ref('')
const currentSlug = ref('')
const slugDraft = ref('')
const savingSlug = ref(false)
const slugError = ref('')
const appToast = useAppToast()
const proposedSlug = computed(() => slugDraft.value.trim().toLowerCase())
watch(
  () => business.value?.slug,
  (slug) => {
    if (!slug) return
    currentSlug.value = slug
    slugDraft.value = slug
  },
  { immediate: true },
)

async function saveSlug() {
  if (savingSlug.value || !isAvailableBusinessSlugFormat(proposedSlug.value)) return
  savingSlug.value = true
  slugError.value = ''
  try {
    const updated = await $fetch<ManagedBusiness>(
      '/api/my/businesses/' + encodeURIComponent(id) + '/slug',
      { method: 'PATCH', body: { slug: proposedSlug.value } },
    )
    currentSlug.value = updated.slug
    slugDraft.value = updated.slug
    appToast.success('Business link updated', 'Your old links will continue to work.')
  } catch (error) {
    slugError.value = apiErrorMessage(error, 'We could not update this link. Please try again.')
  } finally {
    savingSlug.value = false
  }
}

async function submit(draft: BusinessDraft) {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/my/businesses/' + encodeURIComponent(id), { method: 'PATCH', body: draft })
    await navigateTo('/dashboard/businesses?submitted=1')
  } catch (error) {
    errorMessage.value = apiErrorMessage(
      error,
      'We could not update the listing. Please try again.',
    )
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <WorkspaceShell>
    <main class="mx-auto w-full px-5 sm:px-8 xl:px-12 max-w-4xl py-12 sm:py-16">
      <NuxtLink
        to="/dashboard/businesses"
        class="inline-flex items-center gap-2 text-sm font-semibold text-[#47644d] hover:underline"
        ><UIcon name="i-lucide-arrow-left" /> Your listings</NuxtLink
      >
      <div v-if="status === 'pending'" class="mt-10 h-96 animate-pulse rounded-2xl bg-[#e8eee4]" />
      <div
        v-else-if="error || !business"
        class="mt-10 rounded-2xl border border-red-200 bg-white p-8 text-sm text-red-800"
      >
        This listing could not be found in your account.
      </div>
      <template v-else>
        <div class="my-9 max-w-2xl">
          <p class="text-xs font-bold tracking-[.17em] text-[#456b4d]">UPDATE YOUR SUBMISSION</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-[-.06em] text-green-900 sm:text-5xl">
            Edit {{ business.name }}.
          </h1>
          <p class="mt-4 text-[#657069]">Update the details people see on your public profile.</p>
        </div>
        <div
          v-if="business.status === 'suspended'"
          class="rounded-2xl border border-amber-200 bg-amber-50 p-7 text-sm leading-6 text-amber-900"
        >
          This listing is unavailable following a content review. Changes are paused until an
          administrator restores it.
        </div>
        <template v-else>
          <div
            class="mb-6 flex gap-2 rounded-xl bg-[#edf3e7] p-1.5"
            role="tablist"
            aria-label="Business editor"
            @keydown="moveTab"
          >
            <button
              id="basics-tab"
              :tabindex="activeTab === 'basics' ? 0 : -1"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'basics'"
              aria-controls="basics-panel"
              class="min-h-12 flex-1 rounded-lg px-3 text-sm font-semibold text-[#143e32]"
              :class="activeTab === 'basics' ? 'bg-white shadow-sm' : 'hover:bg-white/50'"
              @click="activeTab = 'basics'"
            >
              Business profile
            </button>
            <button
              id="details-tab"
              :tabindex="activeTab === 'details' ? 0 : -1"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'details'"
              aria-controls="details-panel"
              class="min-h-12 flex-1 rounded-lg px-3 text-sm font-semibold text-[#143e32]"
              :class="activeTab === 'details' ? 'bg-white shadow-sm' : 'hover:bg-white/50'"
              @click="activeTab = 'details'"
            >
              Services & FAQs
            </button>
          </div>
          <div
            v-show="activeTab === 'details'"
            id="details-panel"
            role="tabpanel"
            aria-labelledby="details-tab"
          >
            <BusinessProfileEditor :key="business.id" :business="business" />
          </div>
          <div
            v-show="activeTab === 'basics'"
            id="basics-panel"
            role="tabpanel"
            aria-labelledby="basics-tab"
          >
            <section
              class="mb-8 rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8"
              aria-labelledby="business-link-heading"
            >
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-bold uppercase tracking-[.15em] text-[#58745f]">
                    YOUR BUSINESS PAGE
                  </p>
                  <h2
                    id="business-link-heading"
                    class="mt-2 text-2xl font-semibold tracking-tight text-[#143e32]"
                  >
                    Make your link yours.
                  </h2>
                  <p class="mt-2 text-sm leading-6 text-[#657069]">
                    Share a simple page for your business. Your directory listing uses the same
                    address.
                  </p>
                </div>
                <NuxtLink
                  :to="'/' + currentSlug"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#315b3a] hover:underline"
                  >View page <UIcon name="i-lucide-arrow-up-right"
                /></NuxtLink>
              </div>
              <form
                class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
                @submit.prevent="saveSlug"
              >
                <div class="min-w-0 flex-1">
                  <label for="business-slug" class="mb-2 block text-sm font-semibold text-[#254b36]"
                    >Page address</label
                  >
                  <div
                    class="flex h-12 overflow-hidden rounded-xl border border-[#d9e2d8] focus-within:border-[#4f805c]"
                  >
                    <span class="flex items-center bg-[#f5f8f2] px-3 text-sm text-[#536b57]"
                      >creda.ng/</span
                    >
                    <input
                      id="business-slug"
                      v-model="slugDraft"
                      type="text"
                      maxlength="48"
                      autocomplete="off"
                      autocapitalize="none"
                      spellcheck="false"
                      class="min-w-0 flex-1 bg-white px-3 text-sm text-[#143e32] outline-none"
                      aria-describedby="business-slug-help"
                    />
                  </div>
                </div>
                <UButton
                  type="submit"
                  :loading="savingSlug"
                  :disabled="
                    !isAvailableBusinessSlugFormat(proposedSlug) || proposedSlug === currentSlug
                  "
                  class="!h-12 !rounded-xl !bg-[#143e32] !px-5 !text-white"
                  >Save link</UButton
                >
              </form>
              <p id="business-slug-help" class="mt-3 text-xs leading-5 text-[#708075]">
                Use 3–48 letters, numbers, or hyphens. Your directory link will be
                creda.ng/businesses/{{ proposedSlug || currentSlug }}.
              </p>
              <UiFeedbackAlert v-if="slugError" tone="error" :message="slugError" class="mt-3" />
            </section>
            <BusinessForm
              :initial="initial"
              :submitting="submitting"
              :error="errorMessage"
              submit-label="Save changes"
              @submit="submit"
            />
          </div>
        </template>
      </template>
    </main>
  </WorkspaceShell>
</template>
