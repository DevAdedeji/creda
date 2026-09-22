<script setup lang="ts">
import { apiErrorMessage } from '@/utils/apiError'
import AdminFilters from '@/components/reviews/AdminFilters.vue'
import {
  adminReviewStatusOptions,
  type AdminReviewFilters,
  type AdminReviewListResponse,
} from '~~/shared/reviews'

useSeoMeta({ title: 'Manage reviews — Creda', robots: 'noindex, nofollow' })

const defaultFilters = (): AdminReviewFilters => ({
  business: '',
  reviewer: '',
  status: 'published',
})
const draft = ref<AdminReviewFilters>(defaultFilters())
const applied = ref<AdminReviewFilters>(defaultFilters())
const hasSearchFilters = computed(() =>
  Boolean(applied.value.business || applied.value.reviewer || applied.value.rating),
)
const page = ref(1)
const { data, status, error, refresh } = await useFetch<AdminReviewListResponse>(
  '/api/reviews/admin',
  {
    query: computed(() => ({ page: page.value, ...applied.value })),
    retry: 0,
  },
)
const decisionReviewId = ref<string | null>(null)
const reason = ref('')
const actionError = ref('')
const actionErrorReviewId = ref<string | null>(null)
const actingId = ref<string | null>(null)
const appToast = useAppToast()

function applyFilters() {
  if (actingId.value) return
  applied.value = {
    ...draft.value,
    business: draft.value.business.trim(),
    reviewer: draft.value.reviewer.trim(),
  }
  page.value = 1
  resetDecision()
}

function clearFilters() {
  draft.value = defaultFilters()
  applyFilters()
}

function resetDecision() {
  decisionReviewId.value = null
  reason.value = ''
  actionError.value = ''
  actionErrorReviewId.value = null
}

function changePage(nextPage: number) {
  if (actingId.value || status.value === 'pending') return
  page.value = nextPage
  resetDecision()
}

