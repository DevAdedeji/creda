<script setup lang="ts">
import { apiErrorMessage } from '@/utils/apiError'
import {
  reportReasons,
  type AdminReport,
  type AdminReportList,
  type ReportStatus,
} from '~~/shared/reports'

useSeoMeta({ title: 'Content reports — Creda', robots: 'noindex, nofollow' })
const statusFilter = ref<ReportStatus>('open')
const page = ref(1)
const { data, status, error, refresh } = await useFetch<AdminReportList>('/api/admin/reports', {
  query: { page, status: statusFilter },
})
const selected = ref<{ id: string; action: 'dismiss' | 'remove' | 'restore' } | null>(null)
const note = ref('')
const actionError = ref('')
const busy = ref(false)
const appToast = useAppToast()
const tabs: { value: ReportStatus; label: string }[] = [
  { value: 'open', label: 'Needs review' },
  { value: 'actioned', label: 'Removed' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'restored', label: 'Restored' },
]
watch(statusFilter, () => {
  page.value = 1
  selected.value = null
  actionError.value = ''
})

function reasonLabel(reason: string) {
  return reportReasons.find((item) => item.value === reason)?.label ?? reason
}

function choose(id: string, action: 'dismiss' | 'remove' | 'restore') {
  selected.value = { id, action }
  note.value = ''
  actionError.value = ''
}

