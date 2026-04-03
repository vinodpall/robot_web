<template>
  <div class="drone-control-main">
    <aside class="sidebar-menu">
      <div class="sidebar-tabs">
        <div
          v-for="tab in sidebarTabs"
          :key="tab.key"
          :class="['sidebar-tab', { active: currentTab === tab.key }]"
          v-permission-click-dialog="tab.permission"
          @click="handleTabClick(tab)"
        >
          <img :src="tab.icon" :alt="tab.label" />
        </div>
      </div>
    </aside>

    <main class="main-content">
      <div class="main-flex">
        <section class="right-panel">
          <div class="mission-top-card card">
            <div class="mission-top-header mission-top-header-left">
              <img class="mission-top-logo" src="@/assets/source_data/bg_data/card_logo.png" alt="logo" />
              <span class="mission-top-title">{{ t.roleManage }}</span>
            </div>
          </div>

          <div class="mission-content-wrapper">
            <div class="mission-toolbar">
              <span class="mission-toolbar-label" style="margin-right: -8px;">{{ t.roleName }}:</span>
              <input
                v-model.trim="searchRoleName"
                class="mission-toolbar-select"
                style="min-width: 210px;"
                :placeholder="t.inputRoleName"
              />

              <div class="mission-toolbar-actions">
                <button class="mission-btn mission-btn-pause sys-btn" v-permission-click-dialog="'system-role-query'" @click="onSearch">{{ t.search }}</button>
                <button class="mission-btn mission-btn-pause sys-btn" v-permission-click-dialog="'system-role-create'" @click="onCreateRole">{{ t.addRole }}</button>
              </div>
            </div>

            <div class="file-table file-table-adaptive role-file-table">
              <div class="file-table-header">
                <div class="file-table-cell">{{ t.index }}</div>
                <div class="file-table-cell">{{ t.roleName }}</div>
                <div class="file-table-cell">{{ t.roleDesc }}</div>
                <div class="file-table-cell">{{ t.createdAt }}</div>
                <div class="file-table-cell file-table-action">{{ t.action }}</div>
              </div>

              <div class="file-table-body">
                <div v-for="(role, idx) in displayRoles" :key="role.id" class="file-table-row">
                  <div class="file-table-cell">{{ idx + 1 }}</div>
                  <div class="file-table-cell">{{ role.role_name || '-' }}</div>
                  <div class="file-table-cell">{{ role.description || role.role_description || '-' }}</div>
                  <div class="file-table-cell">{{ formatTime(role.created_at || role.created_time || '') }}</div>
                  <div class="file-table-cell file-table-action">
                    <div class="action-icons">
                      <button class="icon-btn" :title="t.permission" v-permission-click-dialog="'system-role-permissionconfig'" @click="onPermission(role.id)">
                        <img :src="permissionIcon" alt="permission" />
                      </button>
                      <button class="icon-btn" :title="t.edit" v-permission-click-dialog="'system-role-edit'" @click="onEditRole(role.id)">
                        <img :src="editIcon" alt="edit" />
                      </button>
                      <button class="icon-btn" :title="t.delete" v-permission-click-dialog="'system-role-delete'" @click="onDeleteRole(role.id)">
                        <img :src="deleteIcon" alt="delete" />
                      </button>
                    </div>
                  </div>
                </div>

                <div v-for="i in roleEmptyRowCount" :key="`empty-${i}`" class="file-table-row">
                  <div class="file-table-cell"></div>
                  <div class="file-table-cell"></div>
                  <div class="file-table-cell"></div>
                  <div class="file-table-cell"></div>
                  <div class="file-table-cell file-table-action"></div>
                </div>

                <div v-if="loading" class="empty-state">{{ t.loading }}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <div v-if="showPermissionDialog" class="custom-dialog-mask">
      <div class="permission-dialog">
        <div class="permission-dialog-header">
          <div class="permission-dialog-title">
            {{ t.permissionConfig }} - {{ currentRole?.role_name || '-' }}
          </div>
          <label class="select-all-checkbox">
            <input
              type="checkbox"
              class="permission-checkbox"
              :checked="isAllChecked(allPermissionKeys)"
              @change="toggleKeys(allPermissionKeys, ($event.target as HTMLInputElement).checked)"
            />
            <span>{{ t.selectAll }}</span>
          </label>
        </div>

        <div class="permission-dialog-content">
          <div v-for="module in permissionModules" :key="module.key" class="permission-module">
            <div class="permission-module-header">
              <div class="permission-module-title">{{ module.label }}</div>
              <label class="permission-item module-select-all">
                <input
                  type="checkbox"
                  class="permission-checkbox"
                  :checked="isAllChecked(getModuleKeys(module))"
                  @change="toggleKeys(getModuleKeys(module), ($event.target as HTMLInputElement).checked)"
                />
                <span>{{ t.selectAll }}</span>
              </label>
            </div>

            <div class="permission-pages">
              <div v-for="page in module.pages" :key="page.key" class="permission-page-card">
                <div class="permission-page-header">
                  <label class="permission-item permission-page-title">
                    <input
                      type="checkbox"
                      class="permission-checkbox"
                      :checked="isAllChecked(getPageKeys(module, page))"
                      @change="toggleKeys(getPageKeys(module, page), ($event.target as HTMLInputElement).checked)"
                    />
                    <span>{{ page.label }}</span>
                  </label>
                  <span class="permission-page-count">{{ page.permissions.length }} {{ t.itemUnit }}</span>
                </div>

                <div class="permission-items permission-items-page">
                  <label v-for="perm in page.permissions" :key="getPermissionKey(perm)" class="permission-item">
                    <input
                      type="checkbox"
                      class="permission-checkbox"
                      :checked="selectedPermissionKeys.includes(getPermissionKey(perm))"
                      @change="togglePermission(getPermissionKey(perm), ($event.target as HTMLInputElement).checked)"
                    />
                    <span>{{ perm.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="permission-dialog-actions">
          <button class="mission-btn mission-btn-pause" v-permission-click-dialog="'system-role-permissionconfig'" @click="onPermissionConfirm">{{ t.confirm }}</button>
          <button class="mission-btn mission-btn-cancel" @click="showPermissionDialog = false">{{ t.cancel }}</button>
        </div>
      </div>
    </div>

    <div v-if="showRoleDialog" class="custom-dialog-mask">
      <div class="role-edit-dialog">
        <div class="permission-dialog-header">
          <div class="permission-dialog-title">{{ roleDialogMode === 'create' ? t.addRole : t.edit }}</div>
        </div>
        <div class="role-edit-content">
          <div class="role-edit-row">
            <label class="role-edit-label">{{ t.roleName }}</label>
            <input v-model.trim="roleForm.role_name" class="role-edit-input" :placeholder="t.inputRoleName" />
          </div>
          <div class="role-edit-row">
            <label class="role-edit-label">{{ t.roleCode }}</label>
            <input v-model.trim="roleForm.role_code" class="role-edit-input" :placeholder="t.inputRoleCode" />
          </div>
          <div class="role-edit-row">
            <label class="role-edit-label">{{ t.roleDesc }}</label>
            <input v-model.trim="roleForm.description" class="role-edit-input" :placeholder="t.inputRoleDesc" />
          </div>
        </div>
        <div class="permission-dialog-actions">
          <button
            class="mission-btn mission-btn-pause"
            :disabled="roleSubmitting"
            v-permission-click-dialog="roleDialogMode === 'create' ? 'system-role-create' : 'system-role-edit'"
            @click="onRoleSubmit"
          >
            {{ t.confirm }}
          </button>
          <button class="mission-btn mission-btn-cancel" :disabled="roleSubmitting" @click="showRoleDialog = false">{{ t.cancel }}</button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="deleteConfirm.visible"
      :title="deleteConfirm.title"
      :message="deleteConfirm.message"
      :confirm-text="t.confirm"
      :cancel-text="t.cancel"
      type="warning"
      @confirm="confirmDeleteRole"
      @cancel="closeDeleteConfirm"
      @close="closeDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import { usePermissions, useRoles } from '@/composables/useApi'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import bodyInfoIcon from '@/assets/source_data/svg_data/robot_source/body_info.svg'
import userIcon from '@/assets/source_data/svg_data/user.svg'
import roleIcon from '@/assets/source_data/svg_data/role.svg'
import permissionIcon from '@/assets/source_data/svg_data/permission.svg'
import editIcon from '@/assets/source_data/svg_data/edit.svg'
import deleteIcon from '@/assets/source_data/svg_data/delete.svg'

interface PermissionItem {
  key: string
  label: string
  id?: number | string
}

interface PermissionPage {
  key: string
  label: string
  permissions: PermissionItem[]
}

interface PermissionModule {
  key: string
  label: string
  pages: PermissionPage[]
}

interface RawPermission {
  id?: number | string
  permission_name?: string
  permission_code?: string
  description?: string
  resource?: string
  action?: string
}

const t = {
  roleManage: '\u89d2\u8272\u7ba1\u7406',
  roleName: '\u89d2\u8272\u540d\u79f0',
  roleCode: '\u89d2\u8272\u7f16\u7801',
  roleDesc: '\u89d2\u8272\u4ecb\u7ecd',
  createdAt: '\u521b\u5efa\u65f6\u95f4',
  action: '\u64cd\u4f5c',
  index: '\u5e8f\u53f7',
  inputRoleName: '\u8bf7\u8f93\u5165\u89d2\u8272\u540d',
  inputRoleCode: '\u8bf7\u8f93\u5165\u89d2\u8272\u7f16\u7801',
  inputRoleDesc: '\u8bf7\u8f93\u5165\u89d2\u8272\u4ecb\u7ecd',
  search: '\u67e5\u8be2',
  addRole: '\u65b0\u589e\u89d2\u8272',
  permission: '\u6743\u9650',
  edit: '\u7f16\u8f91',
  delete: '\u5220\u9664',
  loading: '\u52a0\u8f7d\u4e2d...',
  bodyParams: '\u672c\u4f53\u53c2\u6570',
  userManage: '\u7528\u6237\u7ba1\u7406',
  permissionConfig: '\u6743\u9650\u914d\u7f6e',
  selectAll: '\u5168\u9009',
  confirm: '\u786e\u8ba4',
  cancel: '\u53d6\u6d88',
  pageView: '\u9875\u9762\u67e5\u770b',
  itemUnit: '\u9879'
}

const MODULE_ORDER = ['main', 'nav', 'task', 'log', 'system']

const MODULE_NAME_BY_CODE: Record<string, string> = {
  main: '\u9996\u9875',
  nav: '\u5bfc\u822a\u7ba1\u7406',
  task: '\u4efb\u52a1\u7ba1\u7406',
  log: '\u65e5\u5fd7\u7ba1\u7406',
  system: '\u7cfb\u7edf\u7ba1\u7406'
}

const extractPermissionList = (response: unknown): RawPermission[] => {
  if (Array.isArray(response)) return response as RawPermission[]
  const data = (response as { data?: unknown })?.data
  if (Array.isArray(data)) return data as RawPermission[]
  return []
}

const buildPermissionModules = (list: RawPermission[]): PermissionModule[] => {
  const moduleMap = new Map<string, PermissionModule>()

  list.forEach((permissionRaw, index) => {
    const permissionName = permissionRaw.permission_name || ''
    const codePrefix = (permissionRaw.permission_code || '').split(';')[0]?.trim() ?? ''
    if (!permissionName || !codePrefix) return

    const codeParts = codePrefix.split('-').filter(Boolean)
    if (codeParts.length < 2) return

    const nameParts = permissionName.split('-').filter(Boolean)
    const moduleCode = codeParts[0]
    const hasPage = codeParts.length >= 3
    const pageCode = hasPage ? codeParts[1] : moduleCode
    const moduleName = nameParts[0] || MODULE_NAME_BY_CODE[moduleCode] || moduleCode
    const pageName = hasPage ? (nameParts[1] || pageCode) : moduleName
    const permissionLabel = hasPage
      ? (nameParts.slice(2).join('-') || codeParts.slice(2).join('-'))
      : (nameParts.slice(1).join('-') || codeParts.slice(1).join('-'))

    if (!moduleMap.has(moduleCode)) {
      moduleMap.set(moduleCode, {
        key: moduleCode,
        label: moduleName,
        pages: []
      })
    }

    const moduleItem = moduleMap.get(moduleCode)!
    let pageItem = moduleItem.pages.find(page => page.key === pageCode)
    if (!pageItem) {
      pageItem = {
        key: pageCode,
        label: pageName,
        permissions: []
      }
      moduleItem.pages.push(pageItem)
    }

    const permissionKey = codePrefix
    if (!pageItem.permissions.some(item => item.key === permissionKey)) {
      pageItem.permissions.push({
        id: permissionRaw.id ?? `${permissionKey}-${index}`,
        key: permissionKey,
        label: permissionLabel || t.pageView
      })
    }
  })

  const modules = Array.from(moduleMap.values())
  modules.sort((a, b) => {
    const aIndex = MODULE_ORDER.indexOf(a.key)
    const bIndex = MODULE_ORDER.indexOf(b.key)
    if (aIndex === -1 && bIndex === -1) return a.label.localeCompare(b.label, 'zh-CN')
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  modules.forEach(module => {
    module.pages.sort((a, b) => {
      if (a.key === module.key && b.key !== module.key) return -1
      if (b.key === module.key && a.key !== module.key) return 1
      return a.label.localeCompare(b.label, 'zh-CN')
    })
  })

  return modules
}

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()

const sidebarTabs = [
  { key: 'body', label: t.bodyParams, icon: bodyInfoIcon, path: '/dashboard/body-params', permission: 'system-body-show' },
  { key: 'user', label: t.userManage, icon: userIcon, path: '/dashboard/users', permission: 'system-user-show' },
  { key: 'role', label: t.roleManage, icon: roleIcon, path: '/dashboard/roles', permission: 'system-role-show' },
  { key: 'super', label: '\u8d85\u7ea7\u7ba1\u7406\u5458', icon: permissionIcon, path: '/dashboard/super-admin', permission: 'system-super-show' }
]

const currentTab = computed(() => {
  const tab = sidebarTabs.find(item => route.path === item.path)
  return tab?.key ?? 'role'
})
const showPermissionDialog = ref(false)
const currentRole = ref<any>(null)
const selectedPermissionKeys = ref<string[]>([])
const permissionModules = ref<PermissionModule[]>([])
const deleteConfirm = ref({
  visible: false,
  roleId: null as number | null,
  title: '删除角色',
  message: '确认删除该角色吗？'
})

const emitPermissionDenied = (permission: string) => {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('permission-denied', {
      detail: { permission }
    }))
  }
}

const handleTabClick = (tab: { key: string; path: string; permission?: string }) => {
  if (tab.permission && !permissionStore.hasPermission(tab.permission)) {
    emitPermissionDenied(tab.permission)
    return
  }
  if (route.path !== tab.path) router.push(tab.path)
}

const { roles, loading, fetchRoles, createRole, updateRole, deleteRole, updateRolePermissions } = useRoles()
const { fetchAllPermissions } = usePermissions()
const searchRoleName = ref('')
const showRoleDialog = ref(false)
const roleDialogMode = ref<'create' | 'edit'>('create')
const roleSubmitting = ref(false)
const roleForm = ref({
  id: null as number | null,
  role_name: '',
  role_code: '',
  description: ''
})
const displayRoles = computed(() => {
  return roles.value.filter(role => !searchRoleName.value || role.role_name?.includes(searchRoleName.value))
})

const roleEmptyRowCount = computed(() => Math.max(0, 10 - displayRoles.value.length))

const allPermissionKeys = computed(() => {
  return permissionModules.value.flatMap(module =>
    module.pages.flatMap(page => page.permissions.map(perm => getPermissionKey(perm)))
  )
})

const permissionIdByCode = computed(() => {
  const map = new Map<string, number>()
  permissionModules.value.forEach(module => {
    module.pages.forEach(page => {
      page.permissions.forEach(permission => {
        const id = Number(permission.id)
        if (!Number.isNaN(id)) map.set(permission.key, id)
      })
    })
  })
  return map
})

const getPermissionKey = (perm: PermissionItem) => {
  return perm.key
}

const getPageKeys = (module: PermissionModule, page: PermissionPage) => {
  return page.permissions.map(perm => getPermissionKey(perm))
}

const getModuleKeys = (module: PermissionModule) => {
  return module.pages.flatMap(page => getPageKeys(module, page))
}

const isAllChecked = (keys: string[]) => keys.length > 0 && keys.every(key => selectedPermissionKeys.value.includes(key))

const togglePermission = (key: string, checked: boolean) => {
  if (checked) {
    if (!selectedPermissionKeys.value.includes(key)) selectedPermissionKeys.value.push(key)
  } else {
    selectedPermissionKeys.value = selectedPermissionKeys.value.filter(item => item !== key)
  }
}

const toggleKeys = (keys: string[], checked: boolean) => {
  if (checked) {
    const merged = new Set([...selectedPermissionKeys.value, ...keys])
    selectedPermissionKeys.value = Array.from(merged)
  } else {
    const drop = new Set(keys)
    selectedPermissionKeys.value = selectedPermissionKeys.value.filter(item => !drop.has(item))
  }
}

const formatTime = (time: string) => {
  if (!time) return '-'
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN')
}

const loadPermissionModules = async () => {
  const response = await fetchAllPermissions()
  permissionModules.value = buildPermissionModules(extractPermissionList(response))
}

const getRolePermissionCodes = (role: any): string[] => {
  if (!role || !Array.isArray(role.permissions)) return []
  return role.permissions
    .map((item: any) => {
      if (typeof item === 'string') return item
      return item?.permission_code || item?.code || ''
    })
    .filter((item: string) => !!item)
}

const loadData = async () => {
  try {
    await Promise.all([
      fetchRoles(),
      loadPermissionModules()
    ])
  } catch (error) {
    console.error('load role manage data failed:', error)
  }
}

const onSearch = () => {
  loadData()
}

const onCreateRole = () => {
  roleDialogMode.value = 'create'
  roleForm.value = {
    id: null,
    role_name: '',
    role_code: '',
    description: ''
  }
  showRoleDialog.value = true
}

const onPermission = (id: number) => {
  const found = displayRoles.value.find(role => role.id === id) || null
  currentRole.value = found
  const rolePermissionCodes = getRolePermissionCodes(found)
  selectedPermissionKeys.value = rolePermissionCodes.filter(item => allPermissionKeys.value.includes(item))
  showPermissionDialog.value = true
}

const onPermissionConfirm = () => {
  const roleId = Number(currentRole.value?.id)
  if (Number.isNaN(roleId)) return
  const permissionIds = selectedPermissionKeys.value
    .map(code => permissionIdByCode.value.get(code))
    .filter((id): id is number => typeof id === 'number')
  updateRolePermissions(roleId, permissionIds)
    .then(() => {
      showPermissionDialog.value = false
    })
    .catch(error => {
      console.error('save role permissions failed:', error)
      window.alert('\u4fdd\u5b58\u6743\u9650\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5')
    })
}

const onEditRole = (id: number) => {
  const found = displayRoles.value.find(role => role.id === id)
  if (!found) return
  roleDialogMode.value = 'edit'
  roleForm.value = {
    id: Number(found.id),
    role_name: found.role_name || '',
    role_code: found.role_code || '',
    description: found.description || found.role_description || ''
  }
  showRoleDialog.value = true
}

const onDeleteRole = (id: number) => {
  deleteConfirm.value.visible = true
  deleteConfirm.value.roleId = id
}

const closeDeleteConfirm = () => {
  deleteConfirm.value.visible = false
  deleteConfirm.value.roleId = null
}

const confirmDeleteRole = () => {
  const roleId = deleteConfirm.value.roleId
  if (roleId == null) return
  deleteRole(roleId)
    .then(() => loadData())
    .catch(error => {
      console.error('delete role failed:', error)
      window.alert('\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5')
    })
    .finally(() => {
      closeDeleteConfirm()
    })
}

const onRoleSubmit = async () => {
  const roleName = roleForm.value.role_name.trim()
  const roleCode = roleForm.value.role_code.trim()
  const roleDesc = roleForm.value.description.trim()
  if (!roleName || !roleCode || !roleDesc) {
    window.alert('\u8bf7\u586b\u5199\u5b8c\u6574\u7684\u89d2\u8272\u4fe1\u606f')
    return
  }
  roleSubmitting.value = true
  try {
    if (roleDialogMode.value === 'create') {
      await createRole({ role_name: roleName, role_code: roleCode, description: roleDesc })
    } else {
      const roleId = Number(roleForm.value.id)
      if (Number.isNaN(roleId)) return
      await updateRole(roleId, { role_name: roleName, role_code: roleCode, description: roleDesc })
    }
    showRoleDialog.value = false
    await loadData()
  } catch (error) {
    console.error('save role failed:', error)
    window.alert('\u4fdd\u5b58\u89d2\u8272\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5')
  } finally {
    roleSubmitting.value = false
  }
}
onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import './mission-common.css';

.mission-top-header-left {
  justify-content: flex-start !important;
}

.mission-toolbar {
  margin-bottom: 12px;
}

.sys-btn {
  min-width: 96px;
}

.mission-toolbar-actions {
  margin-left: 8px;
}

.role-file-table .file-table-header,
.role-file-table .file-table-row {
  grid-template-columns: 80px 1.2fr 1.6fr 1.2fr 160px;
}

.role-file-table .file-table-cell {
  text-align: center;
}

.action-icons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-btn:hover {
  background: rgba(30, 98, 139, 0.28);
}

.icon-btn img {
  width: 18px;
  height: 18px;
}

.empty-state {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8cb7cc;
  font-size: 14px;
}

.permission-dialog {
  width: min(1200px, 90vw);
  max-height: 84vh;
  background: linear-gradient(135deg, #0e2f43 75%, #0a0f1c 100%);
  border: 1px solid rgba(72, 170, 219, 0.4);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.permission-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(63, 130, 165, 0.45);
  background: rgba(9, 30, 45, 0.45);
}

.permission-dialog-title {
  font-size: 18px;
  color: #67d5fd;
  font-weight: 600;
}

.select-all-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c7e6f7;
}

.permission-dialog-content {
  padding: 16px 20px 10px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  scrollbar-width: thin;
  scrollbar-color: rgba(80, 170, 220, 0.7) transparent;
}

.permission-dialog-content::-webkit-scrollbar {
  width: 8px;
}

.permission-dialog-content::-webkit-scrollbar-track {
  background: transparent;
}

.permission-dialog-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(100, 195, 242, 0.75), rgba(46, 132, 190, 0.78));
  border-radius: 8px;
  border: 1px solid rgba(12, 49, 78, 0.5);
}

