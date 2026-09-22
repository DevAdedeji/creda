<script setup lang="ts">
import { MAX_REVIEW_PHOTOS } from '~~/shared/reviews'
</script>

<template>
  <InformationPage
    path="/help/reviews"
    eyebrow="From the community"
    title="Review guidelines"
    description="Share a first-hand experience that helps someone understand what to expect from a business."
  >
    <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
      <h2 class="text-2xl font-semibold tracking-tight text-[#143e32]">Make your review useful</h2>
      <ul class="mt-5 space-y-5 text-sm leading-7 text-[#5c6e60]">
        <li>
          <strong class="block text-base text-[#143e32]">Write about your own experience</strong
          >Explain what you used, what happened, and when. Be specific about what went well or could
          have been better.
        </li>
        <li>
          <strong class="block text-base text-[#143e32]">Keep it relevant and respectful</strong
          >Discuss the service or product. Avoid spam, personal attacks, threats, and someone else’s
          private information.
        </li>
        <li>
          <strong class="block text-base text-[#143e32]">Add photos with care</strong>You can add up
          to {{ MAX_REVIEW_PHOTOS }} photos. Share images you have permission to use and avoid
          exposing private details, such as phone numbers or payment information.
        </li>
        <li>
          <strong class="block text-base text-[#143e32]"
            >Be transparent about your experience</strong
          >Do not make up an experience or use a review to promote a business. Business owners
          cannot review their own listing.
        </li>
      </ul>
    </section>
    <div class="grid gap-6 md:grid-cols-2">
      <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
        <h2 class="text-xl font-semibold text-[#143e32]">Posting and updating</h2>
        <p class="mt-3 text-sm leading-7 text-[#5c6e60]">
          Sign in and verify your email, open the business profile, and select Write a review.
          Choose a rating and the month of your experience, then describe it in your own words.
        </p>
        <p class="mt-3 text-sm leading-7 text-[#5c6e60]">
          Reviews appear after submission. You can edit or delete your review from its three-dot
          menu. Each account can have one review per business, so update the existing review when
          you have more to share.
        </p>
      </section>
      <section class="rounded-2xl border border-[#dfe6dc] bg-white p-6 sm:p-8">
        <h2 class="text-xl font-semibold text-[#143e32]">Posting as Anonymous</h2>
        <p class="mt-3 text-sm leading-7 text-[#5c6e60]">
          Choose anonymous posting before submitting your review to show Anonymous instead of your
          name publicly. You still need a signed-in account with a verified email.
        </p>
        <p class="mt-3 text-sm leading-7 text-[#5c6e60]">
          Creda retains the account connection for managing reviews. Your review text and photos are
          public, so leave out details that identify you if you do not want to be recognised.
        </p>
      </section>
    </div>
    <section class="rounded-2xl bg-[#eaf3e1] p-6 sm:p-8">
      <h2 class="text-xl font-semibold text-[#143e32]">When something doesn’t look right</h2>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-[#526a58]">
        Use Report review in the review’s three-dot menu and explain the issue. Reports are private
        and do not automatically remove content. Creda administrators review reports and can remove
        reviews when action is needed.
      </p>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-[#526a58]">
        The useful and not useful buttons let readers give feedback on a review. They do not replace
        reporting content that needs attention. Business owners can reply to reviews, but cannot
        edit a customer’s review.
      </p>
      <UButton
        to="/explore"
        trailing-icon="i-lucide-arrow-right"
        class="mt-6 !rounded-xl !bg-[#143e32] !px-5 !py-3 !text-white"
        >Find a business to review</UButton
      >
    </section>
  </InformationPage>
</template>
