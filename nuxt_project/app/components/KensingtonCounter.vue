<template>
  <div class="counter">
    <div v-for="(d, i) in digits" :key="i" class="digit">
      <span class="num">{{ d }}</span>
    </div>
  </div>
  
</template>

<script setup lang="ts">
const props = defineProps<{ value: string }>()
const digits = computed(() => (props.value || '').padStart(7, '0').slice(-7).split(''))
</script>

<style scoped>
.counter {
  display: flex;
  gap: 18px;
  padding: 24px 36px;
  background: #222;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5) inset, 0 8px 24px rgba(0,0,0,0.6);
}
.digit {
  width: 90px;
  height: 120px;
  border: 4px solid #ffc107;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, #2a2a2a 0%, #111 100%);
  box-shadow: 0 0 25px rgba(255, 193, 7, 0.25), inset 0 0 12px rgba(0,0,0,0.6);
}
.num {
  font-size: 64px;
  font-weight: 700;
  color: #ffd54f;
  text-shadow: 0 0 10px rgba(255, 208, 0, 0.75), 0 0 30px rgba(255, 208, 0, 0.4);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
}
</style>


