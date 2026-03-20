import type { DirectiveBinding } from 'vue'
import { usePermissionStore } from '../stores/permission'

function checkPermission(permissions: string | string[]): boolean {
  const permissionStore = usePermissionStore()
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
  return permissionStore.hasAnyPermission(permissionArray)
}

function showPermissionDeniedMessage(permission: string) {
  if (typeof window !== 'undefined' && window.alert) {
    window.alert(`权限不足，需要 ${permission} 权限`)
  }
}

// 隐藏无权限元素
export const permission = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const permissionStore = usePermissionStore()
    const { value } = binding

    if (!value) return

    const permissions = Array.isArray(value) ? value : [value]
    const hasPermission = permissionStore.hasAnyPermission(permissions)

    if (!hasPermission) {
      el.style.display = 'none'
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding) {
    const permissionStore = usePermissionStore()
    const { value } = binding

    if (!value) return

    const permissions = Array.isArray(value) ? value : [value]
    const hasPermission = permissionStore.hasAnyPermission(permissions)
    el.style.display = hasPermission ? '' : 'none'
  }
}

// 必须拥有全部权限才显示
export const permissionAll = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const permissionStore = usePermissionStore()
    const { value } = binding

    if (!value) return

    const permissions = Array.isArray(value) ? value : [value]
    const hasPermission = permissionStore.hasAllPermissions(permissions)

    if (!hasPermission) {
      el.style.display = 'none'
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding) {
    const permissionStore = usePermissionStore()
    const { value } = binding

    if (!value) return

    const permissions = Array.isArray(value) ? value : [value]
    const hasPermission = permissionStore.hasAllPermissions(permissions)
    el.style.display = hasPermission ? '' : 'none'
  }
}

// 点击时拦截无权限操作，但不隐藏元素
export const permissionClick = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding

    if (!value) return

    const permissions = Array.isArray(value) ? value : [value]
    const originalClick = el.onclick

    el.onclick = (event: MouseEvent) => {
      if (!checkPermission(permissions)) {
        event.preventDefault()
        event.stopPropagation()

        const permissionText = Array.isArray(value) ? value.join(' 或 ') : value
        showPermissionDeniedMessage(permissionText)
        return false
      }

      if (originalClick) {
        return originalClick.call(el, event)
      }
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding

    if (!value) return

    const permissions = Array.isArray(value) ? value : [value]
    const originalClick = el.onclick

    el.onclick = (event: MouseEvent) => {
      if (!checkPermission(permissions)) {
        event.preventDefault()
        event.stopPropagation()

        const permissionText = Array.isArray(value) ? value.join(' 或 ') : value
        showPermissionDeniedMessage(permissionText)
        return false
      }

      if (originalClick) {
        return originalClick.call(el, event)
      }
    }
  }
}

// 点击时抛出 permission-denied 自定义事件
export const permissionClickDialog = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding

    if (!value) return

    const permissions = Array.isArray(value) ? value : [value]
    el.setAttribute('data-permission', Array.isArray(value) ? value.join(',') : value)

    el.addEventListener('click', (event: MouseEvent) => {
      if (!checkPermission(permissions)) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()

        const permissionText = Array.isArray(value) ? value.join(' 或 ') : value
        const customEvent = new CustomEvent('permission-denied', {
          detail: { permission: permissionText },
          bubbles: true
        })
        el.dispatchEvent(customEvent)
        return false
      }
    }, true)
  },

  updated(el: HTMLElement, binding: DirectiveBinding) {
    if ((el as any)._permissionClickHandler) {
      el.removeEventListener('click', (el as any)._permissionClickHandler, true)
    }

    const { value } = binding

    if (!value) return

    const permissions = Array.isArray(value) ? value : [value]
    el.setAttribute('data-permission', Array.isArray(value) ? value.join(',') : value)

    const clickHandler = (event: MouseEvent) => {
      if (!checkPermission(permissions)) {
        event.preventDefault()
        event.stopPropagation()

        const permissionText = Array.isArray(value) ? value.join(' 或 ') : value
        const customEvent = new CustomEvent('permission-denied', {
          detail: { permission: permissionText },
          bubbles: true
        })
        el.dispatchEvent(customEvent)
        return false
      }
    }

    ;(el as any)._permissionClickHandler = clickHandler
    el.addEventListener('click', clickHandler, true)
  }
}
