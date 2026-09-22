<template>
  <InformationPage
    path="/contact"
    eyebrow="Let’s get you to the right place"
    title="Contact & help"
    description="Need to correct a listing, report a review, or claim your business? Start with the option that fits."
  >
    <div class="grid gap-6 md:grid-cols-2">
      <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
        <UIcon name="i-lucide-flag" class="size-7 text-[#4e7356]" aria-hidden="true" />
        <h2 class="mt-4 text-xl font-semibold text-[#143e32]">Report a business or review</h2>
        <p class="mt-3 text-sm leading-7 text-[#5c6e60]">
          Open the business profile and choose Report this business, or open the three-dot menu on a
          review and choose Report review. Sign in and explain what needs attention so the report is
          connected to the right content.
        </p>
        <NuxtLink
          to="/explore"
          class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
          >Find the business <UIcon name="i-lucide-arrow-right" aria-hidden="true"
        /></NuxtLink>
      </section>
      <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
        <UIcon name="i-lucide-store" class="size-7 text-[#4e7356]" aria-hidden="true" />
        <h2 class="mt-4 text-xl font-semibold text-[#143e32]">Claim or update your business</h2>
        <p class="mt-3 text-sm leading-7 text-[#5c6e60]">
          If Creda added your profile, use Claim this business on the listing. If you already manage
          it, open Your businesses to edit your details, photos, links and hours.
        </p>
        <NuxtLink
          to="/help/ownership"
          class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
          >How ownership works <UIcon name="i-lucide-arrow-right" aria-hidden="true"
        /></NuxtLink>
      </section>
    </div>
    <section class="rounded-2xl bg-[#eaf3e1] p-6 sm:p-8">
      <h2 class="text-xl font-semibold text-[#143e32]">Trying to contact a listed business?</h2>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-[#526a58]">
        Use the website, social profile, phone or contact link on its Creda profile. Creda is a
        discovery platform; the business handles its own products, services and customer enquiries.
      </p>
      <NuxtLink
        to="/explore"
        class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
        >Explore businesses <UIcon name="i-lucide-arrow-right" aria-hidden="true"
      /></NuxtLink>
    </section>
  </InformationPage>
</template>
