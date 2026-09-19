<script setup lang="ts">
type FeedbackTone = 'error' | 'success' | 'warning' | 'info'

const props = withDefaults(
  defineProps<{ tone?: FeedbackTone; title?: string; message?: string }>(),
  { tone: 'info', title: undefined, message: undefined },
)

const toneStyles: Record<FeedbackTone, { box: string; icon: string; name: string }> = {
  error: {
    box: 'border-red-200 bg-red-50 text-red-800',
    icon: 'text-red-600',
    name: 'i-lucide-circle-alert',
  },
  success: {
    box: 'border-[#cfe3c4] bg-[#eef7e8] text-[#315b3a]',
    icon: 'text-[#3d7448]',
    name: 'i-lucide-circle-check',
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'text-amber-700',
    name: 'i-lucide-triangle-alert',
  },
  info: {
    box: 'border-[#d9e5d5] bg-[#f3f8ef] text-[#45614d]',
    icon: 'text-[#4e7356]',
    name: 'i-lucide-info',
  },
}

const styles = computed(() => toneStyles[props.tone])
</script>

<template>
  <div
    :role="tone === 'error' ? 'alert' : 'status'"
    :aria-live="tone === 'error' ? 'assertive' : 'polite'"
    aria-atomic="true"
    class="flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm"
    :class="styles.box"
  >
    <UIcon :name="styles.name" class="mt-0.5 size-5 shrink-0" :class="styles.icon" />
    <div class="min-w-0 flex-1">
      <p v-if="title" class="font-semibold">{{ title }}</p>
      <p v-if="message" :class="title ? 'mt-1 leading-6' : 'leading-6'">{{ message }}</p>
      <slot />
    </div>
  </div>
</template>
