<script setup lang="ts">
import type { AdminOverview, AdminOverviewPeriod } from '~~/shared/admin'

useSeoMeta({ title: 'Admin overview — Creda', robots: 'noindex, nofollow' })
const days = ref<AdminOverviewPeriod>(7)
const { data, status, error, refresh } = await useFetch<AdminOverview>('/api/admin/overview', {
  query: { days },
})
const numberFormat = new Intl.NumberFormat('en-NG')
const dateFormat = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Lagos',
})
const periods: AdminOverviewPeriod[] = [7, 30]
const attentionCount = computed(() =>
  data.value
    ? data.value.attention.ownershipRequests +
      data.value.attention.businessReports +
      data.value.attention.reviewReports
    : 0,
)
const directoryRows = computed(() =>
  data.value
    ? [
        {
          label: 'Public listings',
          detail: 'Visible in the directory',
          value: data.value.businesses.public,
        },
        {
          label: 'Managed by members',
          detail: 'Have an account assigned as owner',
          value: data.value.businesses.managed,
        },
        {
          label: 'Verified businesses',
          detail: 'Ownership has been checked',
          value: data.value.businesses.verified,
        },
        {
          label: 'Curated listings',
          detail: 'Added by Creda and still unclaimed',
          value: data.value.businesses.curated,
        },
        {
          label: 'Suspended listings',
          detail: 'Currently hidden from the public',
          value: data.value.businesses.suspended,
        },
      ]
    : [],
)
const communityRows = computed(() =>
  data.value
    ? [
        {
          label: 'Verified email addresses',
          value: numberFormat.format(data.value.users.emailVerified),
        },
        { label: 'Business owners', value: numberFormat.format(data.value.users.businessOwners) },
        { label: 'Published reviews', value: numberFormat.format(data.value.reviews.published) },
        { label: 'Removed reviews', value: numberFormat.format(data.value.reviews.removed) },
        {
          label: 'Average published rating',
          value:
            data.value.reviews.averageRating === null
              ? 'No ratings yet'
              : `${data.value.reviews.averageRating.toFixed(1)} / 5`,
        },
      ]
    : [],
)
</script>

