<template>
  <div class="wrap">
    <header>
      <h2>Lịch sử quay số - {{ campaign?.name || 'Chưa có kỳ quay' }}</h2>
      <select v-model.number="selectedCampaignId" @change="loadHistory">
        <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </header>
    <table v-if="winners.length" class="table">
      <thead>
        <tr>
          <th>Thời gian</th>
          <th>Giải</th>
          <th>Mã</th>
          <th>Người trúng</th>
          <th>SĐT</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="w in winners" :key="w.id">
          <td>{{ new Date(w.created_at).toLocaleString() }}</td>
          <td>{{ w.prize_name }}</td>
          <td>{{ w.code }}</td>
          <td>{{ w.full_name }}</td>
          <td>{{ maskPhone(w.phone) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>Chưa có lượt quay nào cho kỳ này.</p>
  </div>
</template>

<script setup lang="ts">
const campaigns = ref<any[]>([])
const campaign = ref<any | null>(null)
const winners = ref<any[]>([])
const selectedCampaignId = ref<number>()

onMounted(async () => {
  const cs = await $fetch('/api/campaigns')
  campaigns.value = cs.campaigns || []
  await loadHistory()
})

async function loadHistory () {
  const data = await $fetch('/api/history', { query: { campaignId: selectedCampaignId.value } })
  campaign.value = data.campaign
  winners.value = data.winners || []
  if (campaigns.value.length && !selectedCampaignId.value) selectedCampaignId.value = campaigns.value[0].id
}

function maskPhone (phone?: string) {
  if (!phone) return ''
  return phone.slice(0, -3) + 'xxx'
}
</script>

<style scoped>
.wrap { padding: 20px; color: #fff; background: #1f1f1f; min-height: 100vh; }
header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 8px 10px; border-bottom: 1px solid #333; }
</style>


