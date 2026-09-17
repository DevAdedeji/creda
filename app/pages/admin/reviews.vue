<script setup lang="ts">
import { apiErrorMessage } from '@/utils/apiError'
import type { AdminReview, ReviewStatus } from '~~/shared/reviews'

type AdminResponse = { reviews: AdminReview[]; page: number; totalPages: number }

useSeoMeta({ title: 'Review moderation — Creda', robots: 'noindex, nofollow' })

const statusFilter = ref<ReviewStatus>('pending')
const page = ref(1)
const { data, status, error, refresh } = await useFetch<AdminResponse>('/api/reviews/admin', {
  query: { page, status: statusFilter },
})
const decisionReviewId = ref<string | null>(null)
const decision = ref<'reject' | 'remove'>('reject')
const reason = ref('')
const actionError = ref('')
const actionErrorReviewId = ref<string | null>(null)
const actingId = ref<string | null>(null)

watch(statusFilter, () => {
  page.value = 1
  decisionReviewId.value = null
  actionError.value = ''
  actionErrorReviewId.value = null
})

async function moderate(id: string, choice: 'publish' | 'reject' | 'remove') {
  actionError.value = ''
  actionErrorReviewId.value = null
  actingId.value = id
  try {
    await $fetch(`/api/reviews/admin/${id}/moderate`, {
      method: 'POST',
      body:
        choice === 'publish' ? { decision: choice } : { decision: choice, reason: reason.value },
    })
    decisionReviewId.value = null
    reason.value = ''
    await refresh()
  } catch (error) {
    actionError.value = apiErrorMessage(
      error,
      'This review could not be moderated. Please try again.',
    )
    actionErrorReviewId.value = id
  } finally {
    actingId.value = null
  }
}

function openDecision(id: string, choice: 'reject' | 'remove') {
  decisionReviewId.value = id
  decision.value = choice
  reason.value = ''
  actionError.value = ''
  actionErrorReviewId.value = null
}
</script>

