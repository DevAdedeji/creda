<script setup lang="ts">
import { apiErrorMessage } from '@/utils/apiError'
import { MAX_REVIEW_PHOTOS, MAX_REVIEW_PHOTO_BYTES, type ReviewPhotoDraft } from '~~/shared/reviews'

const photos = defineModel<ReviewPhotoDraft[]>({ required: true })
const props = defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ uploading: [value: boolean] }>()
const input = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const error = ref('')
const progress = ref('')
interface PendingPhoto {
  id: number
  file: File
  preview: string
  uploading: boolean
}
const pending = ref<PendingPhoto[]>([])
const previews = ref<Record<string, string>>({})
const selectedCount = computed(() => photos.value.length + pending.value.length)
let nextPhotoId = 0
const labelId = useId()
const hintId = useId()
let disposed = false
let controller: AbortController | null = null

function removePhoto(index: number) {
  if (busy.value || props.disabled) return
  const photo = photos.value[index]
  if (photo && previews.value[photo.url]) {
    URL.revokeObjectURL(previews.value[photo.url]!)
    delete previews.value[photo.url]
  }
  photos.value = photos.value.filter((_, photoIndex) => photoIndex !== index)
  error.value = ''
  progress.value = ''
}

async function uploadPhotos(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files ?? [])
  target.value = ''
  if (!files.length || busy.value || props.disabled) return
  error.value = ''
  if (photos.value.length + files.length > MAX_REVIEW_PHOTOS) {
    error.value = `You can add up to ${MAX_REVIEW_PHOTOS} photos to a review.`
    return
  }
  if (files.some((file) => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))) {
    error.value = 'Choose PNG, JPEG or WebP photos.'
    return
  }
  if (files.some((file) => !file.size || file.size > MAX_REVIEW_PHOTO_BYTES)) {
    error.value = 'Choose non-empty photos up to 5 MB each.'
    return
  }

  // Preview the entire selection immediately; upload each file without replacing its local preview.
  pending.value = files.map((file) => ({
    id: nextPhotoId++,
    file,
    preview: URL.createObjectURL(file),
    uploading: false,
  }))
  busy.value = true
  emit('uploading', true)
  controller = new AbortController()
  const failures: string[] = []
  try {
    for (const [index, photo] of [...pending.value].entries()) {
      if (disposed) return
      photo.uploading = true
      progress.value = `Uploading photo ${index + 1} of ${files.length}…`
      const body = new FormData()
      body.append('image', photo.file)
      try {
        const uploaded = await $fetch<{ url: string; proof: string }>('/api/reviews/images', {
          method: 'POST',
          body,
          signal: controller.signal,
        })
        if (disposed) return
        previews.value[uploaded.url] = photo.preview
        photos.value = [...photos.value, uploaded]
      } catch (cause) {
        if (disposed) return
        URL.revokeObjectURL(photo.preview)
        failures.push(apiErrorMessage(cause, 'Your photo could not be uploaded. Please try again.'))
      }
      pending.value = pending.value.filter((item) => item.id !== photo.id)
    }
    if (failures.length) {
      error.value = `${failures.length === 1 ? 'One photo could not be uploaded.' : 'Both photos could not be uploaded.'} ${failures[0]} Please select the missing ${failures.length === 1 ? 'photo' : 'photos'} again.`
      progress.value = ''
    } else {
      progress.value = 'Photos ready. Save your review to publish them.'
    }
  } finally {
    busy.value = false
    controller = null
    if (!disposed) emit('uploading', false)
  }
}

onBeforeUnmount(() => {
  disposed = true
  controller?.abort()
  for (const photo of pending.value) URL.revokeObjectURL(photo.preview)
  for (const preview of Object.values(previews.value)) URL.revokeObjectURL(preview)
  emit('uploading', false)
})
</script>

<template>
  <div role="group" :aria-labelledby="labelId" :aria-describedby="hintId" :aria-busy="busy">
    <div class="flex items-center justify-between gap-3">
      <p :id="labelId" class="text-sm font-semibold text-[#143e32]">Photos</p>
      <span class="text-xs text-[#657069]">{{ selectedCount }} / {{ MAX_REVIEW_PHOTOS }}</span>
    </div>
    <p :id="hintId" class="mt-1 text-xs leading-5 text-[#657069]">
      Add up to {{ MAX_REVIEW_PHOTOS }} photos. PNG, JPEG or WebP, up to 5 MB each.
    </p>

    <div v-if="selectedCount" class="mt-3 flex flex-wrap gap-3">
      <div
        v-for="(photo, index) in photos"
        :key="photo.url"
        class="relative size-24 rounded-xl border border-[#dfe6dc] bg-[#f3f7ef]"
      >
        <img
          :src="previews[photo.url] || photo.url"
          :alt="`Review photo ${index + 1}`"
          width="192"
          height="192"
          class="size-full rounded-xl object-cover"
        />
        <UButton
          type="button"
          :aria-label="`Remove photo ${index + 1}`"
          icon="i-lucide-x"
          color="neutral"
          variant="solid"
          size="xs"
          :disabled="busy || disabled"
          class="!absolute right-1 top-1 !size-7 !justify-center !rounded-full !bg-white !p-0 !text-[#143e32] shadow-sm"
          @click="removePhoto(index)"
        />
      </div>
      <div
        v-for="photo in pending"
        :key="photo.id"
        class="relative size-24 overflow-hidden rounded-xl bg-[#f3f7ef]"
      >
        <img :src="photo.preview" alt="Selected review photo" class="size-full object-cover" />
        <div
          class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/65 px-1 py-1 text-xs text-white"
        >
          <UIcon v-if="photo.uploading" name="i-lucide-loader-circle" class="size-3 animate-spin" />
          {{ photo.uploading ? 'Uploading' : 'Waiting' }}
        </div>
      </div>
    </div>

    <input
      ref="input"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      multiple
      hidden
      :disabled="busy || disabled || photos.length >= MAX_REVIEW_PHOTOS"
      @change="uploadPhotos"
    />
    <UButton
      type="button"
      icon="i-lucide-image-plus"
      color="neutral"
      variant="soft"
      :loading="busy"
      :disabled="busy || disabled || photos.length >= MAX_REVIEW_PHOTOS"
      class="mt-3 !rounded-xl !bg-[#edf1ea] !text-[#385344] hover:!bg-[#e2e9df]"
      @click="input?.click()"
    >
      {{
        busy
          ? 'Uploading photos'
          : photos.length >= MAX_REVIEW_PHOTOS
            ? `${MAX_REVIEW_PHOTOS} photos added`
            : 'Add photos'
      }}
    </UButton>
    <p v-if="progress" role="status" class="mt-2 text-xs text-[#657069]">{{ progress }}</p>
    <UiFeedbackAlert v-if="error" tone="error" :message="error" class="mt-3" />
  </div>
</template>
