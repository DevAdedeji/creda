<script setup lang="ts">
import { businessDays, type BusinessHoursDay } from '~~/shared/businesses'

const hours = defineModel<BusinessHoursDay[]>({ required: true })
const timeZone = defineModel<string>('timeZone', { required: true })
const zones = ref([{ label: 'Africa/Lagos', value: 'Africa/Lagos' }])

onMounted(() => {
  zones.value = [
    ...new Set(['UTC', timeZone.value, ...Intl.supportedValuesOf('timeZone')].filter(Boolean)),
  ].map((value) => ({
    label: value.replaceAll('_', ' '),
    value,
  }))
})

function rowFor(day: number) {
  return hours.value.find((row) => row.day === day)
}

function toggle(day: number) {
  const existing = rowFor(day)
  if (existing) {
    hours.value = hours.value.filter((row) => row.day !== day)
    return
  }
  if (!timeZone.value)
    timeZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos'
  hours.value = [...hours.value, { day, start: '09:00', end: '17:00' }].sort(
    (a, b) => a.day - b.day,
  )
}

function setTime(day: number, field: 'start' | 'end', value: string) {
  hours.value = hours.value.map((row) => (row.day === day ? { ...row, [field]: value } : row))
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-[#dfe6dc]">
    <div
      v-for="day in businessDays"
      :key="day.value"
      class="border-b border-[#e8ede5] px-4 py-3 last:border-b-0 sm:px-5"
    >
      <div class="flex items-center gap-3">
        <USwitch
          :model-value="!!rowFor(day.value)"
          :aria-label="`Open on ${day.label}`"
          @update:model-value="toggle(day.value)"
        />
        <span class="min-w-24 text-sm font-semibold text-[#143e32]">{{ day.label }}</span>
        <span v-if="!rowFor(day.value)" class="text-xs text-[#819082]">Closed</span>
      </div>
      <div
        v-if="rowFor(day.value)"
        class="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 pl-0 sm:ml-9 sm:max-w-sm"
      >
        <UInput
          type="time"
          :model-value="rowFor(day.value)?.start"
          :aria-label="`${day.label} opening time`"
          class="w-full"
          :ui="{ base: '!rounded-lg !ring-0 focus:!ring-0' }"
          @update:model-value="setTime(day.value, 'start', String($event))"
        />
        <span class="text-xs text-[#657069]">to</span>
        <UInput
          type="time"
          :model-value="rowFor(day.value)?.end"
          :aria-label="`${day.label} closing time`"
          class="w-full"
          :ui="{ base: '!rounded-lg !ring-0 focus:!ring-0' }"
          @update:model-value="setTime(day.value, 'end', String($event))"
        />
      </div>
      <p
        v-if="rowFor(day.value) && rowFor(day.value)!.start >= rowFor(day.value)!.end"
        class="mt-2 text-xs text-red-700 sm:ml-9"
      >
        Closing time must be after opening time.
      </p>
    </div>
  </div>
  <UFormField v-if="hours.length" label="Time zone" name="hoursTimeZone" class="mt-5" required>
    <USelectMenu
      v-model="timeZone"
      :items="zones"
      value-key="value"
      :search-input="{ placeholder: 'Search time zones' }"
      class="w-full"
    />
  </UFormField>
</template>
