<script setup lang="ts">
import BusinessForm from '../../../../components/businesses/BusinessForm.vue'
import { apiErrorMessage } from '../../../../utils/apiError'
import { authClient } from '~~/lib/auth-client'
import type { BusinessDraft, ManagedBusiness } from '~~/shared/businesses'

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
    businessTypes: [...item.businessTypes],
    operationMode: item.operationMode,
    location: item.location ?? '',
    websiteUrl: item.websiteUrl ?? '',
    appStoreUrl: item.appStoreUrl ?? '',
    playStoreUrl: item.playStoreUrl ?? '',
    socialUrl: item.socialUrl ?? '',
    contactUrl: item.contactUrl ?? '',
    logoUrl: item.logoUrl ?? '',
  }
})
const submitting = ref(false)
const errorMessage = ref('')

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
  <div class="min-h-screen bg-[#f7f9f3] text-[#172f27]">
    <LandingHeader />
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
        <BusinessForm
          :initial="initial"
          :submitting="submitting"
          :error="errorMessage"
          submit-label="Save changes"
          @submit="submit"
        />
      </template>
    </main>
  </div>
</template>
