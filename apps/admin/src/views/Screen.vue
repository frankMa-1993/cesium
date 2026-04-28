<template>
  <el-tabs v-model="tab">
    <el-tab-pane label="数据源" name="ds">
      <el-button v-permission="'screen:write'" type="primary" @click="openCreate">新建数据源</el-button>
      <el-table :data="list" class="mt" border>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column label="配置" min-width="200">
          <template #default="{ row }">
            <code class="cfg">{{ JSON.stringify(row.config) }}</code>
          </template>
        </el-table-column>
        <el-table-column label="更新" width="180">
          <template #default="{ row }">
            {{ new Date(row.updatedAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column v-if="canWrite" label="操作" width="140">
          <template #default="{ row }">
            <el-button link type="primary" @click="edit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog v-model="dlg" :title="editingId ? '编辑数据源' : '新建数据源'" width="520px">
        <el-form label-width="100px">
          <el-form-item label="名称">
            <el-input v-model="form.name" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="form.type" style="width: 100%">
              <el-option label="静态 JSON" value="STATIC_JSON" />
              <el-option label="REST API" value="REST" />
              <el-option label="WebSocket" value="WEBSOCKET" />
              <el-option label="MQTT" value="MQTT" />
            </el-select>
          </el-form-item>
          <el-form-item label="配置 JSON">
            <el-input v-model="configStr" type="textarea" :rows="8" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dlg = false">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </template>
      </el-dialog>
    </el-tab-pane>
    <el-tab-pane label="可视化编排" name="vis">
      <ScreenEditor />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@/utils/request'
import { useAuthStore } from '@/stores/auth'
import ScreenEditor from './ScreenEditor.vue'

interface Ds {
  id: string
  name: string
  type: string
  config: Record<string, unknown>
  updatedAt: string
}

const tab = ref('ds')
const list = ref<Ds[]>([])
const dlg = ref(false)
const editingId = ref<string | null>(null)
const form = ref({
  name: '',
  type: 'REST' as 'STATIC_JSON' | 'REST' | 'WEBSOCKET' | 'MQTT',
})
const configStr = ref('{}')

const auth = useAuthStore()
const canWrite = computed(() => auth.permissions.includes('screen:write'))

async function load() {
  const { data } = await http.get<Ds[]>('/screen/datasources')
  list.value = data
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', type: 'REST' }
  configStr.value = JSON.stringify({ url: 'https://api.example.com/v1/metrics', pollMs: 5000 }, null, 2)
  dlg.value = true
}

function edit(row: Ds) {
  editingId.value = row.id
  form.value = { name: row.name, type: row.type as typeof form.value.type }
  configStr.value = JSON.stringify(row.config, null, 2)
  dlg.value = true
}

async function save() {
  let cfg: Record<string, unknown>
  try {
    cfg = JSON.parse(configStr.value) as Record<string, unknown>
  }
  catch {
    ElMessage.error('配置需为合法 JSON')
    return
  }
  if (editingId.value) {
    await http.put(`/screen/datasources/${editingId.value}`, {
      name: form.value.name,
      type: form.value.type,
      config: cfg,
    })
  }
  else {
    await http.post('/screen/datasources', {
      name: form.value.name,
      type: form.value.type,
      config: cfg,
    })
  }
  ElMessage.success('已保存')
  dlg.value = false
  await load()
}

async function remove(id: string) {
  await ElMessageBox.confirm('确定删除？', '提示')
  await http.delete(`/screen/datasources/${id}`)
  ElMessage.success('已删除')
  await load()
}

onMounted(() => void load())
</script>

<style scoped>
.mt {
  margin-top: 16px;
}
.cfg {
  font-size: 12px;
  word-break: break-all;
}
</style>
