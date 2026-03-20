import { usePermissionStore } from '../stores/permission'
import { useUserStore } from '../stores/user'

// 权限调试快照，仅在需要时手动调用
export function debugPermissions() {
  const permissionStore = usePermissionStore()
  const userStore = useUserStore()

  const testPermissions = [
    'home.view',
    'drone_control.view',
    'dock_control.view',
    'wayline_management.view',
    'task_logs.view',
    'task_records.view',
    'device_management.view'
  ]

  return {
    user: userStore.user,
    roles: userStore.user?.roles ?? [],
    userPermissions: permissionStore.userPermissions,
    allPermissions: permissionStore.allPermissions,
    checks: testPermissions.map((permission) => ({
      permission,
      allowed: permissionStore.hasPermission(permission)
    }))
  }
}

// 暴露到 window，便于人工排查时手动调用
if (typeof window !== 'undefined') {
  ;(window as Window & typeof globalThis & { debugPermissions?: typeof debugPermissions }).debugPermissions = debugPermissions
}
