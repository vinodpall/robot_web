import { defineStore } from 'pinia'
import type { User } from '@/types'
import { clearLogoutSessionMemory } from '@/utils/logoutSessionMemory'

const isTruthySuperuser = (value: unknown): boolean => {
  if (value === true || value === 1 || value === '1') return true
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true'
  return false
}

const hasPermissionInList = (permissions: unknown, target: string): boolean => {
  if (!Array.isArray(permissions)) return false
  return permissions.some((p: any) => {
    if (typeof p === 'string') return p === target
    return p?.permission_code === target || p?.code === target
  })
}

export const useUserStore = defineStore('user', {
  state: () => {
    let user = null
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        user = JSON.parse(userStr)
      }
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }

    return {
      user: user as User | null,
      token: localStorage.getItem('token') || ''
    }
  },

  getters: {
    isLoggedIn: (state) => !!state.token,
    hasPermission: (state) => (permission: string) => {
      if (!state.user) return false

      if (isTruthySuperuser((state.user as any).is_superuser)) {
        return true
      }

      if (Array.isArray(state.user.roles)) {
        const rolesArr = state.user.roles as unknown[]
        const rolePermissionMatched = rolesArr.some((r: any) => hasPermissionInList(r?.permissions, permission))
        if (rolePermissionMatched) return true
      }

      return hasPermissionInList((state.user as any).permissions, permission)
    }
  },

  actions: {
    setUser(user: User) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },

    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
    },

    logout() {
      this.user = null
      this.token = ''
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      clearLogoutSessionMemory()
    }
  }
})
