import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Permission } from '../types'

const isTruthySuperuser = (value: unknown): boolean => {
  return value === true || value === 1 || value === '1' || value === 'true'
}

const hasSuperuserByRole = (roles: unknown): boolean => {
  if (!Array.isArray(roles)) return false
  return roles.some((role: any) => {
    if (typeof role === 'string') return role === 'super_admin'
    return role?.role_code === 'super_admin' || role?.role_name === '超级管理员'
  })
}

export const usePermissionStore = defineStore('permission', () => {
  const userPermissions = ref<string[]>([])
  const currentRole = ref<string>('')
  const allPermissions = ref<Permission[]>([])

  const isSuperuser = computed(() => {
    if (typeof window === 'undefined') return false
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) return false
      const user = JSON.parse(userStr)
      return isTruthySuperuser(user?.is_superuser) || hasSuperuserByRole(user?.roles)
    } catch (_err) {
      return false
    }
  })

  const hasPermission = (permission: string): boolean => {
    if (isSuperuser.value) return true
    return userPermissions.value.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (isSuperuser.value) return true
    return permissions.some(permission => userPermissions.value.includes(permission))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (isSuperuser.value) return true
    return permissions.every(permission => userPermissions.value.includes(permission))
  }

  const setUserPermissions = (permissions: string[]) => {
    userPermissions.value = permissions
  }

  const setCurrentRole = (role: string) => {
    currentRole.value = role
  }

  const clearPermissions = () => {
    userPermissions.value = []
    currentRole.value = ''
  }

  const setAllPermissions = (permissions: Permission[]) => {
    allPermissions.value = permissions
  }

  const getUserPermissions = computed(() => userPermissions.value)
  const getCurrentRole = computed(() => currentRole.value)
  const getAllPermissions = computed(() => allPermissions.value)

  return {
    userPermissions,
    currentRole,
    allPermissions,
    isSuperuser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    setUserPermissions,
    setCurrentRole,
    clearPermissions,
    setAllPermissions,
    getUserPermissions,
    getCurrentRole,
    getAllPermissions
  }
})
