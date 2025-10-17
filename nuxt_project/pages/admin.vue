<template>
  <div class="wrap">
    <h2>Quản trị</h2>
    <div style="margin-bottom:12px;">
      <button @click="logout">Đăng xuất</button>
    </div>
    <section class="card">
      <h3>Tạo kỳ quay</h3>
      <div class="row">
        <input v-model="campaignName" placeholder="Tên kỳ quay" />
        <label><input type="checkbox" v-model="onlyOne" /> Một người chỉ trúng 1 lần</label>
        <button @click="createCampaign">Tạo</button>
      </div>
    </section>

    <section class="card">
      <h3>Tạo giải thưởng</h3>
      <div class="row">
        <select v-model.number="campaignId">
          <option :value="undefined">Chọn kỳ quay</option>
          <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model="prizeName" placeholder="Tên giải" />
        <input v-model.number="winnersQuota" type="number" min="1" placeholder="Số người trúng" />
        <button :disabled="!campaignId || !prizeName" @click="createPrize">Tạo</button>
      </div>
    </section>

    <section class="card">
      <h3>Import Codes (CSV)</h3>
      <div class="row">
        <select v-model.number="campaignId">
          <option :value="undefined">Chọn kỳ quay</option>
          <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input ref="codesFile" type="file" accept=".csv" />
        <button :disabled="!campaignId" @click="uploadCodes">Upload</button>
        <a href="/samples/codes_sample.csv" download>File mẫu</a>
      </div>
    </section>

    <section class="card">
      <h3>Import Presets (CSV)</h3>
      <div class="row">
        <select v-model.number="selectedPrizeForPreset">
          <option :value="undefined">Chọn giải</option>
          <option v-for="p in prizesByCampaign" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <input ref="presetsFile" type="file" accept=".csv" />
        <button :disabled="!selectedPrizeForPreset" @click="uploadPresets">Upload</button>
        <a href="/samples/presets_sample.csv" download>File mẫu</a>
      </div>
    </section>

    <section class="card">
      <h3>Danh sách kỳ quay</h3>
      <ul>
        <li v-for="c in campaigns" :key="c.id">#{{ c.id }} - {{ c.name }}</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
const campaigns = ref<any[]>([])
const campaignName = ref('')
const onlyOne = ref(true)
const campaignId = ref<number>()
const prizeName = ref('')
const winnersQuota = ref(1)
const codesFile = ref<HTMLInputElement | null>(null)
const presetsFile = ref<HTMLInputElement | null>(null)
const selectedPrizeForPreset = ref<number>()
const prizesByCampaign = ref<any[]>([])

onMounted(loadCampaigns)

async function loadCampaigns () {
  const data = await $fetch('/api/campaigns')
  campaigns.value = data.campaigns || []
}

async function createCampaign () {
  if (!campaignName.value) return
  await $fetch('/api/campaigns', { method: 'POST', body: { name: campaignName.value, only_one_win_per_person: onlyOne.value } })
  campaignName.value = ''
  await loadCampaigns()
}

async function createPrize () {
  if (!campaignId.value || !prizeName.value) return
  await $fetch('/api/prizes', { method: 'POST', body: { campaign_id: campaignId.value, name: prizeName.value, winners_quota: winnersQuota.value } })
  prizeName.value = ''
}

async function logout () {
  await $fetch('/api/admin/logout', { method: 'POST' })
  window.location.href = '/admin_login'
}

watch(campaignId, async (val) => {
  if (!val) { prizesByCampaign.value = []; return }
  const data = await $fetch('/api/prizes', { query: { campaignId: val } })
  prizesByCampaign.value = data.prizes || []
})

async function uploadCodes () {
  if (!campaignId.value || !codesFile.value?.files?.[0]) return
  const fd = new FormData()
  fd.append('campaignId', String(campaignId.value))
  fd.append('file', codesFile.value.files[0])
  await $fetch('/api/import/codes', { method: 'POST', body: fd })
  codesFile.value.value = ''
}

async function uploadPresets () {
  if (!selectedPrizeForPreset.value || !presetsFile.value?.files?.[0]) return
  const fd = new FormData()
  fd.append('prizeId', String(selectedPrizeForPreset.value))
  fd.append('file', presetsFile.value.files[0])
  await $fetch('/api/import/presets', { method: 'POST', body: fd })
  presetsFile.value.value = ''
}
</script>

<style scoped>
.wrap { padding: 20px; background: #121212; color: #fff; min-height: 100vh; }
.card { background: #1f1f1f; padding: 16px; border-radius: 10px; margin-bottom: 16px; }
.row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
input, select, button { padding: 8px 10px; border-radius: 6px; border: 1px solid #333; background: #222; color: #fff; }
button { background: #2f6fed; border: none; }
</style>


