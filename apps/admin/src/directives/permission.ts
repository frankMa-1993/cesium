import type { Directive, DirectiveBinding } from 'vue'
import { useAuthStore } from '@/stores/auth'

/** 指令值：单个权限字符串或字符串数组（需全部满足） */
export const permissionDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const auth = useAuthStore()
    const need = Array.isArray(binding.value)
      ? binding.value
      : [binding.value]
    const ok = need.every((p) => auth.permissions.includes(p))
    if (!ok)
      el.parentNode?.removeChild(el)
  },
}
