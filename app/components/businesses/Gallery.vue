<script setup lang="ts">
defineOptions({ inheritAttrs: false })
const props = defineProps<{
  images: string[]
  businessName: string
  compact?: boolean
}>()

const open = ref(false)
const activeIndex = ref(0)
const lastTrigger = shallowRef<HTMLButtonElement | null>(null)
const activeImage = computed(() => props.images[activeIndex.value])
let touchStartX = 0
let touchStartY = 0

function openPhoto(index: number, event: MouseEvent) {
  lastTrigger.value = event.currentTarget as HTMLButtonElement
  activeIndex.value = index
  open.value = true
}

function move(direction: -1 | 1) {
  if (props.images.length < 2) return
  activeIndex.value = (activeIndex.value + direction + props.images.length) % props.images.length
}

function onKeydown(event: KeyboardEvent) {
  if (!open.value || event.altKey || event.ctrlKey || event.metaKey) return
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    move(1)
  }
}

function onTouchStart(event: TouchEvent) {
  touchStartX = event.changedTouches[0]?.clientX ?? 0
  touchStartY = event.changedTouches[0]?.clientY ?? 0
}

function onTouchEnd(event: TouchEvent) {
  const touch = event.changedTouches[0]
  if (!touch || props.images.length < 2) return
  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
    move(deltaX < 0 ? 1 : -1)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

function restoreFocus() {
  lastTrigger.value?.focus()
}
</script>

<template>
  <div
    v-bind="$attrs"
    :class="
      compact
        ? 'grid grid-cols-[repeat(2,minmax(0,72px))] gap-3'
        : 'grid grid-cols-2 gap-3 sm:grid-cols-3'
    "
  >
    <button
      v-for="(url, index) in images"
      :key="`${url}-${index}`"
      type="button"
      :aria-label="`View photo ${index + 1} of ${businessName}`"
      class="group aspect-square w-full overflow-hidden rounded-xl bg-[#edf3e7] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315b3a]"
      @click="openPhoto(index, $event)"
    >
      <NuxtImg
        :src="url"
        :alt="`${businessName} gallery photo ${index + 1}`"
        loading="lazy"
        width="256"
        height="256"
        format="webp"
        class="size-full object-cover transition duration-300 group-hover:scale-105"
      />
    </button>
  </div>

  <UModal
    v-model:open="open"
    :close="false"
    :title="`${businessName} photos`"
    :description="`Photo ${activeIndex + 1} of ${images.length}. Use the arrow keys to browse.`"
    :ui="{
      overlay: '!bg-[#081811]/80 backdrop-blur-sm',
      content:
        '!w-[calc(100vw-2rem)] !max-w-[90%] !bg-transparent !text-white !shadow-none !ring-0',
    }"
    @after:leave="restoreFocus"
  >
    <template #content="{ close }">
      <div
        class="flex h-[calc(100dvh-2rem)] min-h-0 flex-col pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:h-[calc(100dvh-4rem)] sm:pt-4"
      >
        <div class="flex shrink-0 items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold sm:text-base">{{ businessName }}</p>
            <p class="mt-1 text-xs text-white/65">
              Photo {{ activeIndex + 1 }} of {{ images.length }}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close photo viewer"
            class="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            @click="close"
          >
            <UIcon name="i-lucide-x" class="text-xl" />
          </button>
        </div>

        <div
          class="relative flex min-h-0 flex-1 items-center justify-center py-5 sm:py-8"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
        >
          <NuxtImg
            v-if="activeImage"
            :key="activeImage"
            :src="activeImage"
            :alt="`${businessName} gallery photo ${activeIndex + 1}`"
            width="1600"
            densities="x1"
            format="webp"
            class="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          />
          <template v-if="images.length > 1">
            <button
              type="button"
              aria-label="Previous photo"
              class="absolute left-0 grid size-11 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-4 sm:size-12"
              @click="move(-1)"
            >
              <UIcon name="i-lucide-chevron-left" class="text-2xl" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              class="absolute right-0 grid size-11 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-4 sm:size-12"
              @click="move(1)"
            >
              <UIcon name="i-lucide-chevron-right" class="text-2xl" />
            </button>
          </template>
        </div>

        <div
          v-if="images.length > 1"
          class="flex shrink-0 items-center justify-center gap-2"
          aria-label="Choose photo"
          role="group"
        >
          <button
            v-for="(_, index) in images"
            :key="index"
            type="button"
            :aria-label="`Show photo ${index + 1}`"
            :aria-current="activeIndex === index ? 'true' : undefined"
            class="group grid size-9 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            @click="activeIndex = index"
          >
            <span
              class="size-2.5 rounded-full bg-white/35 transition group-hover:bg-white/70"
              :class="activeIndex === index ? '!bg-white' : ''"
            />
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>
