<template>
  <div class="login-page">
    <el-row justify="center" align="middle" class="full">
      <el-col :xs="22" :sm="16" :md="10" :lg="8" :xl="6">
        <el-card class="card">
          <template #header>
            <div class="title">管理后台登录</div>
          </template>
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            @submit.prevent="submit"
          >
            <el-form-item label="用户名或手机号" prop="identifier">
              <el-input
                v-model="form.identifier"
                maxlength="64"
                clearable
                placeholder="请输入用户名或手机号"
                @blur="() => formRef?.validateField('identifier')"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" type="password" show-password />
            </el-form-item>
            <el-form-item label="验证码" prop="captchaText">
              <div class="cap-row">
                <el-input
                  v-model="form.captchaText"
                  maxlength="10"
                  placeholder="请输入验证码"
                  style="flex: 1"
                />
                <div class="cap-img" @click="loadCaptcha" v-html="captchaSvg" />
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" native-type="submit" :loading="loading" class="w-full">
                登录
              </el-button>
            </el-form-item>
            <div class="extra">
              <router-link to="/forgot">忘记密码</router-link>
            </div>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { http } from '@/utils/request'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const captchaId = ref('')
const captchaSvg = ref('')

const form = reactive({
  identifier: '',
  password: '',
  captchaText: '',
})

const rules: FormRules = {
  identifier: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    {
      validator(_r, v: string, cb) {
        const s = (v ?? '').trim()
        if (!s) {
          cb(new Error('请输入账号'))
          return
        }
        const phone = /^1\d{10}$/.test(s)
        const user = /^[a-zA-Z0-9_@.-]{3,64}$/.test(s)
        if (phone || user) {
          cb()
          return
        }
        cb(new Error('请输入有效手机号或用户名（3-64 位字母数字等）'))
      },
      trigger: 'blur',
    },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaText: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

async function loadCaptcha() {
  try {
    const { data } = await http.get<{ id: string; svg: string }>('/auth/captcha')
    if (!data?.id || typeof data.svg !== 'string') {
      ElMessage.warning('验证码数据异常，请点击图片刷新')
      return
    }
    captchaId.value = data.id
    captchaSvg.value = data.svg
  }
  catch (e: unknown) {
    captchaId.value = ''
    captchaSvg.value = ''
    const err = e as AxiosError<{ message?: string }>
    const st = err.response?.status
    let msg = '验证码加载失败，请点击图片刷新重试'
    if (st === 502 || st === 503 || st === 504)
      msg = '后端暂不可用（网关错误）。请确认已启动 API（如根目录执行 pnpm dev:api），或检查反向代理 upstream。'
    else if (!err.response)
      msg = '无法连接后端，请检查 API 地址、网络或本机代理/VPN。'
    ElMessage.warning(msg)
  }
}

async function submit() {
  await formRef.value?.validate()
  loading.value = true
  try {
    await auth.login({
      identifier: form.identifier.trim(),
      password: form.password,
      captchaId: captchaId.value,
      captchaText: form.captchaText.trim(),
    })
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    await router.replace(redirect)
  }
  catch (e: unknown) {
    void loadCaptcha()
    const err = e as { response?: { data?: { message?: string } } }
    if (err?.response?.data?.message)
      ElMessage.error(String(err.response.data.message))
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadCaptcha()
})
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  background: linear-gradient(145deg, #0e1628 0%, #1a2744 50%, #0f172a 100%);
}
.full {
  min-height: 100vh;
}
.card {
  border-radius: 12px;
}
.title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
}
.extra {
  text-align: right;
  font-size: 13px;
}
.extra a {
  color: #409eff;
}
.cap-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.cap-img {
  width: auto;
  height: auto;
  cursor: pointer;
  overflow: hidden;
  border-radius: 4px;
}
.w-full {
  width: 100%;
}
</style>
