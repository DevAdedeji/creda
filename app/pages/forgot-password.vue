<script setup lang="ts">
import AuthShell from '@/components/auth/AuthShell.vue'
import { authInputUi } from '@/utils/authInputUi'
import { authClient } from '~~/lib/auth-client'

useSeoMeta({ title: 'Reset password — Creda', robots: 'noindex, nofollow' })
const email = ref('')
const pending = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

async function requestReset() {
  if (pending.value) return
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await authClient.requestPasswordReset({
      email: email.value.trim().toLowerCase(),
      redirectTo: '/reset-password',
    })
    if (result.error) {
      errorMessage.value = 'We could not send the link right now. Please try again.'
      return
    }
    submitted.value = true
  } catch {
    errorMessage.value = 'We could not send the link right now. Please try again.'
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
      <UIcon name="i-lucide-key-round" />
    </div>
    <p class="mb-4 text-xs font-bold tracking-[.18em] text-[#406a4a]">ACCOUNT RECOVERY</p>
    <h1 class="text-4xl font-semibold leading-tight tracking-[-.055em] sm:text-5xl">
      {{ submitted ? 'Check your inbox.' : 'Forgot your password?' }}
    </h1>
    <p class="mt-5 text-base leading-7 text-[#657069]">
      {{
        submitted
          ? 'If an account exists for that email, a reset link is on its way.'
          : 'Enter your email and we’ll send you a link to set a new password.'
      }}
    </p>
    <UiFeedbackAlert v-if="errorMessage" tone="error" :message="errorMessage" class="mt-6" />
    <form
      v-if="!submitted"
      method="post"
      class="space-y-5"
      :class="errorMessage ? 'mt-5' : 'mt-9'"
      @submit.prevent="requestReset"
    >
      <UFormField label="Email address" name="email" required
        ><UInput
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="you@example.com"
          size="xl"
          leading-icon="i-lucide-mail"
          class="w-full"
          :ui="authInputUi"
          required
      /></UFormField>
      <UButton
        type="submit"
        size="xl"
        block
        class="!rounded-xl !bg-[#143e32] !py-3.5 !font-semibold !text-white hover:!bg-[#24563f]"
        :loading="pending"
        >Send reset link <UIcon name="i-lucide-arrow-right"
      /></UButton>
    </form>
    <NuxtLink
      to="/login"
      class="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-[#143e32] hover:underline"
      ><UIcon name="i-lucide-arrow-left" /> Back to login</NuxtLink
    >
  </AuthShell>
</template>
