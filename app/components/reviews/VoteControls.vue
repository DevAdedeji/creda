<script setup lang="ts">
import type { ReviewVoteSummary, ReviewVoteValue } from '~~/shared/reviews'
import { apiErrorMessage } from '@/utils/apiError'

const props = defineProps<{ reviewId: string; votes: ReviewVoteSummary; ownReview: boolean }>()
const emit = defineEmits<{ updated: [votes: ReviewVoteSummary] }>()
const route = useRoute()
const appToast = useAppToast()
const saving = ref(false)
const announcement = ref('')
const options = [
  { value: 'useful', label: 'Useful', icon: 'i-lucide-thumbs-up', count: 'usefulCount' },
  {
    value: 'not_useful',
    label: 'Not useful',
    icon: 'i-lucide-thumbs-down',
    count: 'notUsefulCount',
  },
] as const

async function vote(value: ReviewVoteValue) {
  if (saving.value || props.ownReview) return
  saving.value = true
  const selection = props.votes.myVote === value ? null : value
  try {
    const result = await $fetch<ReviewVoteSummary>(`/api/reviews/${props.reviewId}/vote`, {
      method: 'PUT',
      body: { vote: selection },
    })
    emit('updated', result)
    announcement.value =
      selection === null
        ? 'Your vote was removed.'
        : `You marked this review as ${selection === 'useful' ? 'useful' : 'not useful'}.`
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
      await navigateTo({
        path: '/login',
        query: { returnTo: `${route.fullPath.split('#')[0]}#review-${props.reviewId}` },
      })
    } else {
      appToast.error('Your vote could not be saved', apiErrorMessage(error, 'Please try again.'))
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-2"
    role="group"
    aria-label="Was this review useful?"
    :aria-busy="saving"
  >
    <UTooltip
      v-for="option in options"
      :key="option.value"
      :text="
        ownReview
          ? 'You cannot vote on your own review'
          : votes.myVote === option.value
            ? 'Remove your vote'
            : `Mark as ${option.label.toLowerCase()}`
      "
    >
      <span>
        <UButton
          type="button"
          color="neutral"
          variant="ghost"
          size="xs"
          :icon="option.icon"
          :disabled="saving || ownReview"
          :aria-pressed="votes.myVote === option.value"
          :aria-label="`${option.label}: ${votes[option.count]} votes`"
          class="!gap-1.5 !rounded-full !border !px-2.5 !py-1.5 !text-xs transition"
          :class="
            votes.myVote === option.value
              ? '!border-[#b7cea5] !bg-[#edf5e4] !text-[#28543b]'
              : '!border-[#e4e9e1] !text-[#657069] hover:!bg-[#f3f7ef]'
          "
          @click="vote(option.value)"
        >
          {{ option.label }} <span class="tabular-nums">{{ votes[option.count] }}</span>
        </UButton>
      </span>
    </UTooltip>
    <span role="status" class="sr-only">{{ announcement }}</span>
  </div>
</template>
