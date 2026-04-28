<template>
  <div>
    <el-form inline>
      <el-form-item label="字典类型">
        <el-select v-model="typeId" placeholder="选择类型" style="width: 220px" @change="onType">
          <el-option
            v-for="t in types"
            :key="t.id"
            :label="`${t.name} (${t.code})`"
            :value="t.id"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card header="当前项（可编辑后发布）">
          <el-table :data="editRows" size="small" border>
            <el-table-column prop="key" label="键">
              <template #default="{ row }">
                <el-input v-model="row.key" size="small" />
              </template>
            </el-table-column>
            <el-table-column prop="label" label="标签">
              <template #default="{ row }">
                <el-input v-model="row.label" size="small" />
              </template>
            </el-table-column>
            <el-table-column prop="value" label="值">
              <template #default="{ row }">
                <el-input v-model="row.value" size="small" />
              </template>
            </el-table-column>
          </el-table>
          <el-button v-permission="'dict:write'" class="mt" @click="addRow">新增行</el-button>
          <el-button v-permission="'dict:write'" type="primary" class="mt" @click="publish">
            发布为新版本
          </el-button>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="版本对比">
          <el-space wrap>
            <el-select v-model="v1" placeholder="版本 A" style="width: 120px">
              <el-option v-for="n in versions" :key="'a' + n.version" :value="n.version" :label="'v' + n.version" />
            </el-select>
            <el-select v-model="v2" placeholder="版本 B" style="width: 120px">
              <el-option v-for="n in versions" :key="'b' + n.version" :value="n.version" :label="'v' + n.version" />
            </el-select>
            <el-button @click="loadDiff">对比</el-button>
          </el-space>
          <el-table :data="diffRows" class="mt" size="small" border empty-text="选择两个版本进行对比">
            <el-table-column prop="key" label="键" />
            <el-table-column prop="label" label="标签" />
            <el-table-column prop="value" label="值" />
            <el-table-column prop="change" label="变更" width="100">
              <template #default="{ row }">
                <span :class="'tag-' + row.change">{{ labelChange(row.change) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { http } from '@/utils/request'
import type { DictChangeType } from '@cesium-eco/shared'

interface Row {
  key: string
  label: string
  value: string
}

interface TypeRow {
  id: string
  code: string
  name: string
}

const types = ref<TypeRow[]>([])
const typeId = ref('')
const editRows = ref<Row[]>([])
const versions = ref<{ id: string; version: number; createdAt: string }[]>([])
const v1 = ref<number | undefined>()
const v2 = ref<number | undefined>()
const diffRows = ref<{ key: string; label?: string; value?: string; change: DictChangeType }[]>([])

function labelChange(c: DictChangeType) {
  if (c === 'added')
    return '新增'
  if (c === 'removed')
    return '删除'
  return '修改'
}

async function loadTypes() {
  const { data } = await http.get<TypeRow[]>('/dict/types')
  types.value = data
  if (!typeId.value && data[0])
    typeId.value = data[0].id
}

async function loadItems() {
  if (!typeId.value)
    return
  const { data } = await http.get<Row[]>(`/dict/types/${typeId.value}/items`)
  editRows.value = data.length ? [...data] : [{ key: '', label: '', value: '' }]
  const { data: ver } = await http.get<{ id: string; version: number; createdAt: string }[]>(
    `/dict/types/${typeId.value}/versions`,
  )
  versions.value = ver
}

function onType() {
  void loadItems()
  diffRows.value = []
}

async function loadDiff() {
  if (!typeId.value || v1.value == null || v2.value == null) {
    ElMessage.warning('请选择两个版本')
    return
  }
  const { data } = await http.get<{ key: string; label?: string; value?: string; change: DictChangeType }[]>(
    `/dict/types/${typeId.value}/diff`,
    { params: { v1: v1.value, v2: v2.value } },
  )
  diffRows.value = data
}

function addRow() {
  editRows.value.push({ key: '', label: '', value: '' })
}

async function publish() {
  await http.post(`/dict/types/${typeId.value}/publish`, { items: editRows.value })
  ElMessage.success('已发布新版本')
  await loadItems()
}

watch(typeId, () => {
  void loadItems()
})

onMounted(async () => {
  await loadTypes()
  await loadItems()
})
</script>

<style scoped>
.mt {
  margin-top: 12px;
}
.tag-added {
  color: #67c23a;
}
.tag-removed {
  color: #f56c6c;
}
.tag-modified {
  color: #e6a23c;
}
</style>
