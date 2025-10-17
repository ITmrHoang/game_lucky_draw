<template>
  <div class="wrap">
    <aside class="menu">
      <button class="hamburger" @click="showMenu = !showMenu">☰</button>
      <div v-if="showMenu" class="menu-panel">
        <div class="section">
          <label>Chiến dịch</label>
          <select v-model.number="selectedCampaignId" @change="loadPrizes">
            <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="section">
          <label>Giải thưởng</label>
          <select v-model.number="selectedPrizeId">
            <option v-for="p in prizes" :key="p.id" :value="p.id">{{ p.name }} ({{ p.winners_count }}/{{ p.winners_quota }})</option>
          </select>
        </div>
      </div>
    </aside>

    <main class="stage">
      <KensingtonCounter :value="displayValue" />
      <button class="spin" :disabled="spinning || !selectedPrizeId" @click="onSpin(false)">
        {{ spinning ? 'Đang quay...' : 'Quay số' }}
      </button>
    </main>

    <dialog ref="confirmDialog">
      <div class="result">
        <h3>Quay thêm vượt số lượng?</h3>
        <p>Giải này đã đủ số người trúng. Bạn có chắc muốn quay thêm?</p>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
          <button @click="closeConfirm()">Hủy</button>
          <button @click="confirmForce()">Quay thêm</button>
        </div>
      </div>
    </dialog>

    <dialog ref="resultDialog">
      <div class="result">
        <h3>Kết quả</h3>
        <p v-if="winner">Mã: <b>{{ winner.code }}</b></p>
        <p v-if="winner">Người trúng: {{ winner.fullName }} ({{ winner.phone }})</p>
        <button @click="closeDialog">Đóng</button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const showMenu = ref(false)
const campaigns = ref<any[]>([])
const prizes = ref<any[]>([])
const selectedCampaignId = ref<number>()
const selectedPrizeId = ref<number>()

const displayValue = ref('0000000')
const spinning = ref(false)
const winner = ref<{ code: string; fullName: string; phone: string } | null>(null)
const resultDialog = ref<HTMLDialogElement | null>(null)
const confirmDialog = ref<HTMLDialogElement | null>(null)
let lastSpinPayload: { campaignId: number; prizeId: number } | null = null

onMounted(async () => {
  const { data } = await useFetch('/api/campaigns')
  campaigns.value = data.value?.campaigns ?? []
  if (campaigns.value.length) {
    selectedCampaignId.value = campaigns.value[0].id
    await loadPrizes()
  }
})

async function loadPrizes () {
  if (!selectedCampaignId.value) return
  const { data } = await useFetch('/api/prizes', { query: { campaignId: selectedCampaignId.value } })
  prizes.value = data.value?.prizes ?? []
  selectedPrizeId.value = prizes.value[0]?.id
}

async function onSpin (force: boolean) {
  if (!selectedCampaignId.value || !selectedPrizeId.value) return
  spinning.value = true
  // Hiệu ứng quay: tăng số giả trong 2s
  await animateCounter(2000)
  const payload = { campaignId: selectedCampaignId.value, prizeId: selectedPrizeId.value, force }
  const { data } = await useFetch('/api/spin', {
    method: 'POST',
    body: payload
  })
  spinning.value = false
  if (data.value?.exhausted) {
    lastSpinPayload = { campaignId: payload.campaignId, prizeId: payload.prizeId }
    confirmDialog.value?.showModal()
    return
  }
  if (data.value) {
    winner.value = data.value as any
    displayValue.value = toDigitsString(winner.value.code)
    resultDialog.value?.showModal()
  }
}

function closeDialog () { resultDialog.value?.close() }
function closeConfirm () { confirmDialog.value?.close() }
async function confirmForce () {
  closeConfirm()
  if (lastSpinPayload) {
    await onSpin(true)
  }
}

function toDigitsString (s: string) {
  const digits = s.replace(/\D/g, '')
  return digits.padStart(7, '0').slice(-7)
}

async function animateCounter (ms: number) {
  const start = Date.now()
  return new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      const t = Date.now() - start
      const rnd = String(Math.floor(Math.random() * 1_000_0000)).padStart(7, '0')
      displayValue.value = rnd
      if (t >= ms) { clearInterval(timer); resolve() }
    }, 60)
  })
}
</script>

<script lang="ts">
export default { name: 'QuaySoPage' }
</script>

<style scoped>
.wrap { display: flex; min-height: 100vh; background: #1f1f1f; color: #fff; }
.menu { position: relative; }
.hamburger { margin: 16px; padding: 8px 12px; font-size: 18px; }
.menu-panel { position: absolute; top: 48px; left: 16px; background: #2a2a2a; padding: 12px; border-radius: 8px; width: 240px; }
.section { margin-bottom: 12px; display: grid; gap: 6px; }
.stage { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; }
.spin { padding: 12px 24px; font-size: 18px; border-radius: 8px; }
dialog { border: none; border-radius: 10px; padding: 16px; }

/* Minimal styles for the counter container resemblance */
</style>

<template #components>
  <KensingtonCounter />
</template>

<!-- Kensington-style Counter component -->
<script lang="ts" setup name="KensingtonCounter">
</script>


