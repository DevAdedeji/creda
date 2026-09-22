<template>
  <InformationPage
    path="/about"
    eyebrow="Good businesses deserve to be known"
    title="About Creda"
    description="Creda helps people discover businesses in Nigeria and learn from the experiences of the people who use them."
  >
    <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
      <h2 class="text-2xl font-semibold tracking-tight text-[#143e32]">
        A little more context before you choose
      </h2>
      <p class="mt-4 max-w-3xl text-base leading-8 text-[#5c6e60]">
        A business name is a starting point. What does it offer? Where does it operate? How can you
        reach it? What have other customers experienced? Creda brings those details together for
        online businesses and places you can visit in person.
      </p>
      <p class="mt-4 max-w-3xl text-base leading-8 text-[#5c6e60]">
        You can browse by category and location, save businesses for later, or describe what you
        need using AI search. Customer reviews add another perspective to the information on each
        profile.
      </p>
      <UButton
        to="/explore"
        trailing-icon="i-lucide-arrow-right"
        class="mt-6 !rounded-xl !bg-[#143e32] !px-5 !py-3 !text-white"
        >Find a business</UButton
      >
    </section>
    <div class="grid gap-6 md:grid-cols-2">
      <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
        <UIcon name="i-lucide-messages-square" class="size-7 text-[#4e7356]" aria-hidden="true" />
        <h2 class="mt-4 text-xl font-semibold text-[#143e32]">Experiences from the community</h2>
        <p class="mt-3 text-sm leading-7 text-[#5c6e60]">
          Reviews come from signed-in users with a verified email address. People can post publicly
          as Anonymous, add photos, and update their review as their experience changes.
        </p>
        <NuxtLink
          to="/help/reviews"
          class="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
          >How reviews work <UIcon name="i-lucide-arrow-right" aria-hidden="true"
        /></NuxtLink>
      </section>
      <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
        <UIcon name="i-lucide-store" class="size-7 text-[#4e7356]" aria-hidden="true" />
        <h2 class="mt-4 text-xl font-semibold text-[#143e32]">Space for your business</h2>
        <p class="mt-3 text-sm leading-7 text-[#5c6e60]">
          Owners can list their business, share services and photos, reply to reviews, and use a
          short Creda link as a shareable business page. Some profiles are added by Creda from
          public information and can be claimed by a representative.
        </p>
        <NuxtLink
          to="/businesses/new"
          class="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
          >List your business <UIcon name="i-lucide-arrow-right" aria-hidden="true"
        /></NuxtLink>
      </section>
    </div>
    <section class="rounded-2xl bg-[#eaf3e1] p-6 sm:p-8">
      <h2 class="text-xl font-semibold text-[#143e32]">Information to help you decide</h2>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-[#526a58]">
        A listing is not an endorsement. The verified check means Creda has checked the connection
        of the person managing a profile to the business; it does not guarantee service quality.
        Check the details that matter to you with the business before making plans or a purchase.
      </p>
      <NuxtLink
        to="/help/ownership"
        class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
        >Understand ownership verification <UIcon name="i-lucide-arrow-right" aria-hidden="true"
      /></NuxtLink>
    </section>
  </InformationPage>
</template>
