<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { businessReviewStructuredData, type BusinessSchemaType } from '@/utils/seo/business'
import { serializeJsonLd } from '@/utils/jsonLd'
import { apiErrorMessage } from '@/utils/apiError'
import type { ReviewListResponse, ReviewPhotoDraft, ReviewVoteSummary } from '~~/shared/reviews'

const props = defineProps<{
  businessId: string
  slug: string
  businessName: string
  schemaType: BusinessSchemaType
}>()
const page = ref(1)
const { data, status, error, refresh } = await useFetch<ReviewListResponse>(
  () => `/api/businesses/${encodeURIComponent(props.slug)}/reviews`,
  { query: { page } },
)

const canonicalUrl = useCanonicalUrl('/businesses/' + encodeURIComponent(props.slug))
useHead(() => {
  const schema =
    data.value && status.value === 'success' && !error.value
      ? businessReviewStructuredData(
          { name: props.businessName, canonicalUrl, type: props.schemaType },
          data.value,
        )
      : null
  return {
    script: schema
      ? [
          {
            key: 'business-reviews',
            type: 'application/ld+json',
            innerHTML: serializeJsonLd(schema),
          },
        ]
      : [],
  }
})

const formOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const formError = ref('')
const rating = ref(0)
const isAnonymous = ref(false)
const body = ref('')
const photos = ref<ReviewPhotoDraft[]>([])
const uploadingPhotos = ref(false)
const photoSession = ref(0)
watch(formOpen, (open) => {
  if (!open) photoSession.value++
})
const experienceMonth = ref(new Date().toISOString().slice(0, 7))
const replyId = ref<string | null>(null)
const replyBody = ref('')
const replySaving = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)
const formId = useId()
const appToast = useAppToast()
const expandedReviews = ref<string[]>([])

function updateVotes(id: string, votes: ReviewVoteSummary) {
  if (!data.value) return
  data.value = {
    ...data.value,
    reviews: data.value.reviews.map((review) => (review.id === id ? { ...review, votes } : review)),
  }
}

function toggleReview(id: string) {
  expandedReviews.value = expandedReviews.value.includes(id)
    ? expandedReviews.value.filter((reviewId) => reviewId !== id)
    : [...expandedReviews.value, id]
}

function reviewActions(id: string, report: () => void, reported: boolean): DropdownMenuItem[] {
  if (data.value?.myReview?.id === id) {
    return [
      { label: 'Edit review', icon: 'i-lucide-square-pen', onSelect: startReview },
      {
        label: 'Delete review',
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect: () => {
          deleteOpen.value = true
        },
      },
    ]
  }
  return [
    {
      label: reported ? 'Report sent' : 'Report review',
      icon: 'i-lucide-flag',
      disabled: reported,
      onSelect: report,
    },
  ]
}

function startReview() {
  const mine = data.value?.myReview
  isEditing.value = Boolean(mine)
  rating.value = mine?.rating ?? 0
  isAnonymous.value = mine?.isAnonymous ?? false
  body.value = mine?.body ?? ''
  photos.value = (mine?.photoUrls ?? []).map((url) => ({ url }))
  experienceMonth.value = mine?.experienceMonth ?? new Date().toISOString().slice(0, 7)
  formError.value = ''
  formOpen.value = true
}

async function saveReview() {
  if (saving.value || uploadingPhotos.value) return
  formError.value = ''
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
        isAnonymous: isAnonymous.value,
        body: body.value,
        experienceMonth: experienceMonth.value,
        photoUrls: photos.value.map((photo) => photo.url),
        mediaProofs: photos.value.flatMap((photo) => (photo.proof ? [photo.proof] : [])),
      },
    })
    formOpen.value = false
    page.value = 1
    await refresh()
    appToast.success(
      isEditing.value ? 'Review updated' : 'Review published',
      isEditing.value ? 'Your changes are now live.' : 'Your review is now live.',
    )
  } catch (error) {
    formError.value = apiErrorMessage(error, 'Your review could not be saved. Please try again.')
  } finally {
    saving.value = false
  }
}