.permission-dialog-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(117, 210, 255, 0.85), rgba(62, 154, 214, 0.9));
}

.permission-module {
  border: 1px solid rgba(50, 117, 165, 0.55);
  border-radius: 12px;
  background: rgba(28, 45, 78, 0.65);
  padding: 0 14px 14px;
}

.permission-module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 10px 12px;
  border-bottom: 1px solid rgba(63, 130, 165, 0.45);
  margin-bottom: 12px;
}

.permission-module-title {
  font-size: 16px;
  color: #7bdcff;
  font-weight: 600;
}

.module-select-all {
  font-size: 14px;
  color: #d7ebf8;
}

.permission-pages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.permission-page-card {
  border: 1px solid rgba(63, 130, 165, 0.3);
  background: rgba(10, 36, 61, 0.5);
  border-radius: 10px;
  padding: 10px 12px 12px;
}

.permission-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(63, 130, 165, 0.35);
}

.permission-page-title {
  font-size: 14px;
  font-weight: 600;
  color: #2ea9d6;
}

.permission-page-title span {
  line-height: 1.3;
}

.permission-page-count {
  font-size: 12px;
  color: #9cc7da;
}

.permission-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px 24px;
  padding: 0 10px;
}

.permission-items-page {
  gap: 10px 16px;
  padding: 0 2px;
}

.permission-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #d9efff;
  font-size: 14px;
}

.permission-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #1bb7ef;
}

.permission-dialog-actions {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 14px 0 18px;
  border-top: 1px solid rgba(63, 130, 165, 0.35);
}

.role-edit-dialog {
  width: min(560px, 90vw);
  background: linear-gradient(135deg, #0e2f43 75%, #0a0f1c 100%);
  border: 1px solid rgba(72, 170, 219, 0.4);
  border-radius: 10px;
  overflow: hidden;
}

.role-edit-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.role-edit-row {
  display: grid;
  grid-template-columns: 92px 1fr;
  align-items: center;
  gap: 12px;
}

.role-edit-label {
  color: #c8e8fb;
  font-size: 14px;
}

.role-edit-input {
  width: 100%;
  height: 38px;
  border: 1px solid rgba(53, 157, 213, 0.65);
  border-radius: 4px;
  background: rgba(15, 60, 94, 0.58);
  color: #e9f8ff;
  padding: 0 12px;
  outline: none;
}

.role-edit-input:focus {
  border-color: rgba(96, 196, 245, 0.85);
  box-shadow: 0 0 0 2px rgba(89, 185, 235, 0.15);
}
</style>



