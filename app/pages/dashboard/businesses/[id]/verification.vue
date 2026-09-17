<script setup lang="ts">
import { apiErrorMessage } from '@/utils/apiError'
import { authClient } from '~~/lib/auth-client'
import {
  ownershipMethods,
  type OwnerVerificationView,
  type OwnershipMethod,
} from '~~/shared/ownership'

useSeoMeta({ title: 'Verify business ownership — Creda', robots: 'noindex, nofollow' })
const route = useRoute()
const id = String(route.params.id)
const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')

const { data, status, error, refresh } = await useFetch<OwnerVerificationView>(
  '/api/my/businesses/' + encodeURIComponent(id) + '/verification',
)
const method = ref<OwnershipMethod>('official_email')
const evidenceNote = ref('')
const submitting = ref(false)
const submitError = ref('')

async function submit() {
  if (submitting.value || !data.value) return
  submitting.value = true
  submitError.value = ''
  try {
    await $fetch('/api/my/businesses/' + encodeURIComponent(id) + '/verification', {
      method: 'POST',
      body: { method: method.value, evidenceNote: evidenceNote.value },
    })
    evidenceNote.value = ''
    await refresh()
  } catch (error) {
    submitError.value = apiErrorMessage(error, 'We could not submit your request. Try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f7f9f3] text-[#172f27]">
    <LandingHeader />
    <main class="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <NuxtLink
        to="/dashboard/businesses"
        class="inline-flex items-center gap-2 text-sm font-semibold text-[#47644d] hover:underline"
      >
        <UIcon name="i-lucide-arrow-left" /> Your businesses
      </NuxtLink>

      <div v-if="status === 'pending'" class="mt-10 h-72 animate-pulse rounded-2xl bg-[#e8eee4]" />
      <div v-else-if="error || !data" class="mt-10 rounded-2xl border border-red-200 bg-white p-7">
        <p class="text-sm text-red-800">We could not load this business’s verification details.</p>
        <UButton color="neutral" variant="outline" class="mt-5" @click="refresh()">
          Try again
        </UButton>
      </div>
      <template v-else>
        <div class="mt-9">
          <p class="text-xs font-bold tracking-[.17em] text-[#456b4d]">BUSINESS OWNERSHIP</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl">
            Verify {{ data.businessName }}.
          </h1>
          <p class="mt-4 max-w-2xl leading-7 text-[#657069]">
            Help people know this profile is managed by someone connected to the business. We check
            an official channel before adding the ownership badge.
          </p>
        </div>

        <section class="mt-9 rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
          <template v-if="data.ownershipStatus === 'verified'">
            <div class="flex items-start gap-4">
              <span
                class="grid size-12 shrink-0 place-items-center rounded-xl bg-[#e8f4da] text-[#315b3a]"
              >
                <UIcon name="i-lucide-badge-check" class="size-6" />
              </span>
              <div>
                <h2 class="text-xl font-semibold text-[#143e32]">Ownership verified</h2>
                <p class="mt-2 text-sm leading-6 text-[#657069]">
                  Your public business profile now shows an ownership verification badge.
                </p>
              </div>
            </div>
          </template>
          <template v-else-if="data.request?.status === 'pending'">
            <div class="flex items-start gap-4">
              <span
                class="grid size-12 shrink-0 place-items-center rounded-xl bg-[#e8f4da] text-[#315b3a]"
              >
                <UIcon name="i-lucide-clock-3" class="size-6" />
              </span>
              <div>
                <h2 class="text-xl font-semibold text-[#143e32]">Request received</h2>
                <p class="mt-2 text-sm leading-6 text-[#657069]">
                  We’ll check the details you provided. Your public profile will only show a badge
                  after ownership is confirmed.
                </p>
              </div>
            </div>
          </template>
          <template v-else>
            <div
              v-if="data.request?.status === 'declined' || data.request?.status === 'revoked'"
              class="mb-7 rounded-xl bg-[#fff4ed] p-5"
            >
              <h2 class="font-semibold text-[#73452b]">
                {{
                  data.request.status === 'revoked'
                    ? 'Verification needs to be renewed'
                    : 'We could not confirm ownership'
                }}
              </h2>
              <p v-if="data.request.reviewNote" class="mt-2 text-sm leading-6 text-[#73452b]">
                {{ data.request.reviewNote }}
              </p>
              <p class="mt-2 text-sm text-[#73452b]">You can send new details for another check.</p>
            </div>
            <h2 class="text-xl font-semibold text-[#143e32]">Request a manual check</h2>
            <p class="mt-2 text-sm leading-6 text-[#657069]">
              Choose a channel you control and explain how we can reach or check it. Please don’t
              send passwords, identity documents, or other sensitive information.
            </p>
            <form method="post" class="mt-7 space-y-5" @submit.prevent="submit">
              <UFormField label="Official channel" name="method" required>
                <USelect v-model="method" :items="[...ownershipMethods]" class="w-full" size="lg" />
              </UFormField>
              <UFormField label="How we can verify your connection" name="evidenceNote" required>
                <UTextarea
                  v-model="evidenceNote"
                  class="w-full"
                  :rows="5"
                  :maxlength="2000"
                  placeholder="For example: email hello@mybusiness.com and ask me to reply, or check the contact link on our website."
                  required
                />
              </UFormField>
              <p class="text-xs text-[#657069]">
                These details are visible only to you and Creda administrators.
              </p>
              <p v-if="submitError" role="alert" class="text-sm text-red-700">{{ submitError }}</p>
              <UButton
                type="submit"
                size="lg"
                :loading="submitting"
                :disabled="evidenceNote.trim().length < 20"
                class="!rounded-xl !bg-[#143e32] !px-6 !text-white"
              >
                Request verification
              </UButton>
            </form>
          </template>
        </section>
      </template>
    </main>
  </div>
</template>
