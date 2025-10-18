<template>
  <div>
   <NuxtPage />
  </div>
</template>
<script setup>
onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
})
</script>
