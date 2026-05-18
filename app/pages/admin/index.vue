<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

await navigateTo('/admin/listings', { replace: true })
</script>

<template>
  <div />
</template>
