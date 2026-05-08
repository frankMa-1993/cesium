<template>
  <div>
    <el-table :data="items" border stripe>
      <el-table-column prop="userId" label="用户ID" width="120" />
      <el-table-column label="时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.loggedAt).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column label="地理位置" width="160">
        <template #default="{ row }">
          {{ [row.province, row.city].filter(Boolean).join(' / ') || '—' }}
        </template>
      </el-table-column>
      <el-table-column prop="userAgent" label="UserAgent" min-width="200" show-overflow-tooltip />
      <el-table-column label="结果" width="80">
        <template #default="{ row }">
          <el-tag :type="row.success ? 'success' : 'danger'">
            {{ row.success ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="failReason" label="失败原因" width="140" />
      <el-table-column prop="sessionId" label="会话" width="120" show-overflow-tooltip />
    </el-table>
    <el-pagination
      class="mt"
      v-model:current-page="page"
      layout="total, prev, pager, next"
      :total="total"
      @current-change="load"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref ,reactive, computed} from 'vue'
import { http } from '@/utils/request'

const items = ref<unknown[]>([])
const total = ref(0)
const page = ref(1)

async function load() {
  const { data } = await http.get<{ total: number; items: unknown[] }>(
    '/audit/login-logs',
    { params: { page: page.value, pageSize: 20 } },
  )
  total.value = data.total
  items.value = data.items
}


// 输出：computed run → 2
onMounted(() => void load())
</script>

<style scoped>
.mt {
  margin-top: 16px;
}
</style>
