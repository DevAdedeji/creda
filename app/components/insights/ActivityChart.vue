<script setup lang="ts">
import type { BusinessInsights } from '~~/shared/insights'
const props = defineProps<{ activity: BusinessInsights['activity'] }>()
const maximum = computed(() =>
  Math.max(1, ...props.activity.flatMap((day) => [day.views, day.clicks])),
)
const hasActivity = computed(() => props.activity.some((day) => day.views || day.clicks))
const firstDay = computed(() => props.activity[0]?.date)
const lastDay = computed(() => props.activity.at(-1)?.date)
const columnWidth = computed(() => 600 / Math.max(1, props.activity.length))
const dateLabel = (day: string) =>
  new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${day}T00:00:00Z`),
  )
</script>

<template>
  <section
    class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8"
    aria-labelledby="insights-activity-heading"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 id="insights-activity-heading" class="text-lg font-semibold text-[#143e32]">
          Activity over time
        </h2>
        <p class="mt-1 text-sm text-[#657069]">A daily look at discovery and the next step.</p>
      </div>
      <div class="flex gap-4 text-xs text-[#657069]" aria-hidden="true">
        <span class="flex items-center gap-2"
          ><span class="size-2 rounded-full bg-[#143e32]" />Page views</span
        ><span class="flex items-center gap-2"
          ><span class="size-2 rounded-full bg-[#a6c76a]" />Link clicks</span
        >
      </div>
    </div>
    <div v-if="!hasActivity" class="flex min-h-52 flex-col items-center justify-center text-center">
      <UIcon name="i-lucide-chart-no-axes-combined" class="size-9 text-[#8ba17c]" />
      <p class="mt-3 font-semibold text-[#315b3a]">Your next visit starts the story.</p>
      <p class="mt-2 max-w-sm text-sm leading-6 text-[#657069]">
        Share your business page. Views and link clicks will appear here as people explore.
      </p>
    </div>
    <div v-else class="mt-7">
      <svg
        viewBox="0 0 640 190"
        class="w-full"
        role="img"
        aria-label="Daily page views and link clicks. Exact values are in the accompanying table."
      >
        <line x1="30" y1="160" x2="635" y2="160" stroke="#e4e9e0" />
        <line x1="30" y1="20" x2="635" y2="20" stroke="#edf0e9" stroke-dasharray="4 4" />
        <text x="22" y="24" text-anchor="end" fill="#657069" font-size="10">{{ maximum }}</text>
        <text x="22" y="163" text-anchor="end" fill="#657069" font-size="10">0</text>
        <g v-for="(day, index) in activity" :key="day.date">
          <title>{{ dateLabel(day.date) }}: {{ day.views }} views, {{ day.clicks }} clicks</title>
          <rect
            :x="32 + index * columnWidth + columnWidth * 0.12"
            :y="160 - (day.views / maximum) * 140"
            :width="columnWidth * 0.32"
            :height="(day.views / maximum) * 140"
            rx="2"
            fill="#143e32"
          />
          <rect
            :x="32 + index * columnWidth + columnWidth * 0.5"
            :y="160 - (day.clicks / maximum) * 140"
            :width="columnWidth * 0.32"
            :height="(day.clicks / maximum) * 140"
            rx="2"
            fill="#a6c76a"
          />
        </g>
        <text x="32" y="183" fill="#657069" font-size="11">
          {{ firstDay && dateLabel(firstDay) }}
        </text>
        <text x="633" y="183" text-anchor="end" fill="#657069" font-size="11">
          {{ lastDay && dateLabel(lastDay) }}
        </text>
      </svg>
      <details class="mt-3 text-xs text-[#657069]">
        <summary class="w-fit cursor-pointer rounded px-1 py-2 font-semibold text-[#315b3a]">
          View daily numbers
        </summary>
        <div class="mt-3 max-h-56 overflow-auto rounded-xl border border-[#e4e9e0]">
          <table class="w-full text-left">
            <caption class="sr-only">
              Daily activity, UTC
            </caption>
            <thead class="sticky top-0 bg-[#f6f8f2]">
              <tr>
                <th scope="col" class="p-3">Date (UTC)</th>
                <th scope="col" class="p-3">Page views</th>
                <th scope="col" class="p-3">Link clicks</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in activity" :key="day.date" class="border-t border-[#edf0e9]">
                <th scope="row" class="p-3 font-normal">{{ dateLabel(day.date) }}</th>
                <td class="p-3">{{ day.views }}</td>
                <td class="p-3">{{ day.clicks }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  </section>
</template>
