<script setup lang="ts">
import SearchMode from '@/components/discovery/SearchMode.vue'

defineProps<{ pending: boolean; interpreting: boolean }>()
defineEmits<{ search: [] }>()
const search = defineModel<string>('search', { required: true })
const aiSearch = defineModel<boolean>('aiSearch', { required: true })
const inputId = useId()
</script>

<template>
  <form
    role="search"
    aria-label="Search businesses"
    class="rounded-2xl border border-[#d9e3d2] bg-[#f0f5e9] p-4 sm:p-5"
    @submit.prevent="$emit('search')"
  >
    <div class="mb-2 flex items-center justify-between gap-3">
      <label :for="inputId" class="text-sm font-semibold text-[#345341]">Search businesses</label>
      <SearchMode v-model="aiSearch" :disabled="interpreting" />
    </div>
    <div class="flex items-stretch gap-2 sm:gap-3">
      <div
        class="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#cbd8c5] bg-white px-3 focus-within:border-[#315b3a] focus-within:ring-2 focus-within:ring-[#315b3a]/15 sm:px-4"
      >
        <UIcon name="i-lucide-search" class="shrink-0 text-xl text-[#627465]" aria-hidden="true" />
        <input
          :id="inputId"
          v-model="search"
          name="q"
          type="search"
          :placeholder="
            aiSearch ? 'Describe what you need…' : 'Business name, category, or service'
          "
          :maxlength="500"
          :disabled="interpreting"
          autocomplete="off"
          class="h-13 min-w-0 w-full bg-transparent text-base outline-none placeholder:text-[#737c73]"
        />
      </div>
      <UButton
        type="submit"
        :loading="interpreting"
        :disabled="pending"
        aria-label="Search businesses"
        class="!min-h-13 !shrink-0 !justify-center !rounded-xl !bg-[#143e32] !px-4 !font-semibold !text-white sm:!px-7"
      >
        <span class="hidden sm:inline">Search</span
        ><UIcon
          v-if="!interpreting"
          name="i-lucide-arrow-right"
          class="text-xl sm:hidden"
          aria-hidden="true"
        />
      </UButton>
    </div>
  </form>
</template>
