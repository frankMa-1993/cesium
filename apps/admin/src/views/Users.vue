<template>
  <div>
    <el-space wrap>
      <el-input
        v-model="keyword"
        placeholder="搜索账号/姓名/手机号"
        clearable
        style="width: 240px"
        @clear="load"
      />
      <el-button type="primary" @click="load">查询</el-button>
      <el-button
        v-permission="'user:write'"
        :disabled="!selection.length"
        @click="batchStatus('enabled')"
      >
        批量启用
      </el-button>
      <el-button
        v-permission="'user:write'"
        :disabled="!selection.length"
        @click="batchStatus('disabled')"
      >
        批量禁用
      </el-button>
      <el-button
        v-permission="'user:write'"
        :disabled="selection.length !== 1"
        @click="openRole"
      >
        分配角色
      </el-button>
      <el-button
        v-permission="'user:write'"
        :disabled="!selection.length"
        @click="batchReset"
      >
        重置密码
      </el-button>
      <el-button v-permission="'user:export'" @click="handleExport">导出</el-button>
    </el-space>

    <el-table
      :data="items"
      class="mt"
      border
      @selection-change="(r: UserRow[]) => (selection = r)"
    >
      <el-table-column type="selection" width="42" />
      <el-table-column prop="username" label="账号" />
      <el-table-column prop="displayName" label="姓名" />
      <el-table-column prop="deptName" label="部门" />
      <el-table-column label="角色">
        <template #default="{ row }">
          {{ row.roles.map((x: { name: string }) => x.name).join('、') }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90" />
      <el-table-column label="最后登录" width="180">
        <template #default="{ row }">
          {{
            row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : '—'
          }}
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="mt"
      v-model:current-page="page"
      v-model:page-size="pageSize"
      layout="total, prev, pager, next"
      :total="total"
      @current-change="load"
    />

    <el-dialog v-model="roleVisible" title="分配角色" width="420px">
      <el-checkbox-group v-if="roles.length" v-model="roleIds">
        <el-checkbox v-for="r in roles" :key="r.id" :label="r.id">{{ r.name }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="roleVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRoles">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { http } from '@/utils/request'

interface UserRow {
  id: string
  username: string
  displayName: string
  deptName: string
  roles: { id: string; code: string; name: string }[]
  status: string
  lastLoginAt?: string | null
}

const items = ref<UserRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const selection = ref<UserRow[]>([])
const roleVisible = ref(false)
const roleIds = ref<string[]>([])
const roles = ref<{ id: string; name: string }[]>([])

async function load() {
  const { data } = await http.get<{
    total: number
    items: UserRow[]
  }>('/users', {
    params: {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
    },
  })
  total.value = data.total
  items.value = data.items
}

async function batchStatus(status: 'enabled' | 'disabled') {
  await http.post('/users/batch/status', {
    ids: selection.value.map((x) => x.id),
    status,
  })
  ElMessage.success('已更新')
  await load()
}

async function batchReset() {
  const { data } = await http.post<{ devTempPassword?: string }>(
    '/users/batch/reset-password',
    { ids: selection.value.map((x) => x.id) },
  )
  ElMessage.success('已重置')
  if (data.devTempPassword)
    ElMessage.info(`演示临时密码 ${data.devTempPassword}`)
  await load()
}

function openRole() {
  roleVisible.value = true
  roleIds.value = [...(selection.value[0]?.roles.map((x) => x.id) ?? [])]
}

async function saveRoles() {
  const uid = selection.value[0]?.id
  if (!uid)
    return
  await http.post('/users/assign-roles', {
    userId: uid,
    roleIds: roleIds.value,
  })
  ElMessage.success('角色已保存')
  roleVisible.value = false
  await load()
}

async function handleExport() {
  const res = await http.get<Blob>('/users/export', { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = 'users.csv'
  a.click()
  URL.revokeObjectURL(url)
}

async function loadRoles() {
  const { data } = await http.get<{ id: string; name: string }[]>('/roles')
  roles.value = data
}

onMounted(() => {
  void load()
  void loadRoles()
})
</script>

<style scoped>
.mt {
  margin-top: 16px;
}
</style>
