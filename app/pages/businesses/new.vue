<script setup lang="ts">
import BusinessForm from '@/components/businesses/BusinessForm.vue'
import { apiErrorMessage } from '@/utils/apiError'
import { trackAnalyticsEvent } from '@/utils/analytics'
import { authClient } from '~~/lib/auth-client'
import type { BusinessCreationResponse, BusinessDraft } from '~~/shared/businesses'

useSeoMeta({ title: 'List your business — Creda', robots: 'noindex, nofollow' })

const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')

onMounted(() => {
  if (session.value?.user.emailVerified) trackAnalyticsEvent('business_form_viewed')
})

const submitting = ref(false)
const errorMessage = ref('')

async function submit(draft: BusinessDraft) {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    const created = await $fetch<BusinessCreationResponse>('/api/businesses', {
      method: 'POST',
      body: draft,
    })
    const properties = { category: created.category, operation_mode: created.operationMode }
    trackAnalyticsEvent('business_created', properties)
    if (created.isFirstBusiness) trackAnalyticsEvent('first_business_created', properties)
    await navigateTo('/dashboard/businesses?submitted=1')
  } catch (error) {
    errorMessage.value = apiErrorMessage(
      error,
      'We could not submit the listing. Please try again.',
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
      <div class="my-9 max-w-2xl">
        <span
          class="inline-flex items-center gap-2 rounded-full bg-[#e6f2da] px-3 py-1.5 text-xs font-bold tracking-wide text-[#315b3a]"
          ><UIcon name="i-lucide-sparkles" /> MAKE YOUR BUSINESS FINDABLE</span
        >
        <h1 class="mt-5 text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl">
          Tell us about your business.
        </h1>
        <p class="mt-4 text-base leading-7 text-[#657069]">
          Create a profile people can discover and share. Your profile will appear in the directory
          as soon as you submit it.
        </p>
      </div>
      <div
        v-if="!session?.user.emailVerified"
        class="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900"
      >
        Verify your email before submitting a business. Check your inbox for the verification link.
      </div>
      <BusinessForm v-else :submitting="submitting" :error="errorMessage" @submit="submit" />
    </main>
  </WorkspaceShell>
</template>
