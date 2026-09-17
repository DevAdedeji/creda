<script setup lang="ts">
import { apiErrorMessage } from '@/utils/apiError'
import { reportReasons } from '~~/shared/reports'

const props = defineProps<{ businessId: string; reviewId?: string; label: string }>()
const formId = useId()
const open = ref(false)
const reason = ref<(typeof reportReasons)[number]['value']>('misleading')
const details = ref('')
const submitting = ref(false)
const sent = ref(false)
const errorMessage = ref('')
const toast = useToast()

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
    toast.add({
      title: 'Report received',
      description: 'Thank you. Our team will review it.',
      color: 'success',
    })
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, 'Your report could not be sent. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Report ${reviewId ? 'this review' : 'this business'}`"
    description="Tell us what seems wrong. Reports are private and do not automatically remove content."
    :ui="{ content: 'max-w-lg rounded-2xl' }"
  >
    <UButton
      :disabled="sent"
      color="neutral"
      variant="link"
      icon="i-lucide-flag"
      class="!px-0 !text-[#68796b] hover:!text-[#143e32]"
      >{{ sent ? 'Report sent' : label }}</UButton
    >
    <template #body>
      <form :id="formId" class="space-y-5" @submit.prevent="sendReport">
        <UFormField label="What is the issue?" required>
          <USelect
            v-model="reason"
            :items="[...reportReasons]"
            class="w-full"
            :ui="{ base: '!rounded-xl !ring-0 focus:!ring-0' }"
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
            :ui="{ base: '!rounded-xl !ring-0 focus:!ring-0' }"
          />
        </UFormField>
        <p v-if="errorMessage" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {{ errorMessage }}
          <NuxtLink
            v-if="errorMessage.toLowerCase().includes('sign in')"
            to="/login"
            class="font-semibold underline"
            >Log in</NuxtLink
          >
        </p>
      </form>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" class="!rounded-xl" @click="open = false"
          >Cancel</UButton
        >
        <UButton
          type="submit"
          :form="formId"
          :loading="submitting"
          :disabled="submitting || (reason === 'other' && details.trim().length < 10)"
          class="!rounded-xl !bg-[#143e32] !text-white"
          >Send report</UButton
        >
      </div>
    </template>
  </UModal>
</template>
