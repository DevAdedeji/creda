<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'

useSeoMeta({ title: 'Your account — Creda', robots: 'noindex, nofollow' })

const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')

const signingOut = ref(false)
async function signOut() {
  signingOut.value = true
  try {
    await authClient.signOut()
    await navigateTo('/')
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#fcfcf8] text-[#172f27]">
    <LandingHeader />
    <main
      v-if="session"
      class="container max-w-4xl py-16 sm:py-24"
      aria-labelledby="account-heading"
    >
      <p class="mb-3 text-xs font-bold tracking-[.18em] text-[#406a4a]">YOUR SPACE ON CREDA</p>
      <h1 id="account-heading" class="text-4xl font-semibold tracking-[-.055em] sm:text-5xl">
        Good to see you, {{ session.user.name.split(' ')[0] }}.
      </h1>
      <p class="mt-5 max-w-xl text-base leading-7 text-[#657069]">
        Your account is ready. Soon you’ll be able to review businesses and manage your own profile
        from here.
      </p>
      <section
        class="mt-12 overflow-hidden rounded-2xl border border-[#dfe6dc] bg-white"
        aria-labelledby="profile-heading"
      >
        <div class="flex flex-wrap items-center gap-5 p-7 sm:p-9">
          <img
            v-if="session.user.image"
            :src="session.user.image"
            alt=""
            referrerpolicy="no-referrer"
            class="size-16 rounded-full object-cover"
            width="64"
            height="64"
          />
          <span
            v-else
            class="grid size-16 place-items-center rounded-full bg-[#d8f36a] text-2xl font-bold text-[#143e32]"
            >{{ session.user.name.charAt(0).toUpperCase() }}</span
          >
          <div>
            <h2 id="profile-heading" class="text-xl font-bold">{{ session.user.name }}</h2>
            <p class="mt-1 text-sm text-[#657069]">{{ session.user.email }}</p>
          </div>
          <span
            class="ml-auto rounded-full px-3 py-1.5 text-xs font-semibold"
            :class="
              session.user.emailVerified
                ? 'bg-[#eff5e7] text-[#2c6748]'
                : 'bg-amber-50 text-amber-800'
            "
            >{{ session.user.emailVerified ? 'Email verified' : 'Email not verified' }}</span
          >
        </div>
        <div class="border-t border-[#dfe6dc] bg-[#f8faf5] px-7 py-5 sm:px-9">
          <p class="flex items-center gap-2 text-sm text-[#536859]">
            <UIcon name="i-lucide-circle-check" class="text-lg" /> Signed in and ready to explore
          </p>
        </div>
      </section>
      <p v-if="!session.user.emailVerified" class="mt-5 text-sm text-[#7a6334]">
        Email verification will be required before you can publish reviews.
      </p>
      <div class="mt-8 flex flex-wrap gap-4">
        <UButton
          to="/"
          size="lg"
          trailing-icon="i-lucide-arrow-up-right"
          class="!rounded-lg !bg-[#143e32] !text-white"
          >Explore Creda</UButton
        ><UButton
          size="lg"
          color="neutral"
          variant="outline"
          :loading="signingOut"
          class="!rounded-lg"
          @click="signOut"
          >Sign out</UButton
        >
      </div>
    </main>
  </div>
</template>
