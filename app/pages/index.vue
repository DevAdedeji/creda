<script setup lang="ts">
useSeoMeta({
  title: 'Creda — Find businesses worth knowing',
  description: 'Discover businesses in Nigeria, understand who manages their profiles, and explore customer experiences. Meet your next great find on Creda.',
  ogTitle: 'Creda — Find businesses worth knowing',
  ogDescription: 'A little context. A lot more confidence. Discover businesses and customer experiences on Creda.',
})

type Business = {
  id: string
  name: string
  category: string
  location: string
  description: string
  detail: string
  icon: string
  theme: string
  initials: string
}

const businesses: Business[] = [
  { id: 'kora', name: 'Kora Studio', category: 'Creative & design', location: 'Lagos', description: 'Thoughtful brands for bold businesses.', detail: 'An example of how an independent creative studio can introduce its work, show its location and collect customer experiences on Creda.', icon: 'i-lucide-orbit', theme: 'peach', initials: 'ks' },
  { id: 'tally', name: 'Tally', category: 'Software & apps', location: 'Online', description: 'A little less admin. A lot more doing.', detail: 'An example software business profile. A live profile will bring together official product links, ownership status and first-hand customer experiences.', icon: 'i-lucide-command', theme: 'lilac', initials: 'ta' },
  { id: 'root', name: 'Root & Ritual', category: 'Shopping & retail', location: 'Abuja', description: 'Everyday objects, thoughtfully made.', detail: 'An example independent shop profile, showing how a business can help customers understand what it offers before they visit or buy.', icon: 'i-lucide-sprout', theme: 'yellow', initials: 'rr' },
  { id: 'frame', name: 'Frame House', category: 'Creative & design', location: 'Ibadan', description: 'Stories you can see. Moments you can keep.', detail: 'An example photography business. Customers will be able to share first-hand experiences, and the business can respond publicly.', icon: 'i-lucide-focus', theme: 'blue', initials: 'fh' },
  { id: 'patch', name: 'Patchworks', category: 'Professional services', location: 'Lagos', description: 'Practical support for your next big step.', detail: 'An example professional services profile with a description, location, official contact links and a space for customer feedback.', icon: 'i-lucide-component', theme: 'pink', initials: 'pw' },
  { id: 'daylight', name: 'Daylight', category: 'Food & hospitality', location: 'Enugu', description: 'Good food. Unhurried mornings.', detail: 'An example hospitality business, demonstrating how a physical business can introduce itself and make customer experiences easier to find.', icon: 'i-lucide-sun', theme: 'mint', initials: 'dl' },
]

const categories = [
  { label: 'All businesses', icon: 'i-lucide-grid-2x2' },
  { label: 'Software & apps', icon: 'i-lucide-command' },
  { label: 'Creative & design', icon: 'i-lucide-palette' },
  { label: 'Shopping & retail', icon: 'i-lucide-shopping-bag' },
  { label: 'Professional services', icon: 'i-lucide-briefcase-business' },
  { label: 'Food & hospitality', icon: 'i-lucide-coffee' },
]

const query = ref('')
const submittedQuery = ref('')
const selectedCategory = ref('All businesses')
const selectedBusiness = ref<Business>(businesses[0]!)
const profileOpen = ref(false)
const visibleBusinesses = computed(() => {
  const term = submittedQuery.value.toLocaleLowerCase().trim()
  return businesses.filter(business => (
    (selectedCategory.value === 'All businesses' || business.category === selectedCategory.value)
    && (!term || `${business.name} ${business.category} ${business.location} ${business.description}`.toLocaleLowerCase().includes(term))
  ))
})

function searchBusinesses() {
  submittedQuery.value = query.value
  selectedCategory.value = 'All businesses'
  document.getElementById('explore')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}

function clearFilters() {
  query.value = ''
  submittedQuery.value = ''
  selectedCategory.value = 'All businesses'
}

function openProfile(business: Business = businesses[0]!) {
  selectedBusiness.value = business
  profileOpen.value = true
}
</script>

