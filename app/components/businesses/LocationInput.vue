<script setup lang="ts">
import { loadGooglePlaces } from '@/utils/googlePlaces'

const props = defineProps<{
  modelValue: string
  googlePlaceId: string
  required: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:googlePlaceId': [value: string]
  placeSelected: [value: { city: string; state: string }]
  placeCleared: []
}>()

const apiKey = useRuntimeConfig().public.googleMapsApiKey
const input = ref(props.modelValue)
const suggestions = shallowRef<google.maps.places.PlacePrediction[]>([])
const activeIndex = ref(-1)
const searching = ref(false)
const unavailable = ref(false)
let library: google.maps.PlacesLibrary | undefined
let sessionToken: google.maps.places.AutocompleteSessionToken | undefined
let searchTimer: ReturnType<typeof setTimeout> | undefined
let requestId = 0

watch(
  () => props.modelValue,
  (value) => {
    input.value = value
  },
)

onMounted(async () => {
  if (!apiKey) return
  try {
    library = await loadGooglePlaces(apiKey)
  } catch {
    unavailable.value = true
  }
})

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
  requestId++
})

function onInput(value: string | number) {
  const text = String(value)
  input.value = text
  emit('update:modelValue', text)
  if (props.googlePlaceId) emit('placeCleared')
  emit('update:googlePlaceId', '')
  clearTimeout(searchTimer)
  suggestions.value = []
  activeIndex.value = -1
  searching.value = false
  const currentRequest = ++requestId
  if (!library || text.trim().length < 3) return
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      sessionToken ??= new library!.AutocompleteSessionToken()
      const result = await library!.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: text.trim(),
        sessionToken,
      })
      if (currentRequest !== requestId) return
      suggestions.value = result.suggestions
        .map((item) => item.placePrediction)
        .filter((item): item is google.maps.places.PlacePrediction => Boolean(item))
        .slice(0, 5)
      unavailable.value = false
    } catch {
      if (currentRequest === requestId) unavailable.value = true
    } finally {
      if (currentRequest === requestId) searching.value = false
    }
  }, 350)
}

async function choose(prediction: google.maps.places.PlacePrediction) {
  const currentRequest = ++requestId
  clearTimeout(searchTimer)
  suggestions.value = []
  activeIndex.value = -1
  searching.value = false
  const fallback = prediction.text.toString()
  input.value = fallback
  emit('update:modelValue', fallback)
  emit('update:googlePlaceId', '')
  try {
    const place = prediction.toPlace()
    await place.fetchFields({ fields: ['id', 'formattedAddress', 'addressComponents'] })
    if (currentRequest !== requestId) return
    const address = place.formattedAddress || fallback
    input.value = address
    emit('update:modelValue', address)
    emit('update:googlePlaceId', place.id || '')
    const components = place.addressComponents ?? []
    const find = (type: string) =>
      components.find((part) => part.types.includes(type))?.longText ?? ''
    emit('placeSelected', {
      city: find('locality') || find('postal_town') || find('administrative_area_level_2'),
      state: find('administrative_area_level_1'),
    })
    sessionToken = undefined
  } catch {
    if (currentRequest === requestId) {
      sessionToken = undefined
      unavailable.value = true
    }
  }
}

function onKeydown(event: KeyboardEvent) {
  if (!suggestions.value.length) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % suggestions.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value =
      (activeIndex.value - 1 + suggestions.value.length) % suggestions.value.length
  } else if (event.key === 'Enter' && activeIndex.value >= 0) {
    event.preventDefault()
    void choose(suggestions.value[activeIndex.value]!)
  } else if (event.key === 'Escape') {
    suggestions.value = []
    activeIndex.value = -1
  }
}
</script>

<template>
  <div class="relative" @focusout="suggestions = []">
    <UInput
      :model-value="input"
      name="location"
      placeholder="e.g. Yaba, Lagos, Nigeria"
      :maxlength="160"
      :required="required"
      class="w-full"
      size="xl"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="suggestions.length > 0"
      aria-controls="business-location-suggestions"
      :aria-activedescendant="
        activeIndex >= 0 ? `business-location-option-${activeIndex}` : undefined
      "
      :ui="{
        base: '!rounded-xl !border !border-[#d9e2d8] !bg-white !shadow-none !ring-0 focus:!border-[#4f805c] focus:!ring-0',
      }"
      @update:model-value="onInput"
      @keydown="onKeydown"
    />
    <ul
      v-if="suggestions.length"
      id="business-location-suggestions"
      role="listbox"
      aria-label="Google Maps location suggestions"
      class="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-[#d9e2d8] bg-white p-1.5 shadow-xl"
    >
      <li v-for="(prediction, index) in suggestions" :key="prediction.placeId">
        <button
          :id="`business-location-option-${index}`"
          type="button"
          role="option"
          :aria-selected="activeIndex === index"
          class="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#234532] hover:bg-[#f2f8ed]"
          :class="{ 'bg-[#f2f8ed]': activeIndex === index }"
          @mousedown.prevent
          @mouseenter="activeIndex = index"
          @click="choose(prediction)"
        >
          <UIcon name="i-lucide-map-pin" class="mt-0.5 shrink-0 text-[#5e805e]" />
          {{ prediction.text.toString() }}
        </button>
      </li>
      <li class="px-3 py-2 text-right text-xs text-[#6b786d]">
        Suggestions by <span translate="no">Google Maps</span>
      </li>
    </ul>
    <p v-if="unavailable" aria-live="polite" class="mt-2 text-xs text-[#657069]">
      Google suggestions are unavailable. You can still use the location you entered.
    </p>
    <p v-else-if="apiKey" class="mt-2 text-xs text-[#657069]">
      <template v-if="googlePlaceId">Google Maps location selected.</template>
      <template v-else-if="searching">Searching Google Maps…</template>
      <template v-else>Choose a suggestion for a map, or keep your own location text.</template>
    </p>
  </div>
</template>
