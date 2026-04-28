<template>
  <el-container class="layout">
    <el-aside width="220px">
      <div class="brand">Eco Admin</div>
      <el-menu
        :router="true"
        :default-active="$route.path"
        background-color="#0b1220"
        text-color="#b8c5d6"
        active-text-color="#64b5f6"
      >
        <el-menu-item index="/">
          <el-icon><House /></el-icon>
          <span>概览</span>
        </el-menu-item>
        <el-menu-item
          v-for="m in menus"
          :key="m.path"
          :index="m.path"
        >
          <span>{{ m.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <el-button
          class="nav-to-screen-btn"
          type="primary"
          size="large"
          :icon="Monitor"
          @click="openDashboard"
        >
          进入大屏界面
        </el-button>
        <div class="header-right">
          <span class="user">{{ auth.username }}</span>
          <el-button type="danger" link @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { House, Monitor } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const menus = computed(() => auth.menus)

const dashboardBase =
  import.meta.env.VITE_DASHBOARD_PUBLIC_URL || 'http://localhost:3000'

function openDashboard() {
  const url = `${String(dashboardBase).replace(/\/$/, '')}/#/`
  window.location.assign(url)
}

async function handleLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<style scoped lang="scss">
.layout {
  min-height: 100vh;
}
.brand {
  color: #fff;
  font-weight: 600;
  padding: 16px;
  background: #060b14;
  letter-spacing: 0.06em;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #e4e7ec;
  background: #fff;
  padding: 0 20px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.nav-to-screen-btn {
  font-weight: 600;
  letter-spacing: 0.04em;
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.45);
  border: none;
  background: linear-gradient(135deg, #409eff 0%, #1d39c4 100%);
  padding: 12px 22px;
}
.nav-to-screen-btn:hover {
  box-shadow: 0 6px 18px rgba(64, 158, 255, 0.55);
  filter: brightness(1.06);
}
.user {
  font-size: 14px;
}
</style>