async function removeReview() {
  const mine = data.value?.myReview
  if (!mine || deleting.value) return
  deleting.value = true
  formError.value = ''
  try {
    await $fetch(`/api/reviews/${mine.id}`, { method: 'DELETE' })
    formOpen.value = false
    deleteOpen.value = false
    await refresh()
    appToast.success('Review deleted')
  } catch (error) {
    appToast.error('Review could not be deleted', apiErrorMessage(error, 'Please try again.'))
  } finally {
    deleting.value = false
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
    appToast.success('Response saved', 'Your response is now visible below the review.')
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
    class="rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-6"
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
        v-if="data?.canReview && !data.myReview && !formOpen"
        color="primary"
        class="!rounded-xl !bg-[#173e32] !px-4 !py-2.5 !text-white"
        @click="startReview"
        >Write a review</UButton
      >
    </div>

    <UiFeedbackAlert v-if="formError && !formOpen" tone="error" :message="formError" class="mt-5" />
    <p v-if="data?.reviewBlocked" class="mt-5 text-sm text-[#657069]">
      Your review of this business was removed by Creda and cannot be reposted.
    </p>

    <UModal
      v-model:open="formOpen"
      :dismissible="!saving"
      :close="!saving"
      :title="isEditing ? 'Edit your review' : `Review ${businessName}`"
      description="Share an honest experience to help others decide. Your review appears right away."
      :ui="{ content: 'max-w-xl rounded-2xl', body: 'max-h-[70vh] overflow-y-auto' }"
    >
      <template #body>
        <form :id="formId" method="post" @submit.prevent="saveReview">
          <div class="mb-5 rounded-xl border border-[#dfe6dc] bg-[#f7faf3] p-4">
            <USwitch
              v-model="isAnonymous"
              label="Post anonymously"
              description="Hide your name from the public and the business. Creda admins can still see who posted it."
              :disabled="saving"
              :ui="{
                label: 'font-semibold text-[#143e32]',
                description: 'text-xs leading-5 text-[#657069]',
              }"
            />
            <p v-if="isAnonymous" class="mt-2 text-xs leading-5 text-[#657069]">
              Your review will appear as Anonymous. Text and photos you share remain public.
            </p>
          </div>
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
          <p v-if="isEditing" class="mt-2 text-xs leading-5 text-[#657069]">
            Changing your review's content resets its usefulness votes.
          </p>
          <ReviewsPhotoUpload
            :key="photoSession"
            v-model="photos"
            :disabled="saving || !formOpen"
            class="mt-5"
            @uploading="uploadingPhotos = $event"
          />
          <UiFeedbackAlert v-if="formError" tone="error" :message="formError" class="mt-4" />
        </form>
      </template>
      <template #footer>
        <UiModalActions
          :form="formId"
          :primary-label="isEditing ? 'Save review' : 'Submit review'"
          :loading="saving"
          :disabled="saving || uploadingPhotos"
          :cancel-disabled="saving"
          @cancel="!saving && (formOpen = false)"
        />
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
    <div v-else class="mt-5 divide-y divide-[#e9eee5] border-t border-[#e9eee5]">
      <article
        v-for="review in data.reviews"
        :id="`review-${review.id}`"
        :key="review.id"
        class="py-4 scroll-mt-28 last:pb-0"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <strong class="break-words text-sm text-[#143e32]">{{ review.authorName }}</strong>
            <p class="mt-1 text-xs text-[#708073]">
              Experienced in {{ monthLabel(review.experienceMonth) }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <ReviewsStars :rating="review.rating" />
            <ReportsDialog :business-id="businessId" :review-id="review.id" label="Report review">
              <template #trigger="{ openReport, sent }">
                <UDropdownMenu
                  :items="reviewActions(review.id, openReport, sent)"
                  :content="{ align: 'end', sideOffset: 6 }"
                  :ui="{ content: 'w-44', item: 'py-2' }"
                  :modal="false"
                >
                  <UButton
                    type="button"
                    :aria-label="`Actions for ${review.authorName}'s review`"
                    icon="i-lucide-ellipsis"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="!size-8 !justify-center !rounded-lg !p-0 !text-[#657069] hover:!bg-[#edf4e9]"
                  />
                </UDropdownMenu>
              </template>
            </ReportsDialog>
          </div>
        </div>
        <p
          :id="`review-body-${review.id}`"
          class="mt-2 whitespace-pre-line break-words text-sm leading-6 text-[#465a4c]"
        >
          {{
            review.body.length > 320 && !expandedReviews.includes(review.id)
              ? `${review.body.slice(0, 320).trimEnd()}…`
              : review.body
          }}
        </p>
        <button
          v-if="review.body.length > 320"
          type="button"
          :aria-expanded="expandedReviews.includes(review.id)"
          :aria-controls="`review-body-${review.id}`"
          class="mt-1 text-xs font-semibold text-[#2e6541] hover:underline"
          @click="toggleReview(review.id)"
        >
          {{ expandedReviews.includes(review.id) ? 'Show less' : 'Read more' }}
        </button>
        <BusinessesGallery
          v-if="review.photoUrls?.length"
          :images="review.photoUrls"
          :business-name="`${businessName} review`"
          compact
          unoptimized
          class="mt-3"
        />
        <ReviewsVoteControls
          :review-id="review.id"
          :votes="review.votes"
          :own-review="data.myReview?.id === review.id"
          class="mt-3"
          @updated="updateVotes(review.id, $event)"
        />
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
            <div class="mt-3 flex items-center justify-between gap-3">
              <UButton
                type="button"
                color="neutral"
                variant="soft"
                class="!rounded-xl !bg-[#edf1ea]"
                @click="replyId = null"
                >Cancel</UButton
              >
              <UButton
                type="submit"
                :loading="replySaving"
                :disabled="replySaving"
                class="!rounded-xl !bg-[#173e32] !text-white"
                >Save response</UButton
              >
            </div>
          </form>
        </div>
      </article>
    </div>
    <UiConfirmDialog
      v-model:open="deleteOpen"
      title="Delete your review?"
      description="Your review will be removed from this business and cannot be recovered."
      confirm-label="Delete review"
      :loading="deleting"
      danger
      @confirm="removeReview"
    />
    <div
      v-if="data && data.totalPages > 1"
      class="mt-5 flex items-center justify-between border-t border-[#e9eee5] pt-5 text-sm text-[#5e6d62]"
    >
      <UButton
        variant="outline"
        :disabled="status === 'pending' || data.page <= 1"
        @click="page = data.page - 1"
        >Previous</UButton
      >
      <span>Page {{ data.page }} of {{ data.totalPages }}</span>
      <UButton
        variant="outline"
        :disabled="status === 'pending' || data.page >= data.totalPages"
        @click="page = data.page + 1"
        >Next</UButton
      >
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
