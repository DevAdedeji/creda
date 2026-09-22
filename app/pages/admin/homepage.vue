<script setup lang="ts">
import HomepageBusinessPicker from '@/components/admin/HomepageBusinessPicker.vue'
import HomepageBusinessRow from '@/components/admin/HomepageBusinessRow.vue'
import { saveHomepageSelection } from '@/services/homepage'
import { apiErrorMessage } from '@/utils/apiError'
import {
  HOMEPAGE_FEATURED_LIMIT,
  type HomepageBusiness,
  type HomepageSelection,
} from '~~/shared/homepage'

useSeoMeta({ title: 'Homepage features — Creda', robots: 'noindex, nofollow' })
const { data, status, error, refresh } = await useFetch<HomepageSelection>('/api/admin/homepage', {
  retry: 0,
})
const hero = ref<HomepageBusiness | null>(null)
const featured = ref<HomepageBusiness[]>([])
const picker = ref<'hero' | 'featured' | null>(null)
const saving = ref(false)
const saveError = ref('')
const appToast = useAppToast()

function reset() {
  if (!data.value) return
  hero.value = data.value.hero ? { ...data.value.hero } : null
  featured.value = data.value.featured.map((item) => ({ ...item }))
  saveError.value = ''
}
watch(data, reset, { immediate: true })
const dirty = computed(
  () =>
    data.value &&
    (hero.value?.id !== data.value.hero?.id ||
      JSON.stringify(featured.value.map((item) => item.id)) !==
        JSON.stringify(data.value.featured.map((item) => item.id))),
)
const hasUnavailable = computed(() =>
  [hero.value, ...featured.value].some((item) => item && item.status !== 'approved'),
)

function select(business: HomepageBusiness) {
  if (picker.value === 'hero') {
    hero.value = business
    picker.value = null
  } else if (
    featured.value.length < HOMEPAGE_FEATURED_LIMIT &&
    !featured.value.some((item) => item.id === business.id)
  ) {
    featured.value.push(business)
    if (featured.value.length === HOMEPAGE_FEATURED_LIMIT) picker.value = null
  }
}

function move(index: number, direction: -1 | 1) {
  const next = index + direction
  if (next < 0 || next >= featured.value.length) return
  const reordered = [...featured.value]
  const [business] = reordered.splice(index, 1)
  if (!business) return
  reordered.splice(next, 0, business)
  featured.value = reordered
}

