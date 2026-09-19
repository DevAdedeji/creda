<script setup lang="ts">
import { apiErrorMessage } from '@/utils/apiError'
import { authClient } from '~~/lib/auth-client'
import {
  ownershipMethods,
  type OwnerVerificationView,
  type OwnershipMethod,
} from '~~/shared/ownership'

useSeoMeta({ title: 'Claim a business — Creda', robots: 'noindex, nofollow' })
const route = useRoute()
const slug = String(route.params.slug)
const claimPath = `/businesses/${encodeURIComponent(slug)}/claim`
const { data: session } = await authClient.useSession(useFetch)
if (!session.value) {
  await navigateTo(`/login?returnTo=${encodeURIComponent(claimPath)}`)
}

const { data, status, error, refresh } = await useFetch<OwnerVerificationView>(
  `/api/businesses/${encodeURIComponent(slug)}/claim`,
  { immediate: Boolean(session.value?.user.emailVerified) },
)
const method = ref<OwnershipMethod>('official_email')
const evidenceNote = ref('')
const submitting = ref(false)
const submitError = ref('')
const toast = useToast()
const loadError = computed(() =>
  error.value ? apiErrorMessage(error.value, 'We could not load this ownership claim.') : '',
)

async function submitClaim() {
  if (submitting.value) return
  submitting.value = true
  submitError.value = ''
  try {
    await $fetch(`/api/businesses/${encodeURIComponent(slug)}/claim`, {
      method: 'POST',
      body: { method: method.value, evidenceNote: evidenceNote.value },
    })
    evidenceNote.value = ''
    await refresh()
    toast.add({
      title: 'Claim submitted',
      description: 'We’ll review the official channel you provided.',
      color: 'success',
    })
  } catch (error) {
    submitError.value = apiErrorMessage(error, 'We could not submit this claim. Try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#fcfcf8] text-[#172f27]">
    <LandingHeader />
    <main class="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <NuxtLink
        :to="`/businesses/${encodeURIComponent(slug)}`"
        class="inline-flex items-center gap-2 text-sm font-semibold text-[#47644d] hover:underline"
      >
        <UIcon name="i-lucide-arrow-left" /> Back to business
      </NuxtLink>

      <div
        v-if="!session?.user.emailVerified"
        class="mt-9 rounded-2xl border border-[#e5d9ba] bg-[#fff9e8] p-7"
      >
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-mail-check" class="mt-0.5 size-5 shrink-0 text-[#765c22]" />
          <div>
            <h1 class="text-xl font-semibold text-[#573f15]">Verify your email first</h1>
            <p class="mt-2 text-sm leading-6 text-[#765c22]">
              Open the verification link sent to your inbox, then return here to claim this
              business.
            </p>
          </div>
        </div>
      </div>
      <div
        v-else-if="status === 'pending'"
        class="mt-9 h-80 animate-pulse rounded-2xl bg-[#e8eee4]"
      />
      <div v-else-if="error || !data" class="mt-9 rounded-2xl border border-red-200 bg-white p-7">
        <h1 class="text-xl font-semibold text-[#143e32]">This business cannot be claimed</h1>
        <p class="mt-2 text-sm leading-6 text-red-700">{{ loadError }}</p>
      </div>
      <template v-else>
        <header class="mt-9">
          <p class="text-xs font-bold tracking-[.17em] text-[#456b4d]">BUSINESS OWNERSHIP</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl">
            Claim {{ data.businessName }}<span class="text-[#a4c552]">.</span>
          </h1>
          <p class="mt-4 max-w-2xl leading-7 text-[#657069]">
            Show us an official channel connected to the business. Creda will review it before
            transferring profile management to your account.
          </p>
        </header>

        <section class="mt-9 rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
          <div v-if="data.ownershipStatus === 'verified'" class="flex items-start gap-4">
            <span
              class="grid size-12 shrink-0 place-items-center rounded-xl bg-[#e8f4da] text-[#315b3a]"
            >
              <UIcon name="i-lucide-badge-check" class="size-6" />
            </span>
            <div>
              <h2 class="text-xl font-semibold text-[#143e32]">This business is now yours</h2>
              <p class="mt-2 text-sm leading-6 text-[#657069]">
                The profile is in your Creda workspace and its ownership badge is live.
              </p>
              <UButton
                :to="`/dashboard/businesses/${data.businessId}/edit`"
                class="mt-5 !rounded-xl !bg-[#143e32] !text-white"
              >
                Manage business
              </UButton>
            </div>
          </div>
          <div v-else-if="data.request?.status === 'pending'" class="flex items-start gap-4">
            <span
              class="grid size-12 shrink-0 place-items-center rounded-xl bg-[#eef4e8] text-[#456b4d]"
            >
              <UIcon name="i-lucide-clock-3" class="size-6" />
            </span>
            <div>
              <h2 class="text-xl font-semibold text-[#143e32]">Claim under review</h2>
              <p class="mt-2 text-sm leading-6 text-[#657069]">
                We’ll check the details you submitted. The listing will remain public and unchanged
                while we review your claim.
              </p>
            </div>
          </div>
          <template v-else>
            <div
              v-if="data.request?.status === 'declined' || data.request?.status === 'revoked'"
              class="mb-7 rounded-xl border border-[#efd7c5] bg-[#fff6ef] p-5"
            >
              <h2 class="font-semibold text-[#73452b]">We could not confirm the previous claim</h2>
              <p v-if="data.request.reviewNote" class="mt-2 text-sm leading-6 text-[#73452b]">
                {{ data.request.reviewNote }}
              </p>
              <p class="mt-2 text-sm text-[#73452b]">You can submit clearer evidence below.</p>
            </div>
            <h2 class="text-xl font-semibold text-[#143e32]">Prove your connection</h2>
            <p class="mt-2 text-sm leading-6 text-[#657069]">
              Use a business email, website, or official social account that Creda can independently
              check. Never send a password or identity document.
            </p>
            <form method="post" class="mt-7 space-y-5" @submit.prevent="submitClaim">
              <UFormField label="Official channel" name="method" required>
                <USelect
                  v-model="method"
                  :items="[...ownershipMethods]"
                  class="w-full"
                  size="lg"
                  :ui="{
                    base: '!rounded-xl !border !border-[#cad9c8] !bg-white !shadow-none !ring-0 focus:!border-[#376c47] focus:!ring-0',
                  }"
                />
              </UFormField>
              <UFormField label="How can we verify your connection?" name="evidenceNote" required>
                <UTextarea
                  v-model="evidenceNote"
                  class="w-full"
                  :rows="5"
                  :maxlength="2000"
                  placeholder="For example: email me at name@business.com, or message the contact listed on our official website."
                  required
                  :ui="{
                    base: '!rounded-xl !border !border-[#cad9c8] !bg-white !shadow-none !ring-0 focus:!border-[#376c47] focus:!ring-0',
                  }"
                />
              </UFormField>
              <p class="text-xs leading-5 text-[#657069]">
                Your evidence is private and visible only to you and Creda administrators.
              </p>
              <p v-if="submitError" role="alert" class="text-sm text-red-700">{{ submitError }}</p>
              <UButton
                type="submit"
                size="lg"
                :loading="submitting"
                :disabled="submitting || evidenceNote.trim().length < 20"
                class="!rounded-xl !bg-[#143e32] !px-6 !text-white"
              >
                Submit claim
              </UButton>
            </form>
          </template>
        </section>
      </template>
    </main>
  </div>
</template>
