<script setup lang="ts">
import { authInputUi } from '@/utils/authInputUi'
import {
  businessCategories,
  operationModes,
  type BusinessCategory,
  type OperationMode,
} from '~~/shared/businesses'

const search = defineModel<string>('search', { required: true })
const category = defineModel<BusinessCategory[]>('category', { required: true })
const city = defineModel<string>('city', { required: true })
const state = defineModel<string>('state', { required: true })
const operationMode = defineModel<OperationMode[]>('operationMode', { required: true })

const categoryItems = [...businessCategories]
const modeItems = [...operationModes]
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
    <UFormField label="Search" name="q">
      <UInput
        v-model="search"
        name="q"
        placeholder="Name or keyword"
        leading-icon="i-lucide-search"
        class="w-full"
        :ui="authInputUi"
      />
    </UFormField>
    <UFormField label="Category" name="category">
      <USelectMenu
        v-model="category"
        :items="categoryItems"
        multiple
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
    <UFormField label="City" name="city">
      <UInput v-model="city" name="city" placeholder="Any city" class="w-full" :ui="authInputUi" />
    </UFormField>
    <UFormField label="State" name="state">
      <UInput
        v-model="state"
        name="state"
        placeholder="Any state"
        class="w-full"
        :ui="authInputUi"
      />
    </UFormField>
  </div>
</template>