<template>
  <div>
    <a class="skip-link" href="#main">Skip to content</a>
    <LandingSiteHeader />
    <main id="main">
      <section class="hero container" aria-labelledby="hero-heading">
        <div class="hero-copy">
          <div class="eyebrow"><span class="status-dot" /> A NEW WAY TO DISCOVER LOCAL</div>
          <h1 id="hero-heading">Find businesses<br><span class="serif-word">worth knowing.</span><span class="heading-spark" aria-hidden="true">✳</span></h1>
          <p class="hero-description">Your next great find is out there. Discover businesses, get the full picture, and hear from the people who’ve been there.</p>
          <form class="search-form" role="search" @submit.prevent="searchBusinesses">
            <UIcon name="i-lucide-search" class="search-leading" aria-hidden="true" />
            <label class="sr-only" for="business-search">Search example businesses by name, category or city</label>
            <input id="business-search" v-model="query" type="search" placeholder="A business, a service, a great find…" autocomplete="off">
            <UButton type="submit" class="search-button" aria-label="Search example businesses"><span class="search-label">Explore</span><UIcon name="i-lucide-arrow-up-right" /></UButton>
          </form>
          <div class="hero-hint"><span>Made for the curious.</span><span class="hint-separator" /> Starting in Nigeria <span class="nigeria-flag" aria-label="Nigerian flag"><i /><i /><i /></span></div>
        </div>
        <LandingHeroShowcase @preview="openProfile()" />
      </section>

      <div class="promise-strip bg-[#d8f36a] border-y border-[#c7df62] py-4">
        <div class="container promise-items flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm font-semibold text-[#143e32]">
          <span><UIcon name="i-lucide-compass" /> Independent businesses. Fresh discoveries.</span>
          <span><UIcon name="i-lucide-message-circle-heart" /> Space for honest experiences.</span>
          <span><UIcon name="i-lucide-badge-check" /> Clear ownership information.</span>
        </div>
      </div>

      <section id="explore" class="explore-section container py-24 max-md:py-16" aria-labelledby="explore-heading">
        <div class="section-heading flex flex-wrap items-end justify-between gap-5 mb-10">
          <div><p class="eyebrow">FOLLOW YOUR CURIOSITY</p><h2 id="explore-heading">Good finds. <span class="muted-heading">All kinds.</span></h2></div>
          <p>From the app that simplifies your day<br class="desktop-break"> to the studio that brings your idea to life.</p>
        </div>
        <div class="category-list flex gap-2 overflow-x-auto pb-3 mb-7" role="group" aria-label="Filter example businesses by category">
          <button v-for="category in categories" :key="category.label" class="category-pill shrink-0 flex items-center gap-2 rounded-full border border-[#d8ded4] bg-white px-4 py-2.5 text-sm font-semibold text-[#3f5146] transition-all hover:border-[#143e32] hover:-translate-y-0.5" :class="{ active: selectedCategory === category.label }" :aria-pressed="selectedCategory === category.label" @click="selectedCategory = category.label"><UIcon :name="category.icon" />{{ category.label }}</button>
        </div>
        <div class="directory-note flex flex-wrap justify-between gap-3 border-y border-[#e0e5dd] py-4 mb-5 text-xs font-semibold tracking-wide text-[#657069]"><span><span class="preview-dot" /> A FIRST LOOK AT CREDA <span class="note-divider">/</span> Illustrative businesses, not live listings</span><span role="status" aria-live="polite">{{ visibleBusinesses.length }} {{ visibleBusinesses.length === 1 ? 'example' : 'examples' }}<template v-if="submittedQuery"> for “{{ submittedQuery }}”</template></span></div>
        <TransitionGroup v-if="visibleBusinesses.length" name="business" tag="div" class="business-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <button v-for="business in visibleBusinesses" :key="business.id" class="business-card flex flex-col text-left min-h-[274px] rounded-xl border border-[#dfe4db] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#9aae88] hover:shadow-xl hover:shadow-[#143e32]/10" @click="openProfile(business)">
            <div class="business-card-top flex justify-between items-start mb-6"><span class="business-logo flex w-14 h-14 shrink-0 items-center justify-center rounded-xl text-3xl" :class="business.theme"><UIcon :name="business.icon" /></span><span class="business-arrow flex w-8 h-8 items-center justify-center rounded-full border border-[#dfe4db] text-xl transition-transform group-hover:translate-x-1"><UIcon name="i-lucide-arrow-up-right" /></span></div>
            <div class="business-title flex flex-wrap justify-between items-baseline gap-2 mb-2"><h3>{{ business.name }}</h3><span class="business-location inline-flex items-center gap-1 text-xs text-[#657069]"><UIcon name="i-lucide-map-pin" />{{ business.location }}</span></div>
            <p>{{ business.description }}</p>
            <div class="business-card-bottom flex items-center justify-between gap-3 mt-auto pt-6 text-xs font-semibold text-[#40654e]"><span>{{ business.category }}</span><span>View example <UIcon name="i-lucide-arrow-right" /></span></div>
          </button>
        </TransitionGroup>
        <div v-else class="empty-state flex flex-col items-center justify-center text-center py-20 rounded-xl border border-dashed border-[#bac8b8] bg-[#f5f8ef]"><UIcon name="i-lucide-search-x" /><h3>No examples match just yet.</h3><p>Try a name, category or city like “design” or “Lagos”.</p><UButton color="primary" variant="outline" @click="clearFilters">Show all examples</UButton></div>
        <button v-if="submittedQuery && visibleBusinesses.length" class="clear-search flex items-center gap-2 mt-6 text-sm font-semibold text-[#143e32] hover:underline" @click="clearFilters">Clear search <UIcon name="i-lucide-x" /></button>
      </section>

      <section id="how-it-works" class="how-section bg-[#eff2e9] py-24 max-md:py-16" aria-labelledby="how-heading">
        <div class="container">
          <div class="section-heading flex flex-wrap items-end justify-between gap-5 mb-10"><div><p class="eyebrow">A LITTLE CONTEXT GOES A LONG WAY</p><h2 id="how-heading">Find it. Know it. <span class="serif-word">Try it.</span></h2></div><p>Better choices start with<br class="desktop-break"> knowing a little more.</p></div>
          <div class="steps-grid grid grid-cols-1 md:grid-cols-3 gap-4">
            <article class="step flex flex-col min-h-[245px] rounded-xl bg-[#fcfcf8] p-7"><div class="step-top flex items-center justify-between mb-8"><span class="step-icon flex w-12 h-12 items-center justify-center rounded-full bg-[#d8f36a] text-2xl text-[#143e32]"><UIcon name="i-lucide-compass" /></span><span class="step-number text-sm font-bold text-[#94a18e]">01</span></div><h3>Follow a good lead.</h3><p>Explore businesses by what they do and where they are. Find something you weren’t even looking for.</p></article>
            <article class="step flex flex-col min-h-[245px] rounded-xl bg-[#fcfcf8] p-7"><div class="step-top flex items-center justify-between mb-8"><span class="step-icon flex w-12 h-12 items-center justify-center rounded-full bg-[#d8f36a] text-2xl text-[#143e32]"><UIcon name="i-lucide-scan-eye" /></span><span class="step-number text-sm font-bold text-[#94a18e]">02</span></div><h3>Get the fuller picture.</h3><p>See business details, check ownership information, and read first-hand customer experiences.</p></article>
            <article class="step flex flex-col min-h-[245px] rounded-xl bg-[#fcfcf8] p-7"><div class="step-top flex items-center justify-between mb-8"><span class="step-icon flex w-12 h-12 items-center justify-center rounded-full bg-[#d8f36a] text-2xl text-[#143e32]"><UIcon name="i-lucide-messages-square" /></span><span class="step-number text-sm font-bold text-[#94a18e]">03</span></div><h3>Pass your experience on.</h3><p>Tried a business? Share what went well and what could be better. Help the next person choose.</p></article>
          </div>
          <div class="verification-note flex items-start gap-3 mt-6 max-w-[790px] text-sm text-[#526457]"><UIcon name="i-lucide-badge-info" /><p><strong>Clear signals, honest expectations.</strong> “Ownership verified” means we checked who manages a profile. It isn’t a guarantee of service quality.</p></div>
        </div>
      </section>

      <section id="for-businesses" class="owner-section container grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-24 max-md:py-16" aria-labelledby="owner-heading">
        <div class="owner-visual relative overflow-hidden rounded-xl bg-[#dfe9d7] min-h-[400px] max-md:min-h-[300px]"><img src="/images/business-owners.png" alt="Two creative business owners collaborating in a bright design studio" width="1536" height="1024" loading="lazy"><div class="owner-image-caption absolute left-4 bottom-4 rounded-lg bg-[#d8f36a] px-4 py-3 text-xs font-bold tracking-wide text-[#143e32]"><span><UIcon name="i-lucide-sparkles" /> BUILT FOR THE ONES BUILDING SOMETHING.</span></div></div>
        <div class="owner-copy max-w-[510px]"><p class="eyebrow">SMALL BUSINESS. BIG POSSIBILITY.</p><h2 id="owner-heading">You do good work.<br>Let people<br><span class="serif-word">get to know it.</span></h2><p>Give your business a home beyond a social feed. One shareable profile for your story, your links, and your customers’ experiences.</p><ul class="owner-benefits flex flex-col gap-3 my-7"><li><UIcon name="i-lucide-check" /> Your business, in one place</li><li><UIcon name="i-lucide-check" /> Customer feedback you can respond to</li><li><UIcon name="i-lucide-check" /> A link worth sharing</li></ul><UButton class="owner-cta !bg-[#143e32] !text-white !rounded-lg !px-5 !py-3 !font-semibold hover:!bg-[#24563f]" trailing-icon="i-lucide-arrow-up-right" @click="openProfile()">Explore an example profile</UButton><span class="owner-footnote block mt-3 text-xs text-[#657069]">A first look. Business submissions are coming next.</span></div>
      </section>

      <section class="closing-section container flex flex-wrap items-center justify-between gap-7 rounded-xl bg-[#143e32] px-9 py-12 max-md:px-6 text-white"><span class="closing-star text-5xl text-[#d8f36a]" aria-hidden="true">✳</span><div><p>There’s a whole world of good businesses.</p><h2>Go find <span class="serif-word">your people.</span></h2></div><UButton to="#explore" class="closing-cta !bg-[#d8f36a] !text-[#143e32] !rounded-lg !px-5 !py-3 !font-semibold" trailing-icon="i-lucide-arrow-up-right">Start exploring</UButton></section>
    </main>
    <footer class="site-footer container flex flex-wrap items-center justify-between gap-5 py-12 text-sm text-[#657069]"><LandingCredaLogo /><p>Good businesses deserve to be known.</p><span>Starting in Nigeria. Built for discovery.</span><a href="#" aria-label="Back to top"><UIcon name="i-lucide-arrow-up" /></a></footer>

    <UModal v-model:open="profileOpen" :title="selectedBusiness.name" description="Illustrative profile preview — this is not a live business listing." :ui="{ content: 'profile-modal sm:max-w-xl', body: 'p-6 sm:p-8' }">
      <template #body>
        <div class="modal-business-heading flex items-center gap-4 mb-6"><span class="business-logo flex w-14 h-14 shrink-0 items-center justify-center rounded-xl text-3xl" :class="selectedBusiness.theme"><UIcon :name="selectedBusiness.icon" /></span><div><span class="modal-category text-xs font-bold uppercase tracking-widest text-[#3d674e]">{{ selectedBusiness.category }}</span><p><UIcon name="i-lucide-map-pin" />{{ selectedBusiness.location }}, {{ selectedBusiness.location === 'Online' ? 'available remotely' : 'Nigeria' }}</p></div></div>
        <h3 class="modal-tagline text-2xl font-bold text-[#143e32] mb-3">{{ selectedBusiness.description }}</h3><p class="modal-description text-sm leading-7 text-[#657069] mb-6">{{ selectedBusiness.detail }}</p>
        <div class="modal-status flex items-start gap-3 rounded-lg bg-[#eff4e7] p-4 text-sm mb-5"><UIcon name="i-lucide-info" /><div><strong>Example profile</strong><p>Ownership has not been checked. This preview has no customer reviews.</p></div></div>
        <div class="modal-reviews rounded-lg border border-[#dfe4db] p-5 mb-6"><UIcon name="i-lucide-message-circle" /><h4>A space for real experiences.</h4><p>On live profiles, customers will be able to leave a rating and a written review. Businesses can respond, but can’t edit or remove customer feedback.</p></div>
        <UButton block color="primary" class="modal-close-button !bg-[#143e32] !text-white" @click="profileOpen = false">Keep exploring <UIcon name="i-lucide-arrow-right" /></UButton>
      </template>
    </UModal>
  </div>
</template>
