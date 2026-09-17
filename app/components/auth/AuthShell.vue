<script setup lang="ts">
withDefaults(defineProps<{ mode?: 'login' | 'signup' | 'recovery' }>(), { mode: 'recovery' })
</script>

<template>
  <div class="min-h-screen bg-[#edf2e9] text-[#172f27] lg:p-3">
    <main
      class="mx-auto grid min-h-screen max-w-[1600px] lg:min-h-[calc(100vh-24px)] lg:grid-cols-[minmax(0,1fr)_minmax(480px,.92fr)] lg:gap-3"
      aria-label="Creda account access"
    >
      <aside
        class="relative hidden min-h-[720px] flex-col overflow-hidden rounded-[28px] bg-[#143e32] p-10 text-white lg:flex xl:p-14"
      >
        <img
          src="/images/business-owners.png"
          alt=""
          class="absolute inset-0 h-full w-full object-cover object-center opacity-40"
          width="1536"
          height="1024"
        />
        <div
          class="absolute inset-0 bg-gradient-to-b from-[#102f27]/90 via-[#143e32]/70 to-[#09251e]/95"
          aria-hidden="true"
        />
        <div class="relative z-10">
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2.5 text-[31px] font-extrabold leading-none tracking-[-.07em] text-white"
            aria-label="Creda home"
          >
            <span
              class="grid size-9 place-items-center rounded-full bg-[#d8f36a] text-[27px] text-[#143e32]"
              ><UIcon name="i-lucide-asterisk" /></span
            >creda<span class="-ml-2 text-[#d8f36a]">.</span>
          </NuxtLink>
        </div>
        <div class="relative z-10 my-auto max-w-[550px] py-20">
          <div
            class="mb-7 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-[11px] font-bold tracking-[.16em] text-[#e5f1dd] backdrop-blur-sm"
          >
            <span class="size-1.5 rounded-full bg-[#d8f36a]" /> A BETTER WAY TO DISCOVER
          </div>
          <h2
            class="text-[clamp(3.4rem,5vw,5.8rem)] font-semibold leading-[1.02] tracking-[-.075em]"
          >
            Good finds<br />start with <span class="font-normal italic text-[#d8f36a]">trust.</span>
          </h2>
          <p class="mt-7 max-w-[420px] text-base leading-7 text-white/80">
            Find businesses worth knowing. Share your experience. Help the next person choose with
            confidence.
          </p>
        </div>
        <div
          class="relative z-10 flex max-w-[390px] items-center gap-3 rounded-2xl border border-white/15 bg-white/15 p-4 backdrop-blur-xl"
        >
          <span
            class="grid size-11 shrink-0 place-items-center rounded-xl bg-[#d8f36a] text-xl text-[#143e32]"
            ><UIcon name="i-lucide-sparkles"
          /></span>
          <div>
            <p class="text-sm font-semibold">A little context. A lot more confidence.</p>
            <p class="mt-0.5 text-xs text-white/70">Starting with businesses in Nigeria.</p>
          </div>
        </div>
      </aside>

      <section
        class="flex min-h-screen flex-col bg-[#fcfcf8] px-5 py-6 sm:px-10 lg:min-h-0 lg:rounded-[28px] lg:bg-white lg:px-12 lg:py-9 xl:px-16"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="lg:hidden"><LandingLogo /></div>
          <NuxtLink
            to="/"
            class="hidden items-center gap-1.5 text-sm font-semibold text-[#587061] transition hover:text-[#143e32] lg:inline-flex"
            ><UIcon name="i-lucide-arrow-left" /> Back to explore</NuxtLink
          >
          <NuxtLink
            v-if="mode === 'login'"
            to="/signup"
            class="text-sm font-semibold text-[#143e32] hover:underline"
            >New here? <span class="underline underline-offset-4">Join Creda</span></NuxtLink
          >
          <NuxtLink
            v-else-if="mode === 'signup'"
            to="/login"
            class="text-sm font-semibold text-[#143e32] hover:underline"
            >Have an account? <span class="underline underline-offset-4">Log in</span></NuxtLink
          >
          <span
            v-else
            class="hidden text-xs font-semibold uppercase tracking-[.15em] text-[#819184] lg:block"
            >Your Creda account</span
          >
        </div>
        <div
          class="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-10 sm:py-14"
        >
          <slot />
        </div>
        <p class="text-center text-xs text-[#8b9a8e]">
          Good businesses deserve to be known. <span class="mx-1">·</span> Made for discovery in
          Nigeria.
        </p>
      </section>
    </main>
  </div>
</template>
