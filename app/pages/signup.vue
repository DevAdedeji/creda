<script setup lang="ts">
import AuthShell from '@/components/auth/AuthShell.vue'
import PasswordInput from '@/components/auth/PasswordInput.vue'
import { authInputUi } from '@/utils/authInputUi'
import { trackAnalyticsEvent } from '@/utils/analytics'
import { authClient } from '~~/lib/auth-client'

useSeoMeta({
  title: 'Join Creda',
  description: 'Create a Creda account with email or Google.',
  robots: 'noindex, nofollow',
})
const { data: session } = await authClient.useSession(useFetch)
if (session.value) await navigateTo('/account')

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const pending = ref(false)
const sendingVerification = ref(false)
const registered = ref(false)
const errorMessage = ref('')
const appToast = useAppToast()

async function createAccount() {
  if (pending.value) return
  trackAnalyticsEvent('signup_attempted', { method: 'email' })
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'The passwords do not match.'
    return
  }
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await authClient.signUp.email({
      name: name.value.trim(),
      email: email.value.trim().toLowerCase(),
      password: password.value,
      callbackURL: '/account',
    })
    if (result.error) {
      errorMessage.value = 'We could not create your account. Check the details and try again.'
      return
    }
    trackAnalyticsEvent('signup_completed', { method: 'email' })
    registered.value = true
    password.value = ''
    confirmPassword.value = ''
  } catch {
    errorMessage.value = 'Something went wrong. Please try again.'
  } finally {
    pending.value = false
  }
}

async function resendVerification() {
  if (sendingVerification.value) return
  sendingVerification.value = true
  try {
    const result = await authClient.sendVerificationEmail({
      email: email.value.trim().toLowerCase(),
      callbackURL: '/account',
    })
    if (result.error) appToast.error('Could not send another link', 'Please try again.')
    else appToast.success('Verification link sent', 'Check your inbox for the new link.')
  } catch {
    appToast.error('Could not send another link', 'Please try again.')
  } finally {
    sendingVerification.value = false
  }
}

async function continueWithGoogle() {
  if (pending.value) return
  trackAnalyticsEvent('signup_attempted', { method: 'google' })
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/account',
      newUserCallbackURL: '/account?signup=google',
    })
    if (result.error) errorMessage.value = 'Google sign-up could not start. Please try again.'
  } catch {
    errorMessage.value = 'Google sign-up could not start. Please try again.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthShell>
    <template v-if="registered">
      <div
        class="mb-7 grid size-16 place-items-center rounded-2xl bg-[#d8f36a] text-3xl text-[#143e32]"
      >
        <UIcon name="i-lucide-mail-check" />
      </div>
      <span class="text-[11px] font-bold tracking-[.15em] text-[#406a4a]">ONE QUICK CHECK</span>
      <h1
        class="mt-4 text-[clamp(2.6rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-.065em] text-[#143e32]"
      >
        Check your inbox<span class="text-[#a4c552]">.</span>
      </h1>
      <p class="mt-5 text-[15px] leading-7 text-[#657069]">
        We sent a verification link to
        <strong class="text-[#143e32]">{{ email.trim().toLowerCase() }}</strong
        >. Open it to activate your account.
      </p>
      <UButton
        :loading="sendingVerification"
        color="primary"
        size="xl"
        block
        class="mt-8 !h-12 !justify-center !rounded-xl !bg-[#143e32] !text-[15px] !font-semibold !text-white hover:!bg-[#24563f]"
        @click="resendVerification"
        >Send another link</UButton
      >
      <p class="mt-7 text-sm text-[#657069]">
        Already verified?
        <NuxtLink to="/login" class="font-semibold text-[#143e32] hover:underline">Log in</NuxtLink>
      </p>
    </template>
    <template v-else>
      <div class="mb-7">
        <span
          class="inline-flex items-center gap-2 rounded-full bg-[#ecf5e5] px-3 py-1.5 text-[11px] font-bold tracking-[.12em] text-[#356746]"
          ><UIcon name="i-lucide-sparkles" /> YOUR NEXT GOOD FIND STARTS HERE</span
        >
        <h1
          class="mt-5 text-[clamp(2.55rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-.065em] text-[#143e32]"
        >
          Join the curious<span class="text-[#a4c552]">.</span>
        </h1>
        <p class="mt-3 text-[15px] leading-7 text-[#657069]">
          Find businesses worth knowing and help others discover them too.
        </p>
      </div>

      <UButton
        size="xl"
        block
        color="neutral"
        variant="outline"
        class="!h-12 !justify-center !rounded-xl !border-[#d6e0d4] !bg-white !text-[15px] !font-semibold !text-[#172f27] !shadow-sm hover:!bg-[#f4f8f1]"
        :loading="pending"
        @click="continueWithGoogle"
      >
        <span
          v-if="!pending"
          class="mr-2 grid size-6 place-items-center rounded-full text-[19px] font-bold text-[#4285f4]"
          >G</span
        >
        Continue with Google
      </UButton>

      <div
        class="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.12em] text-[#93a092]"
      >
        <span class="h-px flex-1 bg-[#dfe6dc]" /> or with email
        <span class="h-px flex-1 bg-[#dfe6dc]" />
      </div>

      <UiFeedbackAlert v-if="errorMessage" tone="error" :message="errorMessage" class="mb-5" />

      <form method="post" class="space-y-4" @submit.prevent="createAccount">
        <UFormField
          label="Your name"
          name="name"
          required
          :ui="{ label: 'font-semibold text-[#293d32]' }"
          ><UInput
            v-model="name"
            type="text"
            name="name"
            autocomplete="name"
            placeholder="What should we call you?"
            size="xl"
            leading-icon="i-lucide-user-round"
            class="w-full"
            :ui="authInputUi"
            required
        /></UFormField>
        <UFormField
          label="Email address"
          name="email"
          required
          :ui="{ label: 'font-semibold text-[#293d32]' }"
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
        <UFormField
          label="Password"
          name="password"
          required
          :ui="{ label: 'font-semibold text-[#293d32]' }"
          ><PasswordInput
            v-model="password"
            name="password"
            autocomplete="new-password"
            placeholder="At least 8 characters"
            required
            :minlength="8"
            :maxlength="128"
        /></UFormField>
        <UFormField
          label="Confirm password"
          name="confirmPassword"
          required
          :ui="{ label: 'font-semibold text-[#293d32]' }"
          ><PasswordInput
            v-model="confirmPassword"
            name="confirmPassword"
            autocomplete="new-password"
            placeholder="Enter your password again"
            leading-icon="i-lucide-shield-check"
            required
            :minlength="8"
            :maxlength="128"
        /></UFormField>
        <UButton
          type="submit"
          size="xl"
          block
          class="!mt-6 !h-12 !justify-center !rounded-xl !bg-[#143e32] !text-[15px] !font-semibold !text-white hover:!bg-[#24563f]"
          :loading="pending"
          >Create my account <UIcon name="i-lucide-arrow-right" class="ml-1"
        /></UButton>
        <p class="pt-5 text-center text-sm text-[#657069]">
          Have an account?
          <NuxtLink
            to="/login"
            class="font-semibold text-[#143e32] underline underline-offset-4 hover:text-[#315f42]"
            >Log in</NuxtLink
          >
        </p>
      </form>
    </template>
  </AuthShell>
</template>
