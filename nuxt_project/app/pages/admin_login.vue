<template>
  <div class="wrap">
    <form class="card" @submit.prevent="login">
      <h3>Đăng nhập Admin</h3>
      <input v-model="password" type="password" placeholder="Mật khẩu" />
      <button :disabled="pending || !password" type="submit">{{ pending ? 'Đang đăng nhập...' : 'Đăng nhập' }}</button>
      <p v-if="errorMsg" class="err">{{ errorMsg }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
const password = ref('')
const pending = ref(false)
const errorMsg = ref('')
const router = useRouter()

async function login () {
  pending.value = true
  errorMsg.value = ''
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: password.value } })
    router.replace('/admin')
  } catch (e: any) {
    errorMsg.value = e?.statusMessage || 'Đăng nhập thất bại'
  } finally {
    pending.value = false
  }
}
</script>

<style scoped>
.wrap { display: grid; place-items: center; min-height: 100vh; background: #121212; }
.card { width: 320px; display: grid; gap: 10px; padding: 20px; background: #1f1f1f; color: #fff; border-radius: 10px; }
input, button { padding: 10px 12px; border-radius: 8px; border: 1px solid #333; background: #222; color: #fff; }
button { background: #2f6fed; border: none; }
.err { color: #ff6b6b; font-size: 13px; }
</style>