async function save() {
  if (saving.value || !dirty.value || !data.value || hasUnavailable.value) return
  saving.value = true
  saveError.value = ''
  try {
    const result = await saveHomepageSelection({
      heroId: hero.value?.id ?? null,
      featuredIds: featured.value.map((item) => item.id),
      revision: data.value.revision,
    })
    data.value = {
      hero: hero.value ? { ...hero.value } : null,
      featured: featured.value.map((item) => ({ ...item })),
      revision: result.revision,
    }
    clearNuxtData('homepage-businesses')
    appToast.success(
      'Homepage updated',
      'Your selected businesses are now featured on the homepage.',
    )
  } catch (error) {
    saveError.value = apiErrorMessage(error, 'Your choices could not be saved. Please try again.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <WorkspaceShell>
    <main class="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 xl:px-12">
      <p class="text-xs font-bold uppercase tracking-[.15em] text-[#65836a]">
        Creda administration
      </p>
      <div class="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Homepage features</h1>
        <UButton
          to="/"
          target="_blank"
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide-arrow-up-right"
          >View homepage</UButton
        >
      </div>
      <p class="mt-3 max-w-xl text-sm leading-7 text-[#647367]">
        Give great businesses a place in the spotlight. Choose the hero highlight and curate the
        featured collection below it.
      </p>

      <div v-if="status === 'pending'" class="mt-9 space-y-5" aria-label="Loading homepage choices">
        <div v-for="item in 2" :key="item" class="h-56 animate-pulse rounded-2xl bg-[#eaf0e5]" />
      </div>
      <UiFeedbackAlert
        v-else-if="error"
        tone="error"
        title="Homepage choices could not be loaded"
        message="Please try again."
        class="mt-9"
      >
        <UButton color="neutral" variant="soft" class="mt-3" @click="refresh()">Try again</UButton>
      </UiFeedbackAlert>
      <form v-else-if="data" class="mt-9 space-y-6" @submit.prevent="save">
        <fieldset :disabled="saving" class="min-w-0 space-y-6">
          <section
            class="rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-7"
            aria-labelledby="hero-selection"
          >
            <div class="flex items-start gap-3">
              <span
                class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf3db] text-[#315b3a]"
                ><UIcon name="i-lucide-panel-top" class="size-5"
              /></span>
              <div>
                <h2 id="hero-selection" class="text-lg font-semibold">Hero highlight</h2>
                <p class="mt-1 text-sm leading-6 text-[#647367]">
                  The business in the large card beside the homepage search.
                </p>
              </div>
            </div>
            <HomepageBusinessRow v-if="hero" :business="hero" class="mt-6">
              <UTooltip text="Replace business"
                ><UButton
                  type="button"
                  icon="i-lucide-repeat-2"
                  color="neutral"
                  variant="ghost"
                  aria-label="Replace hero business"
                  @click="picker = 'hero'"
              /></UTooltip>
              <UTooltip text="Remove from hero"
                ><UButton
                  type="button"
                  icon="i-lucide-x"
                  color="neutral"
                  variant="ghost"
                  aria-label="Remove hero business"
                  @click="hero = null"
              /></UTooltip>
            </HomepageBusinessRow>
            <button
              v-else
              type="button"
              class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#c7d9be] bg-[#f8fbf3] px-4 py-8 text-sm font-semibold text-[#315b3a] transition hover:bg-[#eef5e5]"
              @click="picker = 'hero'"
            >
              <UIcon name="i-lucide-plus" /> Choose a hero business
            </button>
            <p class="mt-3 text-xs leading-5 text-[#7a897b]">
              Without a selection, the hero shows Creda’s discovery card.
            </p>
          </section>

          <section
            class="rounded-2xl border border-[#dfe6dc] bg-white p-5 sm:p-7"
            aria-labelledby="featured-selection"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <span
                  class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf3db] text-[#315b3a]"
                  ><UIcon name="i-lucide-layout-grid" class="size-5"
                /></span>
                <div>
                  <h2 id="featured-selection" class="text-lg font-semibold">Featured businesses</h2>
                  <p class="mt-1 text-sm leading-6 text-[#647367]">
                    Up to {{ HOMEPAGE_FEATURED_LIMIT }} businesses in “Good finds. All kinds.”
                  </p>
                </div>
              </div>
              <span
                class="rounded-full bg-[#f0f5e9] px-3 py-1 text-xs font-semibold text-[#55734e]"
                aria-live="polite"
                >{{ featured.length }} / {{ HOMEPAGE_FEATURED_LIMIT }}</span
              >
            </div>
            <ol v-if="featured.length" class="mt-6 space-y-3">
              <li v-for="(business, index) in featured" :key="business.id">
                <HomepageBusinessRow :business="business" :position="index + 1">
                  <UTooltip text="Move up"
                    ><UButton
                      type="button"
                      icon="i-lucide-arrow-up"
                      color="neutral"
                      variant="ghost"
                      :disabled="index === 0"
                      :aria-label="`Move ${business.name} up`"
                      @click="move(index, -1)"
                  /></UTooltip>
                  <UTooltip text="Move down"
                    ><UButton
                      type="button"
                      icon="i-lucide-arrow-down"
                      color="neutral"
                      variant="ghost"
                      :disabled="index === featured.length - 1"
                      :aria-label="`Move ${business.name} down`"
                      @click="move(index, 1)"
                  /></UTooltip>
                  <UTooltip text="Remove from homepage"
                    ><UButton
                      type="button"
                      icon="i-lucide-x"
                      color="neutral"
                      variant="ghost"
                      :aria-label="`Remove ${business.name} from featured businesses`"
                      @click="featured.splice(index, 1)"
                  /></UTooltip>
                </HomepageBusinessRow>
              </li>
            </ol>
            <div v-else class="mt-6 rounded-xl bg-[#f8faf5] px-5 py-8 text-center">
              <UIcon name="i-lucide-sparkles" class="size-7 text-[#769067]" />
              <p class="mt-3 text-sm font-semibold">Build your featured collection</p>
              <p class="mt-2 text-sm leading-6 text-[#647367]">
                Choose businesses you want visitors to discover first.
              </p>
            </div>
            <UButton
              v-if="featured.length < HOMEPAGE_FEATURED_LIMIT"
              type="button"
              color="neutral"
              variant="soft"
              icon="i-lucide-plus"
              class="mt-4"
              @click="picker = 'featured'"
              >Add businesses</UButton
            >
            <p class="mt-4 text-xs leading-5 text-[#7a897b]">
              Shown in this order, from left to right. You can also feature the hero business here.
            </p>
          </section>
        </fieldset>

        <UiFeedbackAlert
          v-if="hasUnavailable"
          tone="warning"
          message="Remove or replace businesses that are no longer public before saving. They are already hidden from the homepage."
        />
        <UiFeedbackAlert v-if="saveError" tone="error" :message="saveError">
          <UButton
            type="button"
            color="neutral"
            variant="soft"
            class="mt-3"
            :disabled="saving"
            @click="refresh()"
            >Reload saved choices</UButton
          >
        </UiFeedbackAlert>
        <div
          class="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dfe6dc] bg-white/95 p-4 shadow-lg backdrop-blur sm:px-6"
        >
          <UButton
            type="button"
            color="neutral"
            variant="soft"
            :disabled="saving || !dirty"
            @click="reset"
            >Discard changes</UButton
          >
          <div class="flex items-center gap-4">
            <span class="hidden text-xs text-[#738174] sm:inline" role="status">{{
              dirty ? 'Unsaved changes' : 'All changes saved'
            }}</span>
            <UButton
              type="submit"
              :loading="saving"
              :disabled="saving || !dirty || hasUnavailable"
              icon="i-lucide-check"
              >Save homepage</UButton
            >
          </div>
        </div>
      </form>
      <HomepageBusinessPicker
        v-if="picker"
        :purpose="picker"
        :selected-ids="
          picker === 'hero' ? (hero ? [hero.id] : []) : featured.map((item) => item.id)
        "
        @select="select"
        @close="picker = null"
      />
    </main>
  </WorkspaceShell>
</template>
