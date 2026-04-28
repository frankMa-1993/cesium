import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { public: true },
    },
    {
      path: '/forgot',
      name: 'forgot',
      component: () => import('@/views/ForgotPassword.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/Home.vue'),
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/Users.vue'),
        },
        {
          path: 'dict',
          name: 'dict',
          component: () => import('@/views/Dict.vue'),
        },
        {
          path: 'audit',
          name: 'audit',
          component: () => import('@/views/Audit.vue'),
        },
        {
          path: 'screen',
          name: 'screen',
          component: () => import('@/views/Screen.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.public)
    return true
  if (to.meta.requiresAuth) {
    await auth.bootstrap()
    if (auth.menus.length === 0) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }
  return true
})

export default router