<template>
  <WorkspaceShell>
    <main
      class="mx-auto w-full max-w-6xl px-5 pb-20 pt-9 sm:px-8 sm:pt-14 xl:px-12"
      aria-labelledby="admin-heading"
    >
      <p class="text-xs font-medium text-[#79877c]">
        Administration <span class="mx-2 text-[#b4c0b4]">/</span> Overview
      </p>
      <div
        class="mt-7 flex flex-wrap items-end justify-between gap-6 border-b border-[#e4e9e0] pb-8"
      >
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[.19em] text-[#69836b]">
            THE BIG PICTURE
          </p>
          <h1
            id="admin-heading"
            class="mt-3 text-4xl font-semibold tracking-[-.06em] text-[#143e32] sm:text-5xl"
          >
            Creda at a glance<span class="text-[#a4c43e]">.</span>
          </h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-[#657069]">
            Your community, your directory, and what needs your attention.
          </p>
        </div>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          :loading="status === 'pending'"
          :disabled="status === 'pending'"
          class="!rounded-xl"
          @click="refresh()"
          >Refresh</UButton
        >
      </div>

      <div class="mt-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-sm font-semibold text-[#143e32]">Platform totals</h2>
          <p class="mt-1 text-xs text-[#79877c]">Period counts include today, in Lagos time.</p>
        </div>
        <div
          class="inline-flex rounded-xl border border-[#e0e7dc] bg-[#f0f4ec] p-1"
          role="group"
          aria-label="Activity period"
        >
          <button
            v-for="period in periods"
            :key="period"
            type="button"
            :aria-pressed="days === period"
            class="rounded-lg px-4 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#668b48]"
            :class="
              days === period
                ? 'bg-white text-[#143e32] shadow-sm'
                : 'text-[#6a796d] hover:text-[#143e32]'
            "
            @click="days = period"
          >
            {{ period }} days
          </button>
        </div>
      </div>

      <div
        v-if="status === 'pending'"
        class="mt-5 space-y-6"
        role="status"
        aria-label="Loading admin overview"
      >
        <span class="sr-only">Loading admin overview</span>
        <div class="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
          <div v-for="n in 4" :key="n" class="h-52 animate-pulse rounded-2xl bg-[#e8eee4]" />
        </div>
        <div class="h-48 animate-pulse rounded-2xl bg-[#e8eee4]" />
      </div>
      <UiFeedbackAlert
        v-else-if="error"
        tone="error"
        title="Overview could not be loaded"
        message="Please try again. Your businesses and account data have not changed."
        class="mt-5"
      >
        <UButton color="neutral" variant="soft" size="sm" class="mt-3" @click="refresh()"
          >Try again</UButton
        >
      </UiFeedbackAlert>
      <div v-else-if="data" class="mt-5 space-y-7">
        <div class="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Users"
            icon="i-lucide-users"
            :value="data.users.total"
            :added="data.users.added"
            :days="data.period.days"
            detail="Registered accounts"
          />
          <AdminMetricCard
            label="Businesses"
            icon="i-lucide-store"
            :value="data.businesses.total"
            :added="data.businesses.added"
            :days="data.period.days"
            detail="Includes curated and hidden listings"
          />
          <AdminMetricCard
            label="Reviews"
            icon="i-lucide-star"
            :value="data.reviews.total"
            :added="data.reviews.added"
            :days="data.period.days"
            detail="Includes all review statuses"
          />
          <AdminMetricCard
            label="Saves"
            icon="i-lucide-bookmark"
            :value="data.saves.total"
            :added="data.saves.added"
            :days="data.period.days"
            detail="Bookmarks people currently keep"
          />
        </div>

        <section
          class="overflow-hidden rounded-2xl border border-[#dfe6dc] bg-white"
          aria-labelledby="attention-heading"
        >
          <div class="flex items-center gap-3 border-b border-[#edf0e9] p-5 sm:px-7">
            <span
              class="grid size-10 shrink-0 place-items-center rounded-xl"
              :class="attentionCount ? 'bg-amber-50 text-amber-700' : 'bg-[#eef5e8] text-[#426a46]'"
              ><UIcon
                :name="attentionCount ? 'i-lucide-inbox' : 'i-lucide-circle-check'"
                class="size-5"
            /></span>
            <div>
              <h2 id="attention-heading" class="font-semibold text-[#143e32]">
                {{ attentionCount ? 'Needs your attention' : 'You’re all caught up' }}
              </h2>
              <p class="mt-1 text-xs leading-5 text-[#758377]">
                {{
                  attentionCount
                    ? 'Open requests and reports across Creda.'
                    : 'No ownership requests or content reports are waiting.'
                }}
              </p>
            </div>
          </div>
          <div class="grid divide-y divide-[#edf0e9] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <NuxtLink
              to="/admin/verification"
              class="group flex items-center justify-between gap-4 px-5 py-6 transition hover:bg-[#f7faf3] sm:px-7"
              ><div>
                <p class="text-sm font-medium text-[#143e32]">Ownership checks</p>
                <p class="mt-1 text-xs text-[#758377]">Requests awaiting a decision</p>
              </div>
              <span
                class="flex items-center gap-4 text-2xl font-semibold tabular-nums text-[#143e32]"
                >{{ numberFormat.format(data.attention.ownershipRequests)
                }}<UIcon
                  name="i-lucide-arrow-up-right"
                  class="size-4 text-[#789079] transition group-hover:text-[#143e32]" /></span
            ></NuxtLink>
            <NuxtLink
              to="/admin/reports"
              class="group flex items-center justify-between gap-4 px-5 py-6 transition hover:bg-[#f7faf3] sm:px-7"
              ><div>
                <p class="text-sm font-medium text-[#143e32]">Content reports</p>
                <p class="mt-1 text-xs text-[#758377]">
                  {{ numberFormat.format(data.attention.businessReports) }} business ·
                  {{ numberFormat.format(data.attention.reviewReports) }} review
                </p>
              </div>
              <span
                class="flex items-center gap-4 text-2xl font-semibold tabular-nums text-[#143e32]"
                >{{
                  numberFormat.format(
                    data.attention.businessReports + data.attention.reviewReports,
                  )
                }}<UIcon
                  name="i-lucide-arrow-up-right"
                  class="size-4 text-[#789079] transition group-hover:text-[#143e32]" /></span
            ></NuxtLink>
          </div>
        </section>

        <div class="grid gap-6 xl:grid-cols-2">
          <section
            class="rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-7"
            aria-labelledby="directory-heading"
          >
            <h2 id="directory-heading" class="text-lg font-semibold text-[#143e32]">
              The directory
            </h2>
            <p class="mt-1 text-xs leading-5 text-[#758377]">
              Current listing status and ownership.
            </p>
            <dl class="mt-5 divide-y divide-[#edf0e9]">
              <div
                v-for="row in directoryRows"
                :key="row.label"
                class="flex items-center justify-between gap-4 py-4"
              >
                <dt>
                  <p class="text-sm font-medium text-[#3d5846]">{{ row.label }}</p>
                  <p class="mt-1 text-xs text-[#7b887d]">{{ row.detail }}</p>
                </dt>
                <dd class="text-lg font-semibold tabular-nums text-[#143e32]">
                  {{ numberFormat.format(row.value) }}
                </dd>
              </div>
            </dl>
          </section>
          <section
            class="rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-7"
            aria-labelledby="community-heading"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 id="community-heading" class="text-lg font-semibold text-[#143e32]">
                  The community
                </h2>
                <p class="mt-1 text-xs leading-5 text-[#758377]">
                  Accounts and the experiences they share.
                </p>
              </div>
              <UButton
                to="/admin/reviews"
                color="neutral"
                variant="ghost"
                icon="i-lucide-arrow-up-right"
                aria-label="Manage reviews"
              />
            </div>
            <dl class="mt-5 divide-y divide-[#edf0e9]">
              <div
                v-for="row in communityRows"
                :key="row.label"
                class="flex items-center justify-between gap-4 py-5"
              >
                <dt class="text-sm text-[#3d5846]">{{ row.label }}</dt>
                <dd class="text-sm font-semibold tabular-nums text-[#143e32]">{{ row.value }}</dd>
              </div>
            </dl>
          </section>
        </div>
        <p class="text-xs leading-5 text-[#879288]">
          Updated {{ dateFormat.format(new Date(data.generatedAt)) }} WAT. Counts reflect records
          currently stored; deleted records are not included.
        </p>
      </div>
    </main>
  </WorkspaceShell>
</template>
