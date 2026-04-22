import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Permission } from '../types'

const isTruthySuperuser = (value: unknown): boolean => {
  if (value === true || value === 1 || value === '1') return true
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true'
  return false
}

function readSuperuserFromStorage(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return false
    return isTruthySuperuser(JSON.parse(userStr)?.is_superuser)
  } catch {
    return false
  }
}

export const usePermissionStore = defineStore('permission', () => {
  const userPermissions = ref<string[]>([])
  const currentRole = ref<string>('')
  const allPermissions = ref<Permission[]>([])
  const _isSuperuser = ref<boolean>(readSuperuserFromStorage())

  const isSuperuser = computed(() => _isSuperuser.value)

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

  const setSuperuser = (value: boolean) => {
    _isSuperuser.value = value
  }

  const setCurrentRole = (role: string) => {
    currentRole.value = role
  }

  const clearPermissions = () => {
    userPermissions.value = []
    currentRole.value = ''
    _isSuperuser.value = false
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
    setSuperuser,
    setCurrentRole,
    clearPermissions,
    setAllPermissions,
    getUserPermissions,
    getCurrentRole,
    getAllPermissions
  }
})
