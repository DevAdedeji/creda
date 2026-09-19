<script setup lang="ts">
import AuthShell from '@/components/auth/AuthShell.vue'
import PasswordInput from '@/components/auth/PasswordInput.vue'
import { authInputUi } from '@/utils/authInputUi'
import { authClient } from '~~/lib/auth-client'

useSeoMeta({
  title: 'Log in — Creda',
  description: 'Log in to Creda with your email or Google account.',
  robots: 'noindex, nofollow',
})

const { data: session } = await authClient.useSession(useFetch)
const returnToQuery = useRoute().query.returnTo
const returnTo =
  typeof returnToQuery === 'string' &&
  returnToQuery.startsWith('/') &&
  !returnToQuery.startsWith('//') &&
  !returnToQuery.includes('://')
    ? returnToQuery
    : '/account'
const googleNewUserCallback = `/account?signup=google&returnTo=${encodeURIComponent(returnTo)}`
if (session.value) await navigateTo(returnTo)

const route = useRoute()
const email = ref('')
const needsVerification = ref(false)
const resending = ref(false)
const password = ref('')
const pending = ref(false)
const errorMessage = ref('')
const appToast = useAppToast()

onMounted(() => {
  if (route.query.reset !== '1') return
  appToast.success('Password changed', 'Log in with your new password.')
  const { reset: _reset, ...query } = route.query
  void navigateTo({ path: route.path, query }, { replace: true })
})

async function logIn() {
  if (pending.value) return
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await authClient.signIn.email({
      email: email.value.trim().toLowerCase(),
      password: password.value,
    })
    if (result.error) {
      needsVerification.value = result.error.status === 403
      errorMessage.value = needsVerification.value
        ? 'Verify your email before logging in. Check your inbox for a link.'
        : 'That email and password combination did not work.'
      return
    }
    await navigateTo(returnTo)
  } catch {
    errorMessage.value = 'Something went wrong. Please try again.'
  } finally {
    pending.value = false
  }
}

async function resendVerification() {
  if (resending.value || !email.value) return
  resending.value = true
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
    resending.value = false
  }
}

async function continueWithGoogle() {
  if (pending.value) return
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL: returnTo,
      newUserCallbackURL: googleNewUserCallback,
    })
    if (result.error) errorMessage.value = 'Google sign-in could not start. Please try again.'
  } catch {
    errorMessage.value = 'Google sign-in could not start. Please try again.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthShell>
    <div class="mb-8">
      <span
        class="inline-flex items-center gap-2 rounded-full bg-[#ecf5e5] px-3 py-1.5 text-[11px] font-bold tracking-[.12em] text-[#356746]"
        ><UIcon name="i-lucide-sparkles" /> GOOD TO SEE YOU</span
      >
      <h1
        class="mt-5 text-[clamp(2.6rem,5vw,3.6rem)] font-semibold leading-[1.08] tracking-[-.065em] text-[#143e32]"
      >
        Welcome back<span class="text-[#a4c552]">.</span>
      </h1>
      <p class="mt-3 text-[15px] leading-7 text-[#657069]">
        Pick up where you left off and keep discovering.
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
      class="my-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.12em] text-[#93a092]"
    >
      <span class="h-px flex-1 bg-[#dfe6dc]" /> or with email
      <span class="h-px flex-1 bg-[#dfe6dc]" />
    </div>

    <UiFeedbackAlert v-if="errorMessage" tone="error" :message="errorMessage" class="mb-5" />
    <UButton
      v-if="needsVerification"
      color="neutral"
      variant="soft"
      class="mb-5 !rounded-xl !bg-[#edf1ea]"
      :loading="resending"
      @click="resendVerification"
      >Send another verification link</UButton
    >

    <form method="post" class="space-y-5" @submit.prevent="logIn">
      <UFormField
        label="Email address"
        name="email"
        required
        :ui="{ label: 'font-semibold text-[#293d32]' }"
      >
        <UInput
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
        />
      </UFormField>
      <UFormField
        label="Password"
        name="password"
        required
        :ui="{ label: 'font-semibold text-[#293d32]' }"
      >
        <PasswordInput
          v-model="password"
          name="password"
          autocomplete="current-password"
          placeholder="Enter your password"
          required
        />
      </UFormField>
      <div class="-mt-1 text-right">
        <NuxtLink to="/forgot-password" class="text-sm font-semibold text-[#315f42] hover:underline"
          >Forgot password?</NuxtLink
        >
      </div>
      <UButton
        type="submit"
        size="xl"
        block
        class="!h-12 !justify-center !rounded-xl !bg-[#143e32] !text-[15px] !font-semibold !text-white hover:!bg-[#24563f]"
        :loading="pending"
        >Log in <UIcon name="i-lucide-arrow-right" class="ml-1"
      /></UButton>
      <p class="pt-5 text-center text-sm text-[#657069]">
        New to Creda?
        <NuxtLink
          to="/signup"
          class="font-semibold text-[#143e32] underline underline-offset-4 hover:text-[#315f42]"
          >Create an account</NuxtLink
        >
      </p>
    </form>
  </AuthShell>
</template>
