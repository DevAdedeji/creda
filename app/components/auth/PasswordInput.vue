<script setup lang="ts">
import { authInputUi } from '@/utils/authInputUi'

withDefaults(
  defineProps<{
    name: string
    autocomplete: string
    placeholder?: string
    required?: boolean
    minlength?: number
    maxlength?: number
    leadingIcon?: string
  }>(),
  {
    required: false,
    leadingIcon: 'i-lucide-lock-keyhole',
  },
)

const model = defineModel<string>({ required: true })
const visible = ref(false)
</script>

<template>
  <UInput
    v-model="model"
    :type="visible ? 'text' : 'password'"
    :name="name"
    :autocomplete="autocomplete"
    :placeholder="placeholder"
    :required="required"
    :minlength="minlength"
    :maxlength="maxlength"
    :leading-icon="leadingIcon"
    :ui="authInputUi"
    size="xl"
    class="w-full"
  >
    <template #trailing>
      <button
        type="button"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        :aria-pressed="visible"
        :title="visible ? 'Hide password' : 'Show password'"
        class="grid size-8 place-items-center rounded-md text-[#738176] transition hover:text-[#143e32]"
        @click="visible = !visible"
      >
        <UIcon
          :name="visible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          class="size-4.5"
          aria-hidden="true"
        />
      </button>
    </template>
  </UInput>
</template>
