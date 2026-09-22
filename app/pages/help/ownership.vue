<template>
  <InformationPage
    path="/help/ownership"
    eyebrow="Know who is behind the profile"
    title="Ownership verification"
    description="The verified check tells you Creda has reviewed a representative’s connection to the business. Here’s what that means and how to apply."
  >
    <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
      <div class="flex items-center gap-3">
        <BusinessesVerifiedMark />
        <h2 class="text-2xl font-semibold tracking-tight text-[#143e32]">
          A check on who manages the profile
        </h2>
      </div>
      <p class="mt-4 max-w-3xl text-base leading-8 text-[#5c6e60]">
        Ownership verification is separate from publishing a listing. A business can be visible on
        Creda before ownership is verified. The check does not certify a product, guarantee service
        quality, or confirm every claim made by a business.
      </p>
    </section>
    <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
      <h2 class="text-2xl font-semibold tracking-tight text-[#143e32]">
        Claim a profile added by Creda
      </h2>
      <ol class="mt-6 space-y-6">
        <li class="flex gap-4">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf3e1] font-semibold text-[#315b3a]"
            >1</span
          >
          <div>
            <h3 class="font-semibold text-[#143e32]">Find your business</h3>
            <p class="mt-1 text-sm leading-7 text-[#5c6e60]">
              Open its profile and choose Claim this business. Sign in with a verified email address
              to continue.
            </p>
          </div>
        </li>
        <li class="flex gap-4">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf3e1] font-semibold text-[#315b3a]"
            >2</span
          >
          <div>
            <h3 class="font-semibold text-[#143e32]">Provide an official channel</h3>
            <p class="mt-1 text-sm leading-7 text-[#5c6e60]">
              Choose a business email, website, social profile, or another official channel. Explain
              how Creda can independently check your connection. Never send passwords or identity
              documents.
            </p>
          </div>
        </li>
        <li class="flex gap-4">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf3e1] font-semibold text-[#315b3a]"
            >3</span
          >
          <div>
            <h3 class="font-semibold text-[#143e32]">Creda reviews the request</h3>
            <p class="mt-1 text-sm leading-7 text-[#5c6e60]">
              Your evidence is private to you and Creda administrators. The listing stays public
              while it is reviewed. More than one person can submit a claim; submitting first does
              not automatically establish ownership.
            </p>
          </div>
        </li>
      </ol>
      <UButton
        to="/explore"
        trailing-icon="i-lucide-arrow-right"
        class="mt-6 !rounded-xl !bg-[#143e32] !px-5 !py-3 !text-white"
        >Find your business</UButton
      >
    </section>
    <div class="grid gap-6 md:grid-cols-2">
      <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
        <h2 class="text-xl font-semibold text-[#143e32]">Already manage your listing?</h2>
        <p class="mt-3 text-sm leading-7 text-[#5c6e60]">
          Open Your businesses in your account, select the business, and request ownership
          verification. You can check the request’s status and any review note there.
        </p>
        <NuxtLink
          to="/dashboard/businesses"
          class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#315b3a] hover:underline"
          >Go to your businesses <UIcon name="i-lucide-arrow-right" aria-hidden="true"
        /></NuxtLink>
      </section>
      <section class="rounded-2xl bg-[#eaf3e1] p-6 sm:p-8">
        <h2 class="text-xl font-semibold text-[#143e32]">After the decision</h2>
        <p class="mt-3 text-sm leading-7 text-[#526a58]">
          An approved claim lets you manage the profile and shows the verified check. If Creda
          cannot confirm the connection, review the reason and provide clearer evidence.
          Verification can be removed if the business identity changes or an administrator revokes
          it.
        </p>
      </section>
    </div>
  </InformationPage>
</template>
