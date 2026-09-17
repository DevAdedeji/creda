<script setup lang="ts">
import { authClient } from '~~/lib/auth-client'

useSeoMeta({ title: 'My account — Creda', robots: 'noindex, nofollow' })
const { data: session } = await authClient.useSession(useFetch)
if (!session.value) await navigateTo('/login')
</script>

<template>
  <WorkspaceShell>
    <main v-if="session" class="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16 xl:px-12">
      <p class="text-xs font-medium text-[#79877c]">
        Your space <span class="mx-2 text-[#b4c0b4]">/</span> My account
      </p>
      <div class="mt-7 border-b border-[#e4e9e0] pb-8">
        <h1 class="text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl">
          My account<span class="text-[#a4c43e]">.</span>
        </h1>
        <p class="mt-3 text-sm leading-6 text-[#657069] sm:text-base">
          The details connected to your Creda account.
        </p>
      </div>

      <section class="mt-8 max-w-3xl overflow-hidden rounded-2xl border border-[#dfe6dc] bg-white">
        <div class="flex items-center gap-4 border-b border-[#edf0e9] p-6 sm:p-8">
          <img
            v-if="session.user.image"
            :src="session.user.image"
            alt=""
            referrerpolicy="no-referrer"
            class="size-14 rounded-xl object-cover"
            width="56"
            height="56"
          />
          <span
            v-else
            class="grid size-14 place-items-center rounded-xl bg-[#d8f36a] text-xl font-bold text-[#143e32]"
          >
            {{ session.user.name.charAt(0).toUpperCase() }}
          </span>
          <div class="min-w-0">
            <h2 class="truncate text-xl font-semibold text-[#143e32]">{{ session.user.name }}</h2>
            <p class="mt-0.5 text-sm text-[#758577]">Creda member</p>
          </div>
        </div>
        <dl class="divide-y divide-[#edf0e9] px-6 sm:px-8">
          <div class="grid gap-2 py-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
            <dt class="text-sm font-medium text-[#738276]">Full name</dt>
            <dd class="min-w-0 break-words text-sm font-semibold text-[#243d30]">
              {{ session.user.name }}
            </dd>
          </div>
          <div class="grid gap-2 py-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
            <dt class="text-sm font-medium text-[#738276]">Email address</dt>
            <dd class="min-w-0 break-all text-sm font-semibold text-[#243d30]">
              {{ session.user.email }}
            </dd>
          </div>
          <div class="grid gap-2 py-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
            <dt class="text-sm font-medium text-[#738276]">Email verification</dt>
            <dd>
              <span
                class="inline-flex items-center gap-2 text-sm font-semibold"
                :class="session.user.emailVerified ? 'text-[#36724b]' : 'text-[#9a7032]'"
              >
                <UIcon
                  :name="
                    session.user.emailVerified ? 'i-lucide-circle-check' : 'i-lucide-mail-warning'
                  "
                  class="text-lg"
                />
                {{ session.user.emailVerified ? 'Verified' : 'Check your inbox' }}
              </span>
              <p v-if="!session.user.emailVerified" class="mt-2 text-xs leading-5 text-[#758577]">
                Verify your email before listing a business.
              </p>
            </dd>
          </div>
        </dl>
      </section>
    </main>
  </WorkspaceShell>
</template>