<template>
  <div class="min-h-screen bg-[#fcfcf8] text-[#173e32]">
    <LandingHeader />
    <main class="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <NuxtLink
        to="/account"
        class="inline-flex items-center gap-2 text-sm font-semibold text-[#45694e] hover:underline"
        ><UIcon name="i-lucide-arrow-left" /> Account</NuxtLink
      >
      <p class="mt-9 text-xs font-bold uppercase tracking-[.15em] text-[#65836a]">
        Creda administration
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Review moderation</h1>
      <p class="mt-3 max-w-2xl text-sm leading-7 text-[#647367]">
        Read each customer experience before it becomes public. Apply the same standard to positive
        and negative reviews.
      </p>
      <NuxtLink
        to="/admin/reports"
        class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#315e42] hover:underline"
        ><UIcon name="i-lucide-flag" /> View content reports <UIcon name="i-lucide-arrow-up-right"
      /></NuxtLink>

      <div class="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter reviews by status">
        <UButton
          v-for="item in ['pending', 'published', 'rejected', 'removed'] as const"
          :key="item"
          type="button"
          :variant="statusFilter === item ? 'solid' : 'outline'"
          :class="statusFilter === item ? '!bg-[#173e32] !text-white' : ''"
          class="!rounded-xl capitalize"
          @click="statusFilter = item"
          >{{ item }}</UButton
        >
      </div>

      <div v-if="status === 'pending'" class="mt-8 space-y-4" aria-label="Loading review queue">
        <div v-for="item in 3" :key="item" class="h-52 animate-pulse rounded-2xl bg-[#eaf0e5]" />
      </div>
      <div
        v-else-if="error"
        class="mt-8 rounded-2xl border border-red-200 bg-white p-7 text-sm text-red-700"
      >
        {{
          error.statusCode === 403
            ? 'This page is only available to Creda administrators.'
            : 'Reviews could not be loaded.'
        }}
        <button
          v-if="error.statusCode !== 403"
          type="button"
          class="ml-2 font-semibold underline"
          @click="refresh()"
        >
          Try again
        </button>
      </div>
      <div
        v-else-if="!data?.reviews.length"
        class="mt-8 rounded-2xl border border-dashed border-[#cbd9c6] bg-white p-10 text-center"
      >
        <UIcon name="i-lucide-inbox" class="text-3xl text-[#82987d]" />
        <h2 class="mt-3 text-lg font-semibold">No {{ statusFilter }} reviews</h2>
      </div>
      <div v-else class="mt-8 space-y-4">
        <article
          v-for="review in data.reviews"
          :key="review.id"
          class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-7"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-[#68816b]">
                {{ review.businessName }}
              </p>
              <h2 class="mt-2 text-lg font-semibold">{{ review.authorName }}</h2>
              <p class="mt-1 text-xs text-[#718073]">
                Experience: {{ review.experienceMonth }} · Submitted
                {{ new Date(review.createdAt).toLocaleDateString() }}
              </p>
            </div>
            <ReviewsStars :rating="review.rating" />
          </div>
          <p class="mt-4 whitespace-pre-line text-sm leading-7 text-[#485d4d]">{{ review.body }}</p>
          <NuxtLink
            :to="`/businesses/${review.businessSlug}`"
            target="_blank"
            class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#376a49] hover:underline"
            >View business <UIcon name="i-lucide-arrow-up-right"
          /></NuxtLink>
          <div
            v-if="statusFilter === 'pending'"
            class="mt-5 flex flex-wrap gap-2 border-t border-[#e9eee5] pt-5"
          >
            <UButton
              type="button"
              :loading="actingId === review.id"
              :disabled="Boolean(actingId)"
              class="!rounded-xl !bg-[#173e32] !text-white"
              @click="moderate(review.id, 'publish')"
              >Publish review</UButton
            >
            <UButton
              type="button"
              variant="outline"
              :disabled="Boolean(actingId)"
              class="!rounded-xl"
              @click="openDecision(review.id, 'reject')"
              >Reject</UButton
            >
          </div>
          <div v-if="statusFilter === 'published'" class="mt-5 border-t border-[#e9eee5] pt-5">
            <UButton
              type="button"
              variant="outline"
              color="error"
              :disabled="Boolean(actingId)"
              class="!rounded-xl"
              @click="openDecision(review.id, 'remove')"
              >Remove from public page</UButton
            >
          </div>
          <form
            v-if="decisionReviewId === review.id"
            method="post"
            class="mt-5 rounded-xl bg-[#f7faf4] p-4"
            @submit.prevent="moderate(review.id, decision)"
          >
            <label :for="`reason-${review.id}`" class="text-sm font-semibold"
              >Reason for {{ decision === 'reject' ? 'rejection' : 'removal' }}</label
            >
            <textarea
              :id="`reason-${review.id}`"
              v-model="reason"
              required
              minlength="8"
              maxlength="500"
              rows="3"
              class="mt-2 w-full rounded-xl border border-[#cad9c8] bg-white px-4 py-3 text-sm outline-none focus:border-[#376c47]"
            />
            <p class="mt-1 text-xs text-[#657069]">Recorded in the moderation history.</p>
            <div class="mt-3 flex gap-2">
              <UButton
                type="submit"
                :loading="actingId === review.id"
                :disabled="Boolean(actingId)"
                color="error"
                class="!rounded-xl"
                >Confirm {{ decision }}</UButton
              ><UButton
                type="button"
                variant="outline"
                class="!rounded-xl"
                @click="decisionReviewId = null"
                >Cancel</UButton
              >
            </div>
          </form>
          <p
            v-if="actionError && actionErrorReviewId === review.id"
            role="alert"
            class="mt-3 text-sm text-red-700"
          >
            {{ actionError }}
          </p>
        </article>
      </div>
      <div
        v-if="data && data.totalPages > 1"
        class="mt-8 flex items-center justify-between text-sm text-[#647367]"
      >
        <UButton variant="outline" :disabled="page <= 1" @click="page--">Previous</UButton
        ><span>Page {{ data.page }} of {{ data.totalPages }}</span
        ><UButton variant="outline" :disabled="page >= data.totalPages" @click="page++"
          >Next</UButton
        >
      </div>
    </main>
  </div>
</template>
