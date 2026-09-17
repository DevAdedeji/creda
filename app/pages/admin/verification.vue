<script setup lang="ts">
import { apiErrorMessage } from '@/utils/apiError'
import { authClient } from '~~/lib/auth-client'
import type { AdminVerificationItem } from '~~/shared/ownership'

useSeoMeta({ title: 'Ownership checks — Creda', robots: 'noindex, nofollow' })
const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')

const { data, status, error, refresh } = await useFetch<{ items: AdminVerificationItem[] }>(
  '/api/admin/verification',
)
const pending = computed(() => data.value?.items.filter((item) => item.status === 'pending') ?? [])
const approved = computed(
  () => data.value?.items.filter((item) => item.status === 'approved') ?? [],
)
const notes = reactive<Record<string, string>>({})
const busyId = ref<string | null>(null)
const actionError = ref('')

async function decide(item: AdminVerificationItem, decision: 'approve' | 'decline' | 'revoke') {
  if (busyId.value) return
  if (decision === 'revoke' && !window.confirm('Remove the ownership badge from this business?')) {
    return
  }
  const reason = notes[item.id]?.trim() || ''
  if (decision !== 'approve' && reason.length < 10) {
    actionError.value = 'Add a reason of at least 10 characters before declining or revoking.'
    return
  }
  busyId.value = item.id
  actionError.value = ''
  try {
    await $fetch('/api/admin/verification/' + encodeURIComponent(item.id) + '/decision', {
      method: 'POST',
      body: { decision, reason },
    })
    delete notes[item.id]
    await refresh()
  } catch (error) {
    actionError.value = apiErrorMessage(error, 'We could not save this decision. Try again.')
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f7f9f3] text-[#172f27]">
    <LandingHeader />
    <main class="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <div class="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p class="text-xs font-bold tracking-[.17em] text-[#456b4d]">PRIVATE ADMINISTRATION</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl">
            Ownership checks.
          </h1>
          <p class="mt-3 text-[#657069]">
            Review official-channel details before awarding a badge.
          </p>
        </div>
        <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" @click="refresh()">
          Refresh
        </UButton>
      </div>

      <div v-if="status === 'pending'" class="mt-10 h-72 animate-pulse rounded-2xl bg-[#e8eee4]" />
      <div
        v-else-if="error"
        class="mt-10 rounded-2xl border border-red-200 bg-white p-7 text-sm text-red-800"
      >
        Verification requests could not be loaded. Check your administrator access and try again.
      </div>
      <template v-else>
        <p
          v-if="actionError"
          role="alert"
          class="mt-7 rounded-xl bg-red-50 p-4 text-sm text-red-800"
        >
          {{ actionError }}
        </p>

        <section class="mt-10">
          <h2 class="text-2xl font-semibold text-[#143e32]">Awaiting a check</h2>
          <div
            v-if="!pending.length"
            class="mt-5 rounded-2xl border border-[#dfe6dc] bg-white p-8 text-sm text-[#657069]"
          >
            No ownership requests are waiting for review.
          </div>
          <div v-else class="mt-5 grid gap-4">
            <article
              v-for="item in pending"
              :key="item.id"
              class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8"
            >
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 class="text-xl font-semibold text-[#143e32]">{{ item.businessName }}</h3>
                  <p class="mt-1 text-sm text-[#657069]">
                    {{ item.ownerName }} · {{ item.ownerEmail }}
                  </p>
                  <p class="mt-1 text-xs text-[#657069]">
                    Submitted {{ new Date(item.createdAt).toLocaleString() }}
                  </p>
                </div>
                <UButton
                  :to="'/businesses/' + item.businessSlug"
                  target="_blank"
                  color="neutral"
                  variant="outline"
                  trailing-icon="i-lucide-arrow-up-right"
                >
                  Public profile
                </UButton>
              </div>
              <div class="mt-6 rounded-xl bg-[#f7f9f3] p-5">
                <p class="text-xs font-bold uppercase tracking-wider text-[#456b4d]">
                  {{ item.method.replaceAll('_', ' ') }}
                </p>
                <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#33453d]">
                  {{ item.evidenceNote }}
                </p>
              </div>
              <div class="mt-6">
                <UFormField label="Decision note" :name="'note-' + item.id">
                  <UTextarea
                    v-model="notes[item.id]"
                    class="w-full"
                    :rows="2"
                    :maxlength="500"
                    placeholder="Optional when approving; required when declining."
                  />
                </UFormField>
              </div>
              <div class="mt-5 flex flex-wrap gap-3">
                <UButton
                  :loading="busyId === item.id"
                  :disabled="Boolean(busyId)"
                  class="!rounded-xl !bg-[#143e32] !text-white"
                  @click="decide(item, 'approve')"
                >
                  Approve ownership
                </UButton>
                <UButton
                  color="error"
                  variant="outline"
                  :disabled="Boolean(busyId)"
                  @click="decide(item, 'decline')"
                >
                  Decline
                </UButton>
              </div>
            </article>
          </div>
        </section>

        <section class="mt-14">
          <h2 class="text-2xl font-semibold text-[#143e32]">Verified businesses</h2>
          <p class="mt-2 text-sm text-[#657069]">
            Revoke a badge if the ownership claim is no longer valid.
          </p>
          <div
            v-if="!approved.length"
            class="mt-5 rounded-2xl border border-[#dfe6dc] bg-white p-8 text-sm text-[#657069]"
          >
            No verified businesses yet.
          </div>
          <div v-else class="mt-5 grid gap-4">
            <article
              v-for="item in approved"
              :key="item.id"
              class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8"
            >
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 class="text-lg font-semibold text-[#143e32]">{{ item.businessName }}</h3>
                  <p class="mt-1 text-sm text-[#657069]">
                    {{ item.ownerName }} · {{ item.ownerEmail }}
                  </p>
                </div>
                <UButton
                  :to="'/businesses/' + item.businessSlug"
                  color="neutral"
                  variant="outline"
                  trailing-icon="i-lucide-arrow-up-right"
                >
                  Public profile
                </UButton>
              </div>
              <div class="mt-5">
                <UFormField label="Reason for revocation" :name="'revoke-' + item.id">
                  <UTextarea
                    v-model="notes[item.id]"
                    class="w-full"
                    :rows="2"
                    :maxlength="500"
                    placeholder="Explain why the badge should be removed."
                  />
                </UFormField>
              </div>
              <UButton
                color="error"
                variant="outline"
                class="mt-4"
                :loading="busyId === item.id"
                :disabled="Boolean(busyId)"
                @click="decide(item, 'revoke')"
              >
                Revoke verification
              </UButton>
            </article>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>
