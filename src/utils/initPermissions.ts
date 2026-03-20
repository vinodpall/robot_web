import { usePermissionStore } from '../stores/permission'

export async function initUserPermissions() {
  const permissionStore = usePermissionStore()
  
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      console.warn('No user info found, skip permission init')
      return
    }
    
    const user = JSON.parse(userStr)
    if (!user.id) {
      console.warn('No user id found, skip permission init')
      return
    }
    
    const frontendPermissions: string[] = []
    

    
    if (user.permissions && Array.isArray(user.permissions)) {
      user.permissions.forEach((permission: any) => {
        const permissionCode = permission.permission_code || permission.code
        if (permissionCode) {
          frontendPermissions.push(permissionCode)
        }
      })
    }
    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((role: any) => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach((permission: any) => {
            const permissionCode = permission.permission_code || permission.code
            if (permissionCode) {
              frontendPermissions.push(permissionCode)
            }
          })
        }
      })
    }
    
    const uniquePermissions = [...new Set(frontendPermissions)]
    
    permissionStore.setUserPermissions(uniquePermissions)
    

  } catch (err) {
    console.error('初始化用户权限失败:', err)
  }
}

export async function initAllPermissions() {
  const permissionStore = usePermissionStore()
  
  try {

  } catch (err) {
    console.error('初始化权限配置失败:', err)
  }
}
