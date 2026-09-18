<script setup lang="ts">
import { apiErrorMessage } from '@/utils/apiError'
import type { ReviewListResponse } from '~~/shared/reviews'

const props = defineProps<{ businessId: string; slug: string; businessName: string }>()
const page = ref(1)
const { data, status, error, refresh } = await useFetch<ReviewListResponse>(
  () => `/api/businesses/${encodeURIComponent(props.slug)}/reviews`,
  { query: { page } },
)

const formOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const formError = ref('')
const message = ref('')
const rating = ref(0)
const body = ref('')
const experienceMonth = ref(new Date().toISOString().slice(0, 7))
const replyId = ref<string | null>(null)
const replyBody = ref('')
const replySaving = ref(false)

function startReview() {
  const mine = data.value?.myReview
  isEditing.value = Boolean(mine)
  rating.value = mine?.rating ?? 0
  body.value = mine?.body ?? ''
  experienceMonth.value = mine?.experienceMonth ?? new Date().toISOString().slice(0, 7)
  formError.value = ''
  formOpen.value = true
}

async function saveReview() {
  formError.value = ''
  message.value = ''
  if (rating.value < 1 || rating.value > 5) {
    formError.value = 'Choose a star rating.'
    return
  }
  if (body.value.trim().length < 30) {
    formError.value = 'Write at least 30 characters about your experience.'
    return
  }
  saving.value = true
  try {
    const mine = data.value?.myReview
    const url = mine ? `/api/reviews/${mine.id}` : '/api/reviews'
    await $fetch(url, {
      method: mine ? 'PATCH' : 'POST',
      body: {
        ...(mine ? {} : { businessId: props.businessId }),
        rating: rating.value,
        body: body.value,
        experienceMonth: experienceMonth.value,
      },
    })
    formOpen.value = false
    message.value = isEditing.value ? 'Your updated review is live.' : 'Your review is live.'
    page.value = 1
    await refresh()
  } catch (error) {
    formError.value = apiErrorMessage(error, 'Your review could not be saved. Please try again.')
  } finally {
    saving.value = false
  }
}

async function removeReview() {
  const mine = data.value?.myReview
  if (!mine || !window.confirm('Delete your review?')) return
  formError.value = ''
  try {
    await $fetch(`/api/reviews/${mine.id}`, { method: 'DELETE' })
    formOpen.value = false
    message.value = 'Your review was deleted.'
    await refresh()
  } catch (error) {
    formError.value = apiErrorMessage(error, 'Your review could not be deleted. Please try again.')
  }
}

function editReply(id: string, current: string | null) {
  replyId.value = id
  replyBody.value = current ?? ''
  formError.value = ''
}

async function saveReply() {
  if (!replyId.value) return
  replySaving.value = true
  formError.value = ''
  try {
    await $fetch(`/api/reviews/${replyId.value}/reply`, {
      method: 'PUT',
      body: { body: replyBody.value },
    })
    replyId.value = null
    await refresh()
  } catch (error) {
    formError.value = apiErrorMessage(error, 'Your reply could not be saved. Please try again.')
  } finally {
    replySaving.value = false
  }
}

