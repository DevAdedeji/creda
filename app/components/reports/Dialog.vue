<script setup lang="ts">
import { apiErrorMessage } from '@/utils/apiError'
import { reportReasons } from '~~/shared/reports'

const props = withDefaults(
  defineProps<{ businessId: string; reviewId?: string; label: string; iconOnly?: boolean }>(),
  { iconOnly: false },
)
const formId = useId()
const open = ref(false)
const reason = ref<(typeof reportReasons)[number]['value']>('misleading')
const details = ref('')
const submitting = ref(false)
const sent = ref(false)
const errorMessage = ref('')
const appToast = useAppToast()

async function sendReport() {
  if (submitting.value) return
  errorMessage.value = ''
  submitting.value = true
  try {
    await $fetch('/api/reports', {
      method: 'POST',
      body: {
        businessId: props.businessId,
        reviewId: props.reviewId,
        reason: reason.value,
        details: details.value,
      },
    })
    sent.value = true
    open.value = false
    appToast.success('Report received', 'Thank you. Our team will review it.')
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, 'Your report could not be sent. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UTooltip v-if="iconOnly" :text="sent ? 'Report sent' : label">
    <UButton
      :disabled="sent"
      :aria-label="sent ? 'Report sent' : label"
      color="neutral"
      variant="ghost"
      size="xs"
      icon="i-lucide-flag"
      class="!size-6 !justify-center !rounded-md !p-0 !text-[#68796b] hover:!bg-[#f1f5ee] hover:!text-[#143e32]"
      @click="open = true"
    />
  </UTooltip>
  <UButton
    v-else
    :disabled="sent"
    color="neutral"
    variant="link"
    icon="i-lucide-flag"
    class="!px-0 !text-[#68796b] hover:!text-[#143e32]"
    @click="open = true"
    >{{ sent ? 'Report sent' : label }}</UButton
  >
  <UModal
    v-model:open="open"
    :title="`Report ${reviewId ? 'this review' : 'this business'}`"
    description="Tell us what seems wrong. Reports are private and do not automatically remove content."
    :ui="{ content: 'max-w-lg rounded-2xl' }"
  >
    <template #body>
      <form :id="formId" class="space-y-5" @submit.prevent="sendReport">
        <UFormField label="What is the issue?" required>
          <USelect
            v-model="reason"
            :items="[...reportReasons]"
            class="w-full"
            :ui="{
              base: '!rounded-xl !border !border-[#cad9c8] !bg-white !shadow-none !ring-0 focus:!border-[#376c47] focus:!ring-0',
            }"
          />
        </UFormField>
        <UFormField
          label="Details"
          :description="
            reason === 'other'
              ? 'Please explain in at least 10 characters.'
              : 'Optional, but details help us make a fair decision.'
          "
        >
          <UTextarea
            v-model="details"
            :rows="4"
            :maxlength="1000"
            placeholder="What should we look at?"
            class="w-full"
            :ui="{
              base: '!rounded-xl !border !border-[#cad9c8] !bg-white !shadow-none !ring-0 focus:!border-[#376c47] focus:!ring-0',
            }"
          />
        </UFormField>
        <UiFeedbackAlert v-if="errorMessage" tone="error" :message="errorMessage">
          <NuxtLink
            v-if="errorMessage.toLowerCase().includes('sign in')"
            to="/login"
            class="mt-1 inline-flex font-semibold underline"
            >Log in</NuxtLink
          >
        </UiFeedbackAlert>
      </form>
    </template>
    <template #footer>
      <UiModalActions
        :form="formId"
        primary-label="Send report"
        :loading="submitting"
        :disabled="submitting || (reason === 'other' && details.trim().length < 10)"
        @cancel="open = false"
      />
    </template>
  </UModal>
</template>
