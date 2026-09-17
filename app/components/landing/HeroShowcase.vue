<script setup lang="ts">
defineEmits<{ preview: [] }>()
</script>

<template>
  <div class="hero-showcase">
    <div class="showcase-orbit orbit-one" aria-hidden="true" />
    <div class="showcase-orbit orbit-two" aria-hidden="true" />
    <div class="showcase-topline"><span class="tiny-spark" aria-hidden="true">✳</span> GOOD FINDS START HERE.</div>
    <div class="hero-profile">
      <div class="profile-card-top"><span class="studio-mark"><UIcon name="i-lucide-orbit" /></span><span class="example-label">EXAMPLE PROFILE</span></div>
      <h2>Kora Studio<span>↗</span></h2>
      <p>Small studio. Big ideas.</p>
      <div class="profile-meta"><UIcon name="i-lucide-map-pin" /> Lagos, Nigeria <span>·</span> Design studio</div>
      <div class="profile-divider" />
      <div class="profile-information"><span><UIcon name="i-lucide-building-2" /> Get to know the business</span><span><UIcon name="i-lucide-message-circle" /> A space for customer experiences</span></div>
      <button class="profile-link" @click="$emit('preview')">Take a closer look <UIcon name="i-lucide-arrow-up-right" /></button>
    </div>
    <div class="context-note"><span class="note-icon"><UIcon name="i-lucide-scan-eye" /></span><div>A little context.<br><strong>A lot more confidence.</strong></div></div>
    <div class="showcase-bottomline"><span>Less guesswork. More discovery.</span><span aria-hidden="true">↗</span></div>
  </div>
</template>