function monthLabel(month: string): string {
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${month}-01T12:00:00Z`),
  )
}
</script>

<template>
  <section
    id="reviews"
    class="rounded-2xl border border-[#dfe6dc] bg-white p-7 sm:p-9"
    aria-labelledby="reviews-heading"
  >
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-[.15em] text-[#5d7b61]">
          From the community
        </p>
        <h2 id="reviews-heading" class="mt-2 text-2xl font-semibold tracking-tight text-[#143e32]">
          Reviews
        </h2>
        <div v-if="data?.reviewCount" class="mt-3 flex items-center gap-2 text-sm text-[#55675a]">
          <ReviewsStars
            :rating="data.averageRating ?? 0"
            :label="`${data.averageRating} out of 5 stars, from ${data.reviewCount} ${data.reviewCount === 1 ? 'review' : 'reviews'}`"
          />
          <strong class="text-[#143e32]">{{ data.averageRating?.toFixed(1) }}</strong>
          <span>· {{ data.reviewCount }} {{ data.reviewCount === 1 ? 'review' : 'reviews' }}</span>
        </div>
      </div>
      <UButton
        v-if="data?.canReview && !formOpen"
        color="primary"
        class="!rounded-xl !bg-[#173e32] !px-4 !py-2.5 !text-white"
        @click="startReview"
        >{{ data.myReview ? 'Edit your review' : 'Write a review' }}</UButton
      >
    </div>

    <p v-if="message" role="status" class="mt-5 rounded-xl bg-[#e8f4da] p-3 text-sm text-[#27583a]">
      {{ message }}
    </p>
    <p
      v-if="formError && !formOpen"
      role="alert"
      class="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
    >
      {{ formError }}
    </p>
    <p v-if="data?.reviewBlocked" class="mt-5 text-sm text-[#657069]">
      Your review of this business was removed by Creda and cannot be reposted.
    </p>

    <div
      v-if="data?.myReview && !formOpen"
      class="mt-6 rounded-xl border border-[#d7e4d1] bg-[#f7faf5] p-5"
    >
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-semibold text-[#143e32]">{{
          data.myReview.status === 'published' ? 'Your review is live' : 'Your review'
        }}</span>
        <span
          v-if="data.myReview.status !== 'published'"
          class="rounded-full bg-[#e8efdf] px-2.5 py-1 text-xs font-medium capitalize text-[#45624a]"
          >{{ data.myReview.status === 'pending' ? 'Publishing' : data.myReview.status }}</span
        >
      </div>
      <div v-if="data.myReview.status !== 'published'" class="mt-2">
        <ReviewsStars :rating="data.myReview.rating" />
      </div>
      <p
        v-if="data.myReview.status !== 'published'"
        class="mt-2 whitespace-pre-line text-sm leading-6 text-[#52655a]"
      >
        {{ data.myReview.body }}
      </p>
      <p
        v-if="data.myReview.moderationReason"
        class="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
      >
        Needs changes: {{ data.myReview.moderationReason }}
      </p>
      <UButton variant="link" color="error" class="mt-2 !px-0" @click="removeReview"
        >Delete your review</UButton
      >
    </div>

    <UModal
      v-model:open="formOpen"
      :title="isEditing ? 'Edit your review' : `Review ${businessName}`"
      description="Share an honest experience to help others decide. Your review appears right away."
      :ui="{ content: 'max-w-xl rounded-2xl', body: 'max-h-[70vh] overflow-y-auto' }"
    >
      <template #body>
        <form id="business-review-form" method="post" @submit.prevent="saveReview">
          <fieldset>
            <legend class="text-sm font-semibold text-[#143e32]">Your rating</legend>
            <div class="mt-2 flex gap-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                :aria-label="`${star} ${star === 1 ? 'star' : 'stars'}`"
                :aria-pressed="rating === star"
                class="grid size-11 place-items-center rounded-lg text-[#d59b34] transition hover:bg-[#eef4e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#376c47]"
                @click="rating = star"
              >
                <span
                  class="text-3xl leading-none"
                  :class="star <= rating ? 'text-[#d59b34]' : 'text-[#b9c2b7]'"
                  aria-hidden="true"
                  >{{ star <= rating ? '★' : '☆' }}</span
                >
              </button>
            </div>
          </fieldset>
          <label class="mt-5 block text-sm font-semibold text-[#143e32]" for="review-month"
            >When did you experience this business?</label
          >
          <input
            id="review-month"
            v-model="experienceMonth"
            type="month"
            required
            :max="new Date().toISOString().slice(0, 7)"
            class="mt-2 w-full rounded-xl border border-[#cad9c8] bg-white px-4 py-3 text-[#143e32] outline-none focus:border-[#376c47]"
          />
          <label class="mt-5 block text-sm font-semibold text-[#143e32]" for="review-body"
            >Your experience</label
          >
          <textarea
            id="review-body"
            v-model="body"
            required
            minlength="30"
            maxlength="2000"
            rows="5"
            placeholder="What was your experience like? Share details that would help someone else decide."
            class="mt-2 w-full resize-y rounded-xl border border-[#cad9c8] bg-white px-4 py-3 text-[#143e32] outline-none focus:border-[#376c47]"
          />
          <p v-if="formError" role="alert" class="mt-3 text-sm text-red-700">{{ formError }}</p>
          <div class="mt-5 flex flex-wrap justify-end gap-2">
            <UButton type="button" variant="outline" class="!rounded-xl" @click="formOpen = false"
              >Cancel</UButton
            >
            <UButton
              type="submit"
              :loading="saving"
              :disabled="saving"
              class="!rounded-xl !bg-[#173e32] !text-white"
              >{{ isEditing ? 'Save review' : 'Submit review' }}</UButton
            >
          </div>
        </form>
      </template>
    </UModal>

    <div v-if="status === 'pending'" class="mt-7 space-y-3" aria-label="Loading reviews">
      <div v-for="item in 2" :key="item" class="h-28 animate-pulse rounded-xl bg-[#eef3e9]" />
    </div>
    <p v-else-if="error" class="mt-7 rounded-xl bg-red-50 p-5 text-sm text-red-700">
      Reviews could not be loaded.
      <button type="button" class="font-semibold underline" @click="refresh()">Try again</button>.
    </p>
    <div
      v-else-if="!data?.reviewCount"
      class="mt-7 rounded-xl border border-dashed border-[#cbd9c6] bg-[#f9fbf6] px-6 py-9 text-center"
    >
      <UIcon name="i-lucide-messages-square" class="text-3xl text-[#799478]" />
      <h3 class="mt-3 text-lg font-semibold text-[#143e32]">No reviews yet</h3>
      <p class="mt-2 text-sm text-[#657069]">Be the first to share an experience.</p>
    </div>
    <div v-else class="mt-7 divide-y divide-[#e9eee5] border-t border-[#e9eee5]">
      <article
        v-for="review in data.reviews"
        :id="`review-${review.id}`"
        :key="review.id"
        class="py-6 scroll-mt-28"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <strong class="text-[#143e32]">{{ review.authorName }}</strong>
            <p class="mt-1 text-xs text-[#708073]">
              Experienced in {{ monthLabel(review.experienceMonth) }}
            </p>
          </div>
          <ReviewsStars :rating="review.rating" />
        </div>
        <p class="mt-3 whitespace-pre-line text-sm leading-7 text-[#465a4c]">{{ review.body }}</p>
        <div v-if="review.reply" class="mt-4 rounded-xl bg-[#f3f7ef] p-4">
          <p class="text-xs font-bold uppercase tracking-wide text-[#51705a]">
            Response from the business
          </p>
          <p class="mt-2 whitespace-pre-line text-sm leading-6 text-[#465a4c]">
            {{ review.reply.body }}
          </p>
        </div>
        <div v-if="data.isOwner" class="mt-3">
          <button
            v-if="replyId !== review.id"
            type="button"
            class="text-sm font-semibold text-[#2e6541] hover:underline"
            @click="editReply(review.id, review.reply?.body ?? null)"
          >
            {{ review.reply ? 'Edit response' : 'Reply to review' }}
          </button>
          <form v-else method="post" class="mt-3" @submit.prevent="saveReply">
            <label class="text-sm font-semibold text-[#143e32]" :for="`reply-${review.id}`"
              >Your response</label
            >
            <textarea
              :id="`reply-${review.id}`"
              v-model="replyBody"
              required
              minlength="2"
              maxlength="1000"
              rows="3"
              class="mt-2 w-full rounded-xl border border-[#cad9c8] px-4 py-3 text-sm outline-none focus:border-[#376c47]"
            />
            <div class="mt-2 flex gap-2">
              <UButton
                type="submit"
                :loading="replySaving"
                :disabled="replySaving"
                class="!rounded-xl !bg-[#173e32] !text-white"
                >Save response</UButton
              ><UButton type="button" variant="outline" class="!rounded-xl" @click="replyId = null"
                >Cancel</UButton
              >
            </div>
          </form>
        </div>
        <div class="mt-3 flex justify-end">
          <ReportsDialog :business-id="businessId" :review-id="review.id" label="Report review" />
        </div>
      </article>
    </div>
    <div
      v-if="data && data.totalPages > 1"
      class="mt-5 flex items-center justify-between border-t border-[#e9eee5] pt-5 text-sm text-[#5e6d62]"
    >
      <UButton variant="outline" :disabled="page <= 1" @click="page--">Previous</UButton>
      <span>Page {{ data.page }} of {{ data.totalPages }}</span>
      <UButton variant="outline" :disabled="page >= data.totalPages" @click="page++">Next</UButton>
    </div>
    <p
      v-if="
        !data?.canReview && !data?.isOwner && !data?.myReview && !data?.reviewBlocked && !formOpen
      "
      class="mt-6 text-sm text-[#657069]"
    >
      Want to share your experience?
      <NuxtLink to="/login" class="font-semibold text-[#2e6541] underline">Log in</NuxtLink> to
      write a review.
    </p>
  </section>
</template>
