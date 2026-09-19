<script setup lang="ts">
import AuthShell from '@/components/auth/AuthShell.vue'
import PasswordInput from '@/components/auth/PasswordInput.vue'
import { authClient } from '~~/lib/auth-client'

useSeoMeta({ title: 'Choose a new password — Creda', robots: 'noindex, nofollow' })
const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : ''
const password = ref('')
const confirmPassword = ref('')
const pending = ref(false)
const errorMessage = ref('')

async function resetPassword() {
  if (pending.value || !token) return
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'The passwords do not match.'
    return
  }
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await authClient.resetPassword({ newPassword: password.value, token })
    if (result.error) {
      errorMessage.value = 'This link has expired or is invalid. Request a new one.'
      return
    }
    await navigateTo('/login?reset=1')
  } catch {
    errorMessage.value = 'We could not reset your password. Please try again.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div
      class="mb-7 grid size-16 place-items-center rounded-full bg-[#d8f36a] text-3xl text-[#143e32]"
    >
      <UIcon name="i-lucide-lock-keyhole" />
    </div>
    <p class="mb-4 text-xs font-bold tracking-[.18em] text-[#406a4a]">ACCOUNT RECOVERY</p>
    <h1 class="text-4xl font-semibold leading-tight tracking-[-.055em] sm:text-5xl">
      Choose a new password.
    </h1>
    <p class="mt-5 text-base leading-7 text-[#657069]">
      Use at least 8 characters for your new Creda password.
    </p>
    <UiFeedbackAlert v-if="errorMessage" tone="error" :message="errorMessage" class="mt-6" />
    <form
      v-if="token"
      method="post"
      class="space-y-4"
      :class="errorMessage ? 'mt-5' : 'mt-9'"
      @submit.prevent="resetPassword"
    >
      <UFormField label="New password" name="password" required
        ><PasswordInput
          v-model="password"
          name="password"
          autocomplete="new-password"
          placeholder="At least 8 characters"
          required
          :minlength="8"
          :maxlength="128"
      /></UFormField>
      <UFormField label="Confirm new password" name="confirmPassword" required
        ><PasswordInput
          v-model="confirmPassword"
          name="confirmPassword"
          autocomplete="new-password"
          placeholder="Enter it again"
          leading-icon="i-lucide-shield-check"
          required
          :minlength="8"
          :maxlength="128"
      /></UFormField>
      <UButton
        type="submit"
        size="xl"
        block
        class="!mt-7 !rounded-xl !bg-[#143e32] !py-3.5 !font-semibold !text-white hover:!bg-[#24563f]"
        :loading="pending"
        >Save new password <UIcon name="i-lucide-arrow-right"
      /></UButton>
    </form>
    <UiFeedbackAlert
      v-else
      tone="warning"
      message="This reset link is missing a token. Request a new link to continue."
      class="mt-7"
    />
    <NuxtLink
      to="/forgot-password"
      class="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-[#143e32] hover:underline"
      ><UIcon name="i-lucide-arrow-left" /> Request a new link</NuxtLink
    >
  </AuthShell>
</template>