async function decide(item: AdminReport) {
  if (!selected.value || selected.value.id !== item.id || busy.value) return
  if (note.value.trim().length < 8) {
    actionError.value = 'Add a reason of at least 8 characters.'
    return
  }
  busy.value = true
  actionError.value = ''
  try {
    await $fetch(`/api/admin/reports/${item.id}/decision`, {
      method: 'POST',
      body: { action: selected.value.action, reason: note.value },
    })
    const completedAction = selected.value.action
    selected.value = null
    note.value = ''
    await refresh()
    appToast.success(
      completedAction === 'remove'
        ? 'Content removed'
        : completedAction === 'restore'
          ? 'Content restored'
          : 'Report dismissed',
    )
  } catch (error) {
    actionError.value = apiErrorMessage(
      error,
      'Could not save this decision. Refresh and try again.',
    )
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <WorkspaceShell>
    <main class="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14 xl:px-12">
      <NuxtLink
        to="/admin/reviews"
        class="inline-flex items-center gap-2 text-sm font-semibold text-[#496c51] hover:underline"
        ><UIcon name="i-lucide-arrow-left" /> Manage reviews</NuxtLink
      >
      <div class="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p class="text-xs font-bold uppercase tracking-[.17em] text-[#65836a]">
            PRIVATE ADMINISTRATION
          </p>
          <h1 class="mt-3 text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl">
            Content reports<span class="text-[#a4c43e]">.</span>
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-7 text-[#647367]">
            Consider each report in context. Reporting alone never removes a business or a review.
          </p>
        </div>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          class="!rounded-xl"
          @click="refresh()"
          >Refresh</UButton
        >
      </div>
      <div class="mt-9 flex flex-wrap gap-2" role="group" aria-label="Filter reports">
        <UButton
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          :variant="statusFilter === tab.value ? 'solid' : 'outline'"
          :class="
            statusFilter === tab.value
              ? '!bg-[#143e32] !text-white'
              : '!border-[#dbe5d7] !bg-white !text-[#3d5c45]'
          "
          class="!rounded-xl"
          @click="statusFilter = tab.value"
          >{{ tab.label }}</UButton
        >
      </div>
      <div v-if="status === 'pending'" class="mt-8 space-y-4" aria-label="Loading reports">
        <div v-for="n in 3" :key="n" class="h-52 animate-pulse rounded-2xl bg-[#e8eee4]" />
      </div>
      <div
        v-else-if="error"
        role="alert"
        class="mt-8 rounded-2xl border border-red-200 bg-white p-7 text-sm text-red-800"
      >
        {{
          error.statusCode === 403
            ? 'Administrator access is required.'
            : 'Reports could not be loaded. Try again.'
        }}
      </div>
      <div
        v-else-if="!data?.items.length"
        class="mt-8 rounded-2xl border border-dashed border-[#cbdac6] bg-white px-7 py-14 text-center"
      >
        <UIcon name="i-lucide-shield-check" class="text-4xl text-[#648a67]" />
        <h2 class="mt-4 text-xl font-semibold text-[#143e32]">Nothing here right now</h2>
        <p class="mt-2 text-sm text-[#657069]">
          {{
            statusFilter === 'open'
              ? 'New reports will appear here for review.'
              : 'No reports have this status yet.'
          }}
        </p>
      </div>
      <div v-else class="mt-8 space-y-4">
        <article
          v-for="item in data.items"
          :key="item.id"
          class="overflow-hidden rounded-2xl border border-[#dfe6dc] bg-white"
        >
          <div class="p-6 sm:p-7">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full bg-[#edf4e8] px-3 py-1 text-xs font-bold text-[#3c6548]"
                  ><UIcon :name="item.reviewId ? 'i-lucide-message-square' : 'i-lucide-store'" />
                  {{ item.reviewId ? 'Review' : 'Business profile' }}</span
                >
                <h2 class="mt-3 text-xl font-semibold text-[#143e32]">{{ item.businessName }}</h2>
              </div>
              <span class="text-xs text-[#819184]">{{
                new Date(item.createdAt).toLocaleString('en', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              }}</span>
            </div>
            <p class="mt-3 text-sm leading-6 text-[#647367]">{{ item.businessDescription }}</p>
            <p class="mt-4 text-sm text-[#4c5d50]">
              <strong>Reason:</strong> {{ reasonLabel(item.reason) }}
            </p>
            <p
              v-if="item.details"
              class="mt-3 rounded-xl bg-[#f6f8f3] p-4 text-sm leading-6 text-[#536656]"
            >
              {{ item.details }}
            </p>
            <p
              v-if="item.reviewBody"
              class="mt-3 border-l-2 border-[#c9dcbc] pl-4 text-sm leading-6 text-[#536656]"
            >
              <span class="font-semibold text-[#143e32]">Reported review:</span>
              {{ item.reviewBody }}
            </p>
            <BusinessesGallery
              v-if="item.reviewPhotoUrls?.length"
              :images="item.reviewPhotoUrls"
              :business-name="`${item.businessName} review`"
              compact
              class="mt-4"
            />
            <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#758377]">
              <span>Reported by {{ item.reporterName }}</span
              ><NuxtLink
                v-if="item.businessStatus === 'approved'"
                :to="`/businesses/${item.businessSlug}`"
                target="_blank"
                class="inline-flex items-center gap-1 font-semibold text-[#315e42] hover:underline"
                >Open business <UIcon name="i-lucide-arrow-up-right" /></NuxtLink
              ><span v-else>Business currently unavailable publicly</span>
            </div>
            <div
              v-if="item.decisionReason"
              class="mt-5 rounded-xl border border-[#e5ebe1] p-4 text-sm text-[#536656]"
            >
              <span class="font-semibold text-[#143e32]">Last decision:</span>
              {{ item.decisionReason }}
            </div>
          </div>
          <div
            v-if="item.status === 'open' || item.status === 'actioned'"
            class="border-t border-[#edf0e9] px-6 py-4 sm:px-7"
          >
            <div v-if="!selected || selected.id !== item.id" class="flex flex-wrap gap-2">
              <template v-if="item.status === 'open'"
                ><UButton
                  color="neutral"
                  variant="outline"
                  class="!rounded-xl"
                  @click="choose(item.id, 'dismiss')"
                  >Dismiss report</UButton
                ><UButton
                  color="error"
                  variant="soft"
                  class="!rounded-xl"
                  @click="choose(item.id, 'remove')"
                  >Remove {{ item.reviewId ? 'review' : 'business' }}</UButton
                ></template
              >
              <UButton
                v-else
                color="neutral"
                variant="outline"
                icon="i-lucide-rotate-ccw"
                class="!rounded-xl"
                @click="choose(item.id, 'restore')"
                >Restore {{ item.reviewId ? 'review' : 'business' }}</UButton
              >
            </div>
            <form v-else class="space-y-3" @submit.prevent="decide(item)">
              <label
                :for="`report-note-${item.id}`"
                class="block text-sm font-semibold text-[#143e32]"
                >Reason for
                {{
                  selected.action === 'remove'
                    ? 'removal'
                    : selected.action === 'restore'
                      ? 'restoring'
                      : 'dismissal'
                }}</label
              ><UTextarea
                :id="`report-note-${item.id}`"
                v-model="note"
                :maxlength="500"
                :rows="3"
                class="w-full"
                placeholder="Record the evidence and decision for the audit history."
              />
              <UiFeedbackAlert v-if="actionError" tone="error" :message="actionError" />
              <div class="flex flex-wrap items-center justify-between gap-3">
                <UButton
                  type="button"
                  color="neutral"
                  variant="soft"
                  class="!rounded-xl !bg-[#edf1ea]"
                  @click="selected = null"
                  >Cancel</UButton
                >
                <UButton
                  type="submit"
                  :loading="busy"
                  :disabled="busy || note.trim().length < 8"
                  :color="selected.action === 'remove' ? 'error' : 'primary'"
                  class="!rounded-xl"
                  >Confirm {{ selected.action }}</UButton
                >
              </div>
            </form>
          </div>
        </article>
      </div>
      <nav
        v-if="data && data.totalPages > 1"
        aria-label="Report pages"
        class="mt-8 flex items-center justify-between gap-3"
      >
        <UButton
          color="neutral"
          variant="outline"
          :disabled="page <= 1"
          icon="i-lucide-arrow-left"
          @click="page--"
          >Previous</UButton
        ><span class="text-sm text-[#657069]">Page {{ page }} of {{ data.totalPages }}</span
        ><UButton
          color="neutral"
          variant="outline"
          :disabled="page >= data.totalPages"
          trailing-icon="i-lucide-arrow-right"
          @click="page++"
          >Next</UButton
        >
      </nav>
    </main>
  </WorkspaceShell>
</template>
