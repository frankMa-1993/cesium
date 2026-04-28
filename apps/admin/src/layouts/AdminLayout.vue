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
        <span class="user">{{ auth.username }}</span>
        <el-button type="danger" link @click="handleLogout">退出</el-button>
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
import { House } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const menus = computed(() => auth.menus)

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
  justify-content: flex-end;
  gap: 12px;
  border-bottom: 1px solid #e4e7ec;
  background: #fff;
}
.user {
  font-size: 14px;
}
</style>
