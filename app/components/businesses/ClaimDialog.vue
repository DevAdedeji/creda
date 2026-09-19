<script setup lang="ts">
import { apiErrorMessage } from '@/utils/apiError'
import { authClient } from '~~/lib/auth-client'
import {
  ownershipMethods,
  type OwnerVerificationView,
  type OwnershipMethod,
} from '~~/shared/ownership'

const props = defineProps<{ slug: string; businessName: string }>()
const route = useRoute()
const { data: session } = await authClient.useSession(useFetch)
const open = ref(false)
const formId = useId()
const method = ref<OwnershipMethod>('official_email')
const evidenceNote = ref('')
const submitting = ref(false)
const submitError = ref('')
const appToast = useAppToast()

const { data, status, error, refresh } = await useFetch<OwnerVerificationView>(
  () => `/api/businesses/${encodeURIComponent(props.slug)}/claim`,
  { immediate: false },
)

const loadError = computed(() =>
  error.value ? apiErrorMessage(error.value, 'We could not load this ownership claim.') : '',
)
const canSubmit = computed(() => evidenceNote.value.trim().length >= 20)
const showsForm = computed(
  () =>
    data.value &&
    data.value.ownershipStatus !== 'verified' &&
    data.value.request?.status !== 'pending',
)

async function showClaimDialog() {
  if (!session.value) {
    await navigateTo({
      path: '/login',
      query: { returnTo: `${route.path}?claim=1` },
    })
    return
  }
  if (!session.value.user.emailVerified) {
    appToast.warning('Verify your email to claim a business')
    return
  }
  open.value = true
  submitError.value = ''
  await refresh()
}

async function submitClaim() {
  if (submitting.value || !canSubmit.value) return
  submitting.value = true
  submitError.value = ''
  try {
    await $fetch(`/api/businesses/${encodeURIComponent(props.slug)}/claim`, {
      method: 'POST',
      body: { method: method.value, evidenceNote: evidenceNote.value },
    })
    evidenceNote.value = ''
    open.value = false
    await refresh()
    appToast.success('Claim submitted', 'We’ll review the official channel you provided.')
  } catch (error) {
    submitError.value = apiErrorMessage(error, 'We could not submit this claim. Try again.')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (route.query.claim !== '1') return
  void showClaimDialog()
  const { claim: _claim, ...query } = route.query
  void navigateTo({ path: route.path, query }, { replace: true })
})
</script>

<template>
  <button
    type="button"
    class="ml-1 font-semibold text-[#24563a] underline decoration-[#98ad97] underline-offset-4 hover:text-[#143e32]"
    @click="showClaimDialog"
  >
    Claim this business
  </button>

  <UModal
    v-model:open="open"
    :title="`Claim ${businessName}`"
    description="Show us an official channel connected to the business."
    :ui="{ content: 'max-w-xl rounded-2xl', body: 'max-h-[70vh] overflow-y-auto' }"
  >
    <template #body>
      <div v-if="status === 'pending'" class="space-y-3" aria-label="Loading claim details">
        <div class="h-14 animate-pulse rounded-xl bg-[#eef3e9]" />
        <div class="h-32 animate-pulse rounded-xl bg-[#eef3e9]" />
      </div>
      <UiFeedbackAlert
        v-else-if="error || !data"
        tone="error"
        title="Claim details unavailable"
        :message="loadError"
      >
        <UButton color="neutral" variant="soft" size="sm" class="mt-3" @click="refresh()">
          Try again
        </UButton>
      </UiFeedbackAlert>
      <UiFeedbackAlert
        v-else-if="data.ownershipStatus === 'verified'"
        tone="success"
        title="Ownership verified"
        message="This business has already been claimed and verified."
      />
      <UiFeedbackAlert
        v-else-if="data.request?.status === 'pending'"
        tone="info"
        title="Claim under review"
        message="We’re checking the details you submitted. The listing stays public while we review it."
      />
      <form v-else :id="formId" class="space-y-5" @submit.prevent="submitClaim">
        <UiFeedbackAlert
          v-if="data.request?.status === 'declined' || data.request?.status === 'revoked'"
          tone="warning"
          title="We could not confirm the previous claim"
          :message="data.request.reviewNote || 'You can submit clearer evidence below.'"
        />
        <p class="text-sm leading-6 text-[#657069]">
          Use a business email, website, or official social account that Creda can independently
          check. Never send a password or identity document.
        </p>
        <UFormField label="Official channel" name="method" required>
          <USelect
            v-model="method"
            :items="[...ownershipMethods]"
            class="w-full"
            size="lg"
            :ui="{
              base: '!rounded-xl !border !border-[#cad9c8] !bg-white !shadow-none !ring-0 focus:!border-[#376c47] focus:!ring-0',
            }"
          />
        </UFormField>
        <UFormField label="How can we verify your connection?" name="evidenceNote" required>
          <UTextarea
            v-model="evidenceNote"
            class="w-full"
            :rows="5"
            :maxlength="2000"
            placeholder="For example: email me at name@business.com, or message the contact listed on our official website."
            required
            :ui="{
              base: '!rounded-xl !border !border-[#cad9c8] !bg-white !shadow-none !ring-0 focus:!border-[#376c47] focus:!ring-0',
            }"
          />
        </UFormField>
        <p class="text-xs leading-5 text-[#657069]">
          Your evidence is private and visible only to you and Creda administrators.
        </p>
        <UiFeedbackAlert v-if="submitError" tone="error" :message="submitError" />
      </form>
    </template>
    <template v-if="showsForm" #footer>
      <UiModalActions
        :form="formId"
        primary-label="Submit claim"
        :loading="submitting"
        :disabled="submitting || !canSubmit"
        @cancel="open = false"
      />
    </template>
  </UModal>
</template>
