import { usePermissionStore } from '../stores/permission'

// 鍒濆鍖栫敤鎴锋潈闄?
export async function initUserPermissions() {
  const permissionStore = usePermissionStore()
  
  try {
    // 鑾峰彇褰撳墠鐢ㄦ埛淇℃伅
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
    
    // 浠庣敤鎴蜂俊鎭腑鎻愬彇鏉冮檺
    const frontendPermissions: string[] = []
    

    
    // 澶勭悊鏂瑰紡1锛氫粠椤跺眰鐨刾ermissions鏁扮粍涓彁鍙栵紙/users/me鎺ュ彛杩斿洖鐨勬暟鎹粨鏋勶級
    if (user.permissions && Array.isArray(user.permissions)) {
      console.log('浠庨《灞俻ermissions鏁扮粍鎻愬彇鏉冮檺:', user.permissions)
      user.permissions.forEach((permission: any) => {
        const permissionCode = permission.permission_code || permission.code
        if (permissionCode) {
          frontendPermissions.push(permissionCode)
        }
      })
    }
    // 澶勭悊鏂瑰紡2锛氫粠roles鏁扮粍涓彁鍙栵紙鐢ㄦ埛鍒楄〃鎺ュ彛杩斿洖鐨勬暟鎹粨鏋勶級
    if (user.roles && Array.isArray(user.roles)) {
      console.log('浠巖oles鏁扮粍鎻愬彇鏉冮檺:', user.roles)
      user.roles.forEach((role: any) => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach((permission: any) => {
            // 鏀寔涓ょ瀛楁鍚嶏細permission_code 鍜?code
            const permissionCode = permission.permission_code || permission.code
            if (permissionCode) {
              frontendPermissions.push(permissionCode)
            }
          })
        }
      })
    }
    
    // 鍘婚噸鏉冮檺鍒楄〃
    const uniquePermissions = [...new Set(frontendPermissions)]
    
    console.log('鏈€缁堟彁鍙栫殑鏉冮檺鍒楄〃:', uniquePermissions)
    
    // 璁剧疆鐢ㄦ埛鏉冮檺鍒癝tore
    permissionStore.setUserPermissions(uniquePermissions)
    

  } catch (err) {
    console.error('鍒濆鍖栫敤鎴锋潈闄愬け璐?', err)
  }
}

// 鍒濆鍖栨墍鏈夋潈闄愰厤缃?
export async function initAllPermissions() {
  const permissionStore = usePermissionStore()
  
  try {
    // 鐢变簬鎴戜滑鐩存帴浠庣敤鎴蜂俊鎭腑鑾峰彇鏉冮檺锛岃繖閲屽彲浠ヨ烦杩囪幏鍙栨墍鏈夋潈闄愰厤缃?
    // 鎴栬€呭鏋滈渶瑕侊紝鍙互浠庣敤鎴蜂俊鎭腑鏋勫缓鏉冮檺閰嶇疆

  } catch (err) {
    console.error('鍒濆鍖栨潈闄愰厤缃け璐?', err)
  }
}
