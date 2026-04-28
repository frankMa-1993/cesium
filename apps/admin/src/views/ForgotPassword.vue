<template>
  <div class="wrap">
    <el-card class="card">
      <template #header>找回密码</template>
      <el-steps :active="step - 1" align-center>
        <el-step title="验证账号" />
        <el-step title="邮件/链接" />
        <el-step title="重置密码" />
      </el-steps>

      <div v-if="step === 1" class="block">
        <el-form @submit.prevent="submitRequest">
          <el-form-item label="用户名或手机号">
            <el-input v-model="identifier" placeholder="与登录账号一致" />
          </el-form-item>
          <el-button type="primary" :loading="loading" native-type="submit">
            发送重置链接
          </el-button>
        </el-form>
      </div>

      <div v-else-if="step === 2" class="block">
        <p class="hint">
          已向您的绑定邮箱发送重置链接（演示环境可能通过接口返回 devToken）。
        </p>
        <el-alert v-if="devToken" type="info" :closable="false">
          开发令牌（勿用于生产）：{{ devToken }}
        </el-alert>
        <el-button type="primary" class="mt" @click="step = 3">继续</el-button>
      </div>

      <div v-else class="block">
        <el-form @submit.prevent="submitConfirm">
          <el-form-item label="令牌">
            <el-input v-model="token" placeholder="邮件中的 token 或上方 devToken" />
          </el-form-item>
          <el-form-item label="新密码">
            <el-input v-model="pwd1" type="password" show-password />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input v-model="pwd2" type="password" show-password />
          </el-form-item>
          <el-space>
            <el-button type="primary" native-type="submit">确认重置</el-button>
            <router-link to="/login">
              <el-button link>返回登录</el-button>
            </router-link>
          </el-space>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { http } from '@/utils/request'

const router = useRouter()

const step = ref(1)
const identifier = ref('')
const loading = ref(false)
const devToken = ref('')
const token = ref('')
const pwd1 = ref('')
const pwd2 = ref('')

async function submitRequest() {
  loading.value = true
  try {
    const { data } = await http.post<{ sent: boolean; devToken?: string }>(
      '/auth/forgot/request',
      { identifier: identifier.value.trim() },
    )
    devToken.value = data.devToken ?? ''
    ElMessage.success('请求已受理')
    step.value = 2
  }
  finally {
    loading.value = false
  }
}

async function submitConfirm() {
  await http.post('/auth/forgot/confirm', {
    token: token.value.trim(),
    newPassword: pwd1.value,
    confirmPassword: pwd2.value,
  })
  ElMessage.success('密码已重置，请登录')
  await router.push({ name: 'login' })
}
</script>

<style scoped lang="scss">
.wrap {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f4f6fb;
}
.card {
  width: min(560px, 92vw);
}
.block {
  margin-top: 24px;
}
.mt {
  margin-top: 16px;
}
.hint {
  color: #606266;
  font-size: 14px;
}
</style>
