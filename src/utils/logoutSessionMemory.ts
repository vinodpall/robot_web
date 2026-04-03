const MODULE_LAST_PATH_KEYS = [
  'task_module_last_path',
  'nav_module_last_path',
  'log_module_last_path',
  'system_module_last_path',
  'navigation_manage_current_tab'
] as const

export const clearLogoutSessionMemory = () => {
  MODULE_LAST_PATH_KEYS.forEach((key) => {
    localStorage.removeItem(key)
  })
}

