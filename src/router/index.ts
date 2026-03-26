import { createRouter, createWebHashHistory } from 'vue-router'
import { usePermissionStore } from '../stores/permission'

function extractPermissionsFromUser(user: any): string[] {
  const codes: string[] = []

  if (Array.isArray(user?.permissions)) {
    user.permissions.forEach((item: any) => {
      const code = item?.permission_code || item?.code
      if (code) codes.push(String(code))
    })
  }

  if (Array.isArray(user?.roles)) {
    user.roles.forEach((role: any) => {
      if (Array.isArray(role?.permissions)) {
        role.permissions.forEach((item: any) => {
          const code = item?.permission_code || item?.code
          if (code) codes.push(String(code))
        })
      }
    })
  }

  return Array.from(new Set(codes))
}

function isSuperAdminUser(user: any): boolean {
  if (!Array.isArray(user?.roles)) return false
  return user.roles.some((role: any) => {
    if (typeof role === 'string') return role === 'super_admin'
    return role?.role_name === '超级管理员' || role?.role_code === 'super_admin'
  })
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/permission-denied',
      name: 'PermissionDenied',
      component: () => import('../views/PermissionDenied.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/Layout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'DashboardHome',
          redirect: '/dashboard/home'
        },
        {
          path: 'home',
          name: 'Home',
          component: () => import('../views/Home.vue'),
          meta: {
            requiresAuth: true,
            permission: 'main-show'
          }
        },
        {
          path: 'mission',
          name: 'Mission',
          component: () => import('../views/Mission.vue'),
          meta: {
            requiresAuth: true,
            permission: 'task-show'
          }
        },
        {
          path: 'mission-logs',
          name: 'MissionLogs',
          component: () => import('../views/MissionLogs.vue'),
          meta: {
            requiresAuth: true,
            permission: 'task-plantracklist-show'
          }
        },
        {
          path: 'mission-records',
          name: 'MissionRecords',
          component: () => import('../views/MissionRecords.vue'),
          meta: {
            requiresAuth: true,
            permission: 'log-tracklog-show'
          }
        },
        {
          path: 'multi-task-group',
          name: 'MultiTaskGroup',
          component: () => import('../views/MultiTaskGroup.vue'),
          meta: {
            requiresAuth: true,
            permission: 'task-multitasklist-show'
          }
        },
        {
          path: 'device-manage',
          name: 'DeviceManage',
          component: () => import('../views/DeviceManage.vue'),
          meta: {
            requiresAuth: true
          }
        },
        {
          path: 'alarm-log',
          name: 'AlarmLog',
          component: () => import('../views/AlarmLog.vue'),
          meta: {
            requiresAuth: true,
            permission: 'log-show'
          }
        },
        {
          path: 'users',
          name: 'UserManage',
          component: () => import('../views/UserManage.vue'),
          meta: {
            requiresAuth: true,
            permission: 'system-user-show'
          }
        },
        {
          path: 'body-params',
          name: 'BodyParams',
          component: () => import('../views/BodyParams.vue'),
          meta: {
            requiresAuth: true,
            permission: 'system-body-show'
          }
        },
        {
          path: 'roles',
          name: 'RoleManage',
          component: () => import('../views/RoleManage.vue'),
          meta: {
            requiresAuth: true,
            permission: 'system-role-show'
          }
        },
        {
          path: 'super-admin',
          name: 'SuperAdminManage',
          component: () => import('../views/SuperAdminManage.vue'),
          meta: {
            requiresAuth: true,
            permission: 'system-super-show'
          }
        },
        {
          path: 'navigation',
          name: 'NavigationManage',
          component: () => import('../views/NavigationManage.vue'),
          meta: {
            requiresAuth: true,
            permission: 'nav-show'
          }
        }
      ]
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const requiresAuth = to.matched.some(record => record.meta?.requiresAuth)
  const token = localStorage.getItem('token')

  if (requiresAuth && !token) {
    next('/login')
    return
  }

  const requiredPermissions = to.matched
    .map(record => record.meta?.permission)
    .filter(Boolean) as Array<string | string[]>

  if (!requiredPermissions.length) {
    next()
    return
  }

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  if (isSuperAdminUser(user)) {
    next()
    return
  }

  const permissionStore = usePermissionStore()
  if (permissionStore.userPermissions.length === 0 && user) {
    permissionStore.setUserPermissions(extractPermissionsFromUser(user))
  }

  const flatRequired = requiredPermissions.flatMap(item => Array.isArray(item) ? item : [item])
  const hasAccess = flatRequired.some(code => permissionStore.hasPermission(code))

  if (hasAccess) {
    next()
    return
  }

  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('permission-denied', {
      detail: { permission: flatRequired.join(' 或 ') }
    }))
  }

  next(false)
})

const DYNAMIC_IMPORT_RETRY_KEY = 'dynamic-import-retried'

router.onError((error, to) => {
  const message = String((error as Error)?.message || '')
  const isDynamicImportError =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed')

  if (!isDynamicImportError || typeof window === 'undefined') {
    console.error('Router error:', error)
    return
  }

  const hasRetried = sessionStorage.getItem(DYNAMIC_IMPORT_RETRY_KEY) === '1'
  if (hasRetried) {
    sessionStorage.removeItem(DYNAMIC_IMPORT_RETRY_KEY)
    console.error('Dynamic import failed after retry:', error)
    return
  }

  sessionStorage.setItem(DYNAMIC_IMPORT_RETRY_KEY, '1')
  const hashPath = to?.fullPath || '/login'
  window.location.replace(`${window.location.pathname}#${hashPath}`)
})

router.afterEach(() => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(DYNAMIC_IMPORT_RETRY_KEY)
  }
})

export default router
