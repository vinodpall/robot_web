import type { DirectiveBinding } from 'vue'
import { usePermissionStore } from '../stores/permission'

function isTruthySuperuser(value: unknown): boolean {
  if (value === true || value === 1 || value === '1') return true
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true'
  return false
}

function hasSuperuserByRole(roles: unknown): boolean {
  if (!Array.isArray(roles)) return false
  return roles.some((role: any) => {
    if (typeof role === 'string') return role === 'super_admin'
    return role?.role_code === 'super_admin' || role?.role_name === '超级管理员'
  })
}

function isSuperuserNow(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return false
    const user = JSON.parse(userStr)
    return isTruthySuperuser(user?.is_superuser) || hasSuperuserByRole(user?.roles)
  } catch {
    return false
  }
}

function checkPermission(permissions: string | string[]): boolean {
  if (isSuperuserNow()) return true
  const permissionStore = usePermissionStore()
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
  return permissionStore.hasAnyPermission(permissionArray)
}

function showPermissionDeniedMessage(permission: string) {
  if (typeof window !== 'undefined' && window.alert) {
    window.alert(`权限不足，需要 ${permission} 权限`)
  }
}

function applyNoPermissionState(el: HTMLElement, noPermission: boolean) {
  if (isSuperuserNow()) {
    noPermission = false
  }

  if (noPermission) {
    el.classList.add('permission-disabled')
    el.style.pointerEvents = 'none'
    el.style.opacity = '0.6'
    if ('disabled' in el) {
      ;(el as HTMLButtonElement).disabled = true
    }
    return
  }

  el.classList.remove('permission-disabled')
  el.style.pointerEvents = ''
  el.style.opacity = ''
  if ('disabled' in el) {
    ;(el as HTMLButtonElement).disabled = false
  }
}

export const permission = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const permissionStore = usePermissionStore()
    const { value } = binding
    if (!value) return
    const permissions = Array.isArray(value) ? value : [value]
    const hasPermission = permissionStore.hasAnyPermission(permissions)
    if (!hasPermission) el.style.display = 'none'
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

export const permissionAll = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const permissionStore = usePermissionStore()
    const { value } = binding
    if (!value) return
    const permissions = Array.isArray(value) ? value : [value]
    const hasPermission = permissionStore.hasAllPermissions(permissions)
    if (!hasPermission) el.style.display = 'none'
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
      return undefined
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
      return undefined
    }
  }
}

export const permissionClickDialog = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    bindPermissionClickDialog(el, binding)
  },

  updated(el: HTMLElement, binding: DirectiveBinding) {
    bindPermissionClickDialog(el, binding)
  },

  unmounted(el: HTMLElement) {
    const oldHandler = (el as any)._permissionClickHandler as ((event: MouseEvent) => void) | undefined
    if (oldHandler) {
      el.removeEventListener('click', oldHandler, true)
      delete (el as any)._permissionClickHandler
    }
  }
}

function bindPermissionClickDialog(el: HTMLElement, binding: DirectiveBinding) {
  const oldHandler = (el as any)._permissionClickHandler as ((event: MouseEvent) => void) | undefined
  if (oldHandler) {
    el.removeEventListener('click', oldHandler, true)
    delete (el as any)._permissionClickHandler
  }

  const { value } = binding
  if (!value) return

  const permissions = Array.isArray(value) ? value : [value]
  const permissionText = Array.isArray(value) ? value.join(' 或 ') : value
  el.setAttribute('data-permission', Array.isArray(value) ? value.join(',') : value)

  const hasPermission = checkPermission(permissions)
  applyNoPermissionState(el, !hasPermission)

  const clickHandler = (event: MouseEvent) => {
    if (checkPermission(permissions)) return

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()

    const customEvent = new CustomEvent('permission-denied', {
      detail: { permission: permissionText },
      bubbles: true
    })
    el.dispatchEvent(customEvent)
  }

  ;(el as any)._permissionClickHandler = clickHandler
  el.addEventListener('click', clickHandler, true)
}
