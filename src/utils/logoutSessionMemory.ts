const TEMP_EXACT_KEYS = [
  // 路由/页面状态
  'task_module_last_path',
  'nav_module_last_path',
  'log_module_last_path',
  'system_module_last_path',
  'navigation_manage_current_tab',

  // 认证与用户会话
  'token',
  'user',
  'workspace_id',

  // 当前设备/地图选择
  'selected_dock_sn',
  'selected_robot_id',
  'selected_robot_info',
  'selected_map_name',
  'selected_point_task_id',
  'nav_confirmed_map',
  'multi_task_running',

  // 设备/任务缓存（旧版通用键）
  'cached_devices',
  'cached_dock_sns',
  'cached_drone_sns',
  'cached_map_list',
  'cached_map_update_time_map',
  'cached_track_list',
  'cached_taskpoint_group_map',
  'cached_point_task_list',
  'cached_multi_task_list',
  'all_track_task_list',

  // 视频/相机缓存（旧版通用键）
  'camera_list',
  'video_streams',
  'default_video_type',
  'video_cache',
  'livestream_capacity',
  'camera_zoom_factor',

] as const

const TEMP_PREFIX_KEYS = [
  // 按机器人分区缓存
  'cached_map_list_',
  'cached_map_update_time_map_',
  'selected_map_name_',
  'all_track_task_list_',
  'cached_track_list_',
  'cached_taskpoint_group_map_',
  'cached_point_task_list_',
  'cached_multi_task_list_',
  'selected_point_task_id_',

  // 按机器人分区的视频/相机缓存
  'camera_list_',
  'video_streams_',
  'default_video_type_',
] as const

const REMEMBER_LOGIN_KEYS = ['savedUsername', 'savedPassword', 'savedExpireTime'] as const

const shouldClearByPrefix = (key: string) => TEMP_PREFIX_KEYS.some(prefix => key.startsWith(prefix))

export const clearLogoutSessionMemory = (options?: { keepRememberLogin?: boolean }) => {
  const keepRememberLogin = options?.keepRememberLogin !== false
  const rememberLoginSet = new Set(REMEMBER_LOGIN_KEYS)

  TEMP_EXACT_KEYS.forEach((key) => {
    localStorage.removeItem(key)
  })

  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    if (keepRememberLogin && rememberLoginSet.has(key as typeof REMEMBER_LOGIN_KEYS[number])) continue
    if (shouldClearByPrefix(key)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))
}
