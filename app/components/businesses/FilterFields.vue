<script setup lang="ts">
import { authInputUi } from '@/utils/authInputUi'
import {
  businessCategories,
  operationModes,
  type BusinessCategory,
  type OperationMode,
} from '~~/shared/businesses'
import { matchingNigeriaState, nigeriaStates, otherStateFilterValue } from '~~/shared/nigeriaStates'

defineProps<{ disabled?: boolean }>()

const category = defineModel<BusinessCategory[]>('category', { required: true })
const city = defineModel<string>('city', { required: true })
const state = defineModel<string>('state', { required: true })
const operationMode = defineModel<OperationMode[]>('operationMode', { required: true })

const categoryItems = [...businessCategories]
const modeItems = [...operationModes]
const allStateFilterValue = '__all_states__'
const stateItems = [
  { label: 'All states', value: allStateFilterValue },
  ...nigeriaStates.map((name) => ({ label: name, value: name })),
  { label: 'Another state or region', value: otherStateFilterValue },
]
const selectedState = computed<string>({
  get: () =>
    state.value
      ? (matchingNigeriaState(state.value) ?? otherStateFilterValue)
      : allStateFilterValue,
  set: (value) => {
    state.value = value === allStateFilterValue ? '' : value
  },
})
const customState = computed<string>({
  get: () => (state.value === otherStateFilterValue ? '' : state.value),
  set: (value) => {
    state.value = value || otherStateFilterValue
  },
})
const categorySummary = computed(() =>
  category.value.length === 1
    ? categoryItems.find((item) => item.value === category.value[0])?.label
    : category.value.length
      ? `${category.value.length} categories selected`
      : 'All categories',
)
const modeSummary = computed(() =>
  operationMode.value.length === 1
    ? modeItems.find((item) => item.value === operationMode.value[0])?.label
    : operationMode.value.length
      ? `${operationMode.value.length} ways selected`
      : 'Online or in person',
)
</script>

<template>
  <div class="space-y-5">
    <UFormField label="Category" name="category">
      <USelectMenu
        v-model="category"
        :items="categoryItems"
        multiple
        :disabled="disabled"
        value-key="value"
        placeholder="All categories"
        aria-label="Select categories"
        name="category"
        class="w-full"
        :ui="authInputUi"
      >
        <span class="truncate">{{ categorySummary }}</span>
      </USelectMenu>
    </UFormField>
    <UFormField label="How it operates" name="operationMode">
      <USelectMenu
        v-model="operationMode"
        :items="modeItems"
        multiple
        :disabled="disabled"
        value-key="value"
        placeholder="Online or in person"
        aria-label="Select how it operates"
        name="operationMode"
        class="w-full"
        :ui="authInputUi"
      >
        <span class="truncate">{{ modeSummary }}</span>
      </USelectMenu>
    </UFormField>
    <UFormField label="State" name="state">
      <USelectMenu
        v-model="selectedState"
        :items="stateItems"
        value-key="value"
        :search-input="{ placeholder: 'Find a state' }"
        name="state"
        aria-label="Select state"
        :disabled="disabled"
        class="w-full"
        :ui="authInputUi"
      />
      <UInput
        v-if="selectedState === otherStateFilterValue"
        v-model="customState"
        :disabled="disabled"
        name="customState"
        placeholder="Enter a state or region"
        class="mt-2 w-full"
        :ui="authInputUi"
      />
    </UFormField>
    <UFormField label="City" name="city">
      <UInput
        v-model="city"
        :disabled="disabled"
        name="city"
        placeholder="Any city"
        class="w-full"
        :ui="authInputUi"
      />
    </UFormField>
  </div>
</template>