async function removeReview(id: string) {
  if (actingId.value) return
  actionError.value = ''
  actionErrorReviewId.value = null
  actingId.value = id
  try {
    await $fetch(`/api/reviews/admin/${id}/moderate`, {
      method: 'POST',
      body: { decision: 'remove', reason: reason.value },
    })
    decisionReviewId.value = null
    reason.value = ''
    await refresh()
    appToast.success('Review removed', 'The review is no longer visible on the business page.')
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

function openDecision(id: string) {
  decisionReviewId.value = id
  reason.value = ''
  actionError.value = ''
  actionErrorReviewId.value = null
}
</script>

<template>
  <WorkspaceShell>
    <main class="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <NuxtLink
        to="/account"
        class="inline-flex items-center gap-2 text-sm font-semibold text-[#45694e] hover:underline"
        ><UIcon name="i-lucide-arrow-left" /> Account</NuxtLink
      >
      <p class="mt-9 text-xs font-bold uppercase tracking-[.15em] text-[#65836a]">
        Creda administration
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Manage reviews</h1>
      <p class="mt-3 max-w-2xl text-sm leading-7 text-[#647367]">
        Reviews appear as soon as people post them. Remove a public review if it violates Creda's
        standards.
      </p>
      <NuxtLink
        to="/admin/reports"
        class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#315e42] hover:underline"
        ><UIcon name="i-lucide-flag" /> View content reports <UIcon name="i-lucide-arrow-up-right"
      /></NuxtLink>

      <AdminFilters
        v-model="draft"
        :loading="status === 'pending'"
        :disabled="Boolean(actingId)"
        class="mt-8"
        @apply="applyFilters"
        @clear="clearFilters"
      />
      <p v-if="data && status === 'success'" class="mt-5 text-sm text-[#647367]" role="status">
        {{ data.total }} {{ data.total === 1 ? 'review' : 'reviews'
        }}{{ hasSearchFilters ? ' matching your filters' : '' }}
      </p>

      <div v-if="status === 'pending'" class="mt-8 space-y-4" aria-label="Loading reviews">
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
        <h2 class="mt-3 text-lg font-semibold">No reviews found</h2>
        <p class="mt-2 text-sm text-[#647367]">
          Try another business or reviewer, or broaden the status and rating filters.
        </p>
        <UButton
          v-if="hasSearchFilters"
          color="neutral"
          variant="soft"
          class="mt-5"
          @click="clearFilters"
          >Clear filters</UButton
        >
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
              <p class="mt-1 break-all text-xs text-[#718073]">{{ review.authorEmail }}</p>
              <p
                v-if="review.isAnonymous"
                class="mt-1 inline-flex items-center gap-1.5 rounded-md bg-[#edf1ea] px-2 py-1 text-xs text-[#385344]"
              >
                <UIcon name="i-lucide-eye-off" class="size-3.5" />
                Anonymous publicly · identity visible to admins
              </p>
              <p class="mt-1 text-xs text-[#718073]">
                Experience: {{ review.experienceMonth }} · Submitted
                {{ new Date(review.createdAt).toLocaleDateString() }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span
                class="rounded-md px-2 py-1 text-xs font-medium"
                :class="
                  review.status === 'published'
                    ? 'bg-[#edf4e7] text-[#315b3a]'
                    : 'bg-[#f1f2ee] text-[#657069]'
                "
                >{{
                  adminReviewStatusOptions.find((item) => item.value === review.status)?.label
                }}</span
              >
              <ReviewsStars :rating="review.rating" />
            </div>
          </div>
          <p class="mt-4 whitespace-pre-line text-sm leading-7 text-[#485d4d]">{{ review.body }}</p>
          <BusinessesGallery
            v-if="review.photoUrls?.length"
            :images="review.photoUrls"
            :business-name="`${review.businessName} review`"
            compact
            class="mt-4"
          />
          <NuxtLink
            :to="`/businesses/${review.businessSlug}`"
            target="_blank"
            class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#376a49] hover:underline"
            >View business <UIcon name="i-lucide-arrow-up-right"
          /></NuxtLink>
          <div v-if="review.status === 'published'" class="mt-5 border-t border-[#e9eee5] pt-5">
            <UButton
              type="button"
              variant="outline"
              color="error"
              :disabled="Boolean(actingId)"
              class="!rounded-xl"
              @click="openDecision(review.id)"
              >Remove from public page</UButton
            >
          </div>
          <form
            v-if="decisionReviewId === review.id"
            method="post"
            class="mt-5 rounded-xl bg-[#f7faf4] p-4"
            @submit.prevent="removeReview(review.id)"
          >
            <label :for="`reason-${review.id}`" class="text-sm font-semibold"
              >Reason for removal</label
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
            <div class="mt-3 flex items-center justify-between gap-3">
              <UButton
                type="button"
                color="neutral"
                variant="soft"
                class="!rounded-xl !bg-[#edf1ea]"
                @click="decisionReviewId = null"
                >Cancel</UButton
              >
              <UButton
                type="submit"
                :loading="actingId === review.id"
                :disabled="Boolean(actingId)"
                color="error"
                class="!rounded-xl"
                >Confirm removal</UButton
              >
            </div>
          </form>
          <UiFeedbackAlert
            v-if="actionError && actionErrorReviewId === review.id"
            tone="error"
            :message="actionError"
            class="mt-3"
          />
        </article>
      </div>
      <div
        v-if="data && data.totalPages > 1 && !error"
        class="mt-8 flex items-center justify-between text-sm text-[#647367]"
      >
        <UButton
          variant="outline"
          :disabled="data.page <= 1 || status === 'pending' || Boolean(actingId)"
          @click="changePage(data.page - 1)"
          >Previous</UButton
        ><span>Page {{ data.page }} of {{ data.totalPages }}</span
        ><UButton
          variant="outline"
          :disabled="data.page >= data.totalPages || status === 'pending' || Boolean(actingId)"
          @click="changePage(data.page + 1)"
          >Next</UButton
        >
      </div>
    </main>
  </WorkspaceShell>
</template>
