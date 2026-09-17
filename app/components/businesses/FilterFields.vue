<script setup lang="ts">
import { authInputUi } from '@/utils/authInputUi'
import {
  businessCategories,
  operationModes,
  type BusinessCategory,
  type OperationMode,
} from '~~/shared/businesses'

const search = defineModel<string>('search', { required: true })
const category = defineModel<BusinessCategory | 'all'>('category', { required: true })
const city = defineModel<string>('city', { required: true })
const state = defineModel<string>('state', { required: true })
const operationMode = defineModel<OperationMode | 'all'>('operationMode', { required: true })

const categoryItems = [{ label: 'All categories', value: 'all' }, ...businessCategories]
const modeItems = [{ label: 'Online or in person', value: 'all' }, ...operationModes]
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
      <USelect
        v-model="category"
        :items="categoryItems"
        name="category"
        class="w-full"
        :ui="authInputUi"
      />
    </UFormField>
    <UFormField label="How it operates" name="operationMode">
      <USelect
        v-model="operationMode"
        :items="modeItems"
        name="operationMode"
        class="w-full"
        :ui="authInputUi"
      />
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
