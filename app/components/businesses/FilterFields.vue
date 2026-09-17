<script setup lang="ts">
import { authInputUi } from '@/utils/authInputUi'
import {
  businessCategories,
  businessTypes,
  type BusinessCategory,
  type BusinessType,
} from '~~/shared/businesses'

const search = defineModel<string>('search', { required: true })
const category = defineModel<BusinessCategory | 'all'>('category', { required: true })
const businessType = defineModel<BusinessType | 'all'>('businessType', { required: true })
const location = defineModel<string>('location', { required: true })

const categoryItems = [{ label: 'All categories', value: 'all' }, ...businessCategories]
const typeItems = [{ label: 'All types', value: 'all' }, ...businessTypes]
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
    <UFormField label="Type" name="businessType">
      <USelect
        v-model="businessType"
        :items="typeItems"
        name="businessType"
        class="w-full"
        :ui="authInputUi"
      />
    </UFormField>
    <UFormField label="Location" name="location">
      <UInput
        v-model="location"
        name="location"
        placeholder="Any location"
        class="w-full"
        :ui="authInputUi"
      />
    </UFormField>
  </div>
</template>
