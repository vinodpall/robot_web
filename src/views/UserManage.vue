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
              <span class="mission-top-title">{{ t.userManage }}</span>
            </div>
          </div>

          <div class="mission-content-wrapper">
            <div class="mission-toolbar">
              <span class="mission-toolbar-label" style="margin-right: -8px;">{{ t.username }}:</span>
              <input v-model.trim="filters.username" class="mission-toolbar-select" style="min-width: 180px;" :placeholder="t.inputUsername" />

              <span class="mission-toolbar-label" style="margin-left: 20px; margin-right: -8px;">{{ t.fullName }}:</span>
              <input v-model.trim="filters.fullName" class="mission-toolbar-select" style="min-width: 180px;" :placeholder="t.inputFullName" />

              <span class="mission-toolbar-label" style="margin-left: 20px; margin-right: -8px;">{{ t.role }}:</span>
              <select v-model="filters.roleName" class="mission-toolbar-select role-select" style="min-width: 180px;">
                <option value="">{{ t.selectRole }}</option>
                <option v-for="role in roleOptions" :key="role.id" :value="role.role_name">{{ role.role_name }}</option>
              </select>

              <div class="mission-toolbar-actions">
              <button class="mission-btn mission-btn-pause sys-btn" v-permission-click-dialog="'system-user-query'" @click="onSearch">{{ t.search }}</button>
              <button class="mission-btn mission-btn-pause sys-btn" v-permission-click-dialog="'system-user-create'" @click="onCreateUser">{{ t.addUser }}</button>
              </div>
            </div>

            <div class="file-table file-table-adaptive user-file-table">
              <div class="file-table-header">
                <div class="file-table-cell">{{ t.index }}</div>
                <div class="file-table-cell">{{ t.username }}</div>
                <div class="file-table-cell">{{ t.fullName }}</div>
                <div class="file-table-cell">{{ t.role }}</div>
                <div class="file-table-cell">{{ t.contact }}</div>
                <div class="file-table-cell">{{ t.createdAt }}</div>
                <div class="file-table-cell file-table-action">{{ t.action }}</div>
              </div>

              <div class="file-table-body">
                <div v-for="(user, idx) in displayUsers" :key="user.id" class="file-table-row">
                  <div class="file-table-cell">{{ idx + 1 }}</div>
                  <div class="file-table-cell">{{ user.username || '-' }}</div>
                  <div class="file-table-cell">{{ user.full_name || user.userfullname || '-' }}</div>
                  <div class="file-table-cell">{{ getRoleNames(user) || '-' }}</div>
                  <div class="file-table-cell">{{ user.email || '-' }}</div>
                  <div class="file-table-cell">{{ formatTime(user.created_at || user.created_time) }}</div>
                  <div class="file-table-cell file-table-action">
                    <div class="action-icons">
                      <button class="icon-btn" :title="t.edit" v-permission-click-dialog="'system-user-edit'" @click="onEditUser(user)">
                        <img :src="editIcon" alt="edit" />
                      </button>
                      <button class="icon-btn" :title="t.delete" v-permission-click-dialog="'system-user-delete'" @click="onDeleteUser(user)">
                        <img :src="deleteIcon" alt="delete" />
                      </button>
                    </div>
                  </div>
                </div>

                <div v-for="i in userEmptyRowCount" :key="`empty-${i}`" class="file-table-row">
                  <div class="file-table-cell"></div>
                  <div class="file-table-cell"></div>
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

    <div v-if="showUserDialog" class="custom-dialog-mask">
      <div class="user-edit-dialog">
        <div class="dialog-header">
          <div class="dialog-title">{{ userDialogMode === 'create' ? t.addUser : t.editUser }}</div>
        </div>
        <div class="user-edit-content">
          <div class="user-edit-row">
            <label class="user-edit-label">{{ t.username }}</label>
            <input v-model.trim="userForm.username" class="user-edit-input" :placeholder="t.inputUsername" />
          </div>
          <div class="user-edit-row">
            <label class="user-edit-label">{{ t.email }}</label>
            <input v-model.trim="userForm.email" class="user-edit-input" :placeholder="t.inputEmail" />
          </div>
          <div class="user-edit-row">
            <label class="user-edit-label">{{ t.fullName }}</label>
            <input v-model.trim="userForm.full_name" class="user-edit-input" :placeholder="t.inputFullName" />
          </div>
          <div class="user-edit-row">
            <label class="user-edit-label">{{ t.password }}</label>
            <input v-model.trim="userForm.password" type="password" class="user-edit-input" :placeholder="userDialogMode === 'create' ? t.inputPassword : t.inputPasswordOptional" />
          </div>
          <div class="user-edit-row">
            <label class="user-edit-label">{{ t.role }}</label>
            <div ref="roleMultiRef" class="role-multi-select">
              <button type="button" class="role-multi-trigger" @click="toggleRoleDropdown">
                <span class="role-multi-text">{{ selectedRoleNamesText || t.selectRole }}</span>
                <span :class="['role-multi-arrow', { open: roleDropdownOpen }]">▼</span>
              </button>
              <div v-if="roleDropdownOpen" class="role-multi-panel">
                <label v-for="role in roleOptions" :key="role.id" class="role-multi-option">
                  <input
                    type="checkbox"
                    :checked="isRoleSelected(role.id)"
                    @change="toggleRoleSelection(role.id)"
                  />
                  <span>{{ role.role_name }}</span>
                </label>
                <div v-if="roleOptions.length === 0" class="role-multi-empty">{{ t.noRoleData }}</div>
              </div>
            </div>
          </div>
          <div class="selected-role-text">{{ t.selectedRoles }}{{ selectedRoleNamesText || '-' }}</div>
          <div class="user-edit-row">
            <label class="user-edit-label">{{ t.robotName }}</label>
            <div ref="robotMultiRef" class="role-multi-select">
              <button type="button" class="role-multi-trigger" @click="toggleRobotDropdown">
                <span class="role-multi-text">{{ selectedRobotNamesText || t.selectRobot }}</span>
                <span :class="['role-multi-arrow', { open: robotDropdownOpen }]">▼</span>
              </button>
              <div v-if="robotDropdownOpen" class="role-multi-panel">
                <label v-for="robot in robotOptions" :key="robot.id" class="role-multi-option">
                  <input
                    type="checkbox"
                    :checked="isRobotSelected(robot.id)"
                    @change="toggleRobotSelection(robot.id)"
                  />
                  <span>{{ robot.name }}</span>
                </label>
                <div v-if="robotOptions.length === 0" class="role-multi-empty">{{ t.noRobotData }}</div>
              </div>
            </div>
          </div>
          <div class="selected-role-text">{{ t.selectedRobots }}{{ selectedRobotNamesText || '-' }}</div>
        </div>
        <div class="dialog-actions">
          <button
            class="mission-btn mission-btn-pause"
            :disabled="submitting"
            v-permission-click-dialog="userDialogMode === 'create' ? 'system-user-create' : 'system-user-edit'"
            @click="onUserSubmit"
          >
            {{ t.confirm }}
          </button>
          <button class="mission-btn mission-btn-cancel" :disabled="submitting" @click="showUserDialog = false">{{ t.cancel }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import { useRoles, useUsers } from '@/composables/useApi'
import { robotApi } from '@/api/services'
import type { Robot, Role, User } from '@/types'
import bodyInfoIcon from '@/assets/source_data/svg_data/robot_source/body_info.svg'
import userIcon from '@/assets/source_data/svg_data/user.svg'
import roleIcon from '@/assets/source_data/svg_data/role.svg'
import permissionIcon from '@/assets/source_data/svg_data/permission.svg'
import editIcon from '@/assets/source_data/svg_data/edit.svg'
import deleteIcon from '@/assets/source_data/svg_data/delete.svg'

const t = {
  userManage: '\u7528\u6237\u7ba1\u7406',
  username: '\u7528\u6237\u540d',
  fullName: '\u59d3\u540d',
  role: '\u89d2\u8272',
  contact: '\u8054\u7cfb\u65b9\u5f0f',
  gender: '\u6027\u522b',
  idCard: '\u8eab\u4efd\u8bc1\u53f7',
  createdAt: '\u6ce8\u518c\u65f6\u95f4',
  action: '\u64cd\u4f5c',
  index: '\u5e8f\u53f7',
  email: 'Email',
  password: '\u5bc6\u7801',
  search: '\u67e5\u8be2',
  addUser: '\u65b0\u589e\u7528\u6237',
  editUser: '\u7f16\u8f91\u7528\u6237',
  edit: '\u7f16\u8f91',
  delete: '\u5220\u9664',
  confirm: '\u786e\u8ba4',
  cancel: '\u53d6\u6d88',
  loading: '\u52a0\u8f7d\u4e2d...',
  inputUsername: '\u8bf7\u8f93\u5165\u7528\u6237\u540d',
  inputFullName: '\u8bf7\u8f93\u5165\u59d3\u540d',
  inputEmail: '\u8bf7\u8f93\u5165\u90ae\u7bb1',
  inputPassword: '\u8bf7\u8f93\u5165\u5bc6\u7801',
  inputPasswordOptional: '\u4e0d\u4fee\u6539\u5bc6\u7801\u53ef\u4e0d\u586b',
  selectRole: '\u8bf7\u9009\u62e9\u89d2\u8272',
  selectedRoles: '\u5df2\u9009\u89d2\u8272\uff1a',
  noRoleData: '\u6682\u65e0\u89d2\u8272\u6570\u636e',
  robotName: '\u673a\u5668\u4eba\u540d\u79f0',
  selectRobot: '\u8bf7\u9009\u62e9\u673a\u5668\u4eba',
  selectedRobots: '\u5df2\u9009\u673a\u5668\u4eba\uff1a',
  noRobotData: '\u6682\u65e0\u673a\u5668\u4eba\u6570\u636e'
}

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()

const sidebarTabs = [
  { key: 'body', label: '\u672c\u4f53\u53c2\u6570', icon: bodyInfoIcon, path: '/dashboard/body-params', permission: 'system-body-show' },
  { key: 'user', label: t.userManage, icon: userIcon, path: '/dashboard/users', permission: 'system-user-show' },
  { key: 'role', label: '\u89d2\u8272\u7ba1\u7406', icon: roleIcon, path: '/dashboard/roles', permission: 'system-role-show' },
  { key: 'super', label: '\u8d85\u7ea7\u7ba1\u7406\u5458', icon: permissionIcon, path: '/dashboard/super-admin', permission: 'system-super-show' }
]

const currentTab = computed(() => {
  const tab = sidebarTabs.find(item => route.path === item.path)
  return tab?.key ?? 'user'
})
const filters = ref({
  username: '',
  fullName: '',
  roleName: ''
})

const showUserDialog = ref(false)
const userDialogMode = ref<'create' | 'edit'>('create')
const submitting = ref(false)
const roleDropdownOpen = ref(false)
const roleMultiRef = ref<HTMLElement | null>(null)
const robotDropdownOpen = ref(false)
const robotMultiRef = ref<HTMLElement | null>(null)
const robotOptions = ref<Robot[]>([])
const robotOptionsLoading = ref(false)
const userForm = ref({
  id: null as number | null,
  username: '',
  email: '',
  full_name: '',
  password: '',
  role_ids: [] as number[],
  robot_ids: [] as number[]
})

const { users, loading, fetchUsers, createUser, updateUser, deleteUser, getUser, syncUserRole, syncUserRobots } = useUsers()
const { roles, fetchRoles } = useRoles()

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

const normalizeRoleName = (role: unknown): string => {
  if (typeof role === 'string') return role
  if (role && typeof role === 'object' && 'role_name' in role) return String((role as { role_name?: unknown }).role_name ?? '')
  return ''
}

const normalizeRoleId = (role: unknown): number | null => {
  if (role && typeof role === 'object' && 'id' in role) {
    const value = Number((role as { id?: unknown }).id)
    return Number.isNaN(value) ? null : value
  }
  return null
}

const normalizeRobotId = (robot: unknown): number | null => {
  if (robot && typeof robot === 'object' && 'id' in robot) {
    const value = Number((robot as { id?: unknown }).id)
    return Number.isNaN(value) ? null : value
  }
  return null
}

const getRoleNames = (user: User): string => {
  if (!Array.isArray(user.roles)) return ''
  return user.roles.map(item => normalizeRoleName(item)).filter(Boolean).join('\u3001')
}

const roleOptions = computed<Role[]>(() => roles.value.filter(role => !!role.role_name))
const selectedRoleNamesText = computed(() => {
  if (userForm.value.role_ids.length === 0) return ''
  const nameMap = new Map(roleOptions.value.map(role => [Number(role.id), role.role_name]))
  return userForm.value.role_ids
    .map(id => nameMap.get(Number(id)) || String(id))
    .join('\u3001')
})
const selectedRobotNamesText = computed(() => {
  if (userForm.value.robot_ids.length === 0) return ''
  const nameMap = new Map(robotOptions.value.map(robot => [Number(robot.id), robot.name]))
  return userForm.value.robot_ids
    .map(id => nameMap.get(Number(id)) || String(id))
    .join('\u3001')
})

const displayUsers = computed(() => {
  return users.value.filter(user => {
    const usernameOk = !filters.value.username || user.username?.includes(filters.value.username)
    const fullNameText = user.full_name || user.userfullname || ''
    const fullNameOk = !filters.value.fullName || fullNameText.includes(filters.value.fullName)
    const roleText = getRoleNames(user)
    const roleOk = !filters.value.roleName || roleText.includes(filters.value.roleName)
    return usernameOk && fullNameOk && roleOk
  })
})

const userEmptyRowCount = computed(() => Math.max(0, 10 - displayUsers.value.length))

const formatTime = (time?: string | null) => {
  if (!time) return '-'
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN')
}

const fetchRobots = async () => {
  robotOptionsLoading.value = true
  try {
    const response = await robotApi.getRobots({ skip: 0, limit: 50 })
    const list = (response as { items?: Robot[] })?.items
    robotOptions.value = Array.isArray(list) ? list : []
  } catch (error) {
    console.error('fetch robots failed:', error)
    robotOptions.value = []
  } finally {
    robotOptionsLoading.value = false
  }
}

const loadData = async () => {
  try {
    await Promise.all([fetchUsers(), fetchRoles(), fetchRobots()])
  } catch (error) {
    console.error('load users failed:', error)
  }
}

const onSearch = () => {
  loadData()
}

const onCreateUser = () => {
  userDialogMode.value = 'create'
  userForm.value = {
    id: null,
    username: '',
    email: '',
    full_name: '',
    password: '',
    role_ids: [],
    robot_ids: []
  }
  roleDropdownOpen.value = false
  robotDropdownOpen.value = false
  showUserDialog.value = true
  if (robotOptions.value.length === 0 && !robotOptionsLoading.value) {
    fetchRobots()
  }
}

const onEditUser = async (user: User) => {
  userDialogMode.value = 'edit'
  let detailUser = user
  try {
    const response = await getUser(user.id)
    if (response) {
      detailUser = response as User
    }
  } catch (error) {
    console.error('fetch user detail failed:', error)
  }

  const roleIds: number[] = []
  const robotIds: number[] = []
  if (Array.isArray(detailUser.roles)) {
    detailUser.roles.forEach(item => {
      if (typeof item === 'string') {
        const found = roleOptions.value.find(role => role.role_name === item)
        if (found?.id != null) roleIds.push(Number(found.id))
        return
      }
      const roleId = normalizeRoleId(item)
      if (roleId != null) roleIds.push(roleId)
    })
  }
  if (Array.isArray(detailUser.robots)) {
    detailUser.robots.forEach(item => {
      if (typeof item === 'string') {
        const found = robotOptions.value.find(robot => robot.name === item)
        if (found?.id != null) robotIds.push(Number(found.id))
        return
      }
      const robotId = normalizeRobotId(item)
      if (robotId != null) robotIds.push(robotId)
    })
  }
  userForm.value = {
    id: detailUser.id,
    username: detailUser.username || '',
    email: detailUser.email || '',
    full_name: detailUser.full_name || detailUser.userfullname || '',
    password: '',
    role_ids: Array.from(new Set(roleIds)),
    robot_ids: Array.from(new Set(robotIds))
  }
  roleDropdownOpen.value = false
  robotDropdownOpen.value = false
  showUserDialog.value = true
  if (robotOptions.value.length === 0 && !robotOptionsLoading.value) {
    fetchRobots()
  }
}

const isRoleSelected = (roleId: number | string) => {
  const id = Number(roleId)
  return userForm.value.role_ids.includes(id)
}

const toggleRoleSelection = (roleId: number | string) => {
  const id = Number(roleId)
  const current = userForm.value.role_ids
  if (current.includes(id)) {
    userForm.value.role_ids = current.filter(item => item !== id)
  } else {
    userForm.value.role_ids = [...current, id]
  }
}

const toggleRoleDropdown = () => {
  robotDropdownOpen.value = false
  roleDropdownOpen.value = !roleDropdownOpen.value
}

const isRobotSelected = (robotId: number | string) => {
  const id = Number(robotId)
  return userForm.value.robot_ids.includes(id)
}

const toggleRobotSelection = (robotId: number | string) => {
  const id = Number(robotId)
  const current = userForm.value.robot_ids
  if (current.includes(id)) {
    userForm.value.robot_ids = current.filter(item => item !== id)
  } else {
    userForm.value.robot_ids = [...current, id]
  }
}

const toggleRobotDropdown = async () => {
  roleDropdownOpen.value = false
  const nextOpen = !robotDropdownOpen.value
  robotDropdownOpen.value = nextOpen
  if (nextOpen && robotOptions.value.length === 0 && !robotOptionsLoading.value) {
    await fetchRobots()
  }
}

const onGlobalMouseDown = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!target) return
  if (roleMultiRef.value && !roleMultiRef.value.contains(target)) {
    roleDropdownOpen.value = false
  }
  if (robotMultiRef.value && !robotMultiRef.value.contains(target)) {
    robotDropdownOpen.value = false
  }
}

const onDeleteUser = (user: User) => {
  if (!window.confirm('\u786e\u8ba4\u5220\u9664\u8be5\u7528\u6237\u5417\uff1f')) return
  deleteUser(user.id)
    .then(() => fetchUsers())
    .catch(error => {
      console.error('delete user failed:', error)
      window.alert('\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5')
    })
}

const onUserSubmit = async () => {
  const username = userForm.value.username.trim()
  const password = userForm.value.password.trim()
  if (!username) {
    window.alert('\u7528\u6237\u540d\u4e3a\u5fc5\u586b\u9879')
    return
  }

  if (userDialogMode.value === 'create' && !password) {
    window.alert('\u5bc6\u7801\u4e3a\u5fc5\u586b\u9879')
    return
  }

  submitting.value = true
  try {
    if (userDialogMode.value === 'create') {
      const created = await createUser({
        username,
        email: userForm.value.email.trim() || undefined,
        full_name: userForm.value.full_name.trim() || undefined,
        password
      })

      const createdUserId = Number((created as User)?.id)
      if (!Number.isNaN(createdUserId)) {
        await syncUserRole(createdUserId, userForm.value.role_ids)
        await syncUserRobots(createdUserId, userForm.value.robot_ids)
      }
    } else {
      const userId = Number(userForm.value.id)
      if (Number.isNaN(userId)) return
      await updateUser(userId, {
        username,
        email: userForm.value.email.trim() || undefined,
        full_name: userForm.value.full_name.trim() || undefined,
        password: password || undefined
      })

      await syncUserRole(userId, userForm.value.role_ids)
      await syncUserRobots(userId, userForm.value.robot_ids)
    }

    showUserDialog.value = false
    await fetchUsers()
  } catch (error) {
    console.error('save user failed:', error)
    window.alert('\u4fdd\u5b58\u7528\u6237\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onGlobalMouseDown)
  loadData()
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onGlobalMouseDown)
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

.user-file-table .file-table-header,
.user-file-table .file-table-row {
  grid-template-columns: 80px 1fr 1fr 1fr 1fr 1.2fr 160px;
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

.user-edit-dialog {
  width: min(560px, 90vw);
  background: linear-gradient(135deg, #0e2f43 75%, #0a0f1c 100%);
  border: 1px solid rgba(72, 170, 219, 0.4);
  border-radius: 10px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(63, 130, 165, 0.45);
  background: rgba(9, 30, 45, 0.45);
}

.dialog-title {
  font-size: 18px;
  color: #67d5fd;
  font-weight: 600;
}

.user-edit-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.user-edit-row {
  display: grid;
  grid-template-columns: 92px 1fr;
  align-items: center;
  gap: 12px;
}

.user-edit-label {
  color: #c8e8fb;
  font-size: 14px;
}

.user-edit-input {
  width: 100%;
  height: 38px;
  border: 1px solid rgba(53, 157, 213, 0.65);
  border-radius: 4px;
  background: rgba(15, 60, 94, 0.58);
  color: #e9f8ff;
  padding: 0 12px;
  outline: none;
}

.user-edit-input:focus {
  border-color: rgba(96, 196, 245, 0.85);
  box-shadow: 0 0 0 2px rgba(89, 185, 235, 0.15);
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 14px 0 18px;
  border-top: 1px solid rgba(63, 130, 165, 0.35);
}

.selected-role-text {
  margin-top: -6px;
  color: #9cc9dd;
  font-size: 13px;
  padding-left: 104px;
  line-height: 1.5;
  white-space: normal;
  word-break: break-all;
  max-height: 56px;
  overflow-y: auto;
  padding-right: 6px;
}

.role-multi-select {
  position: relative;
  width: 100%;
}

.role-multi-trigger {
  width: 100%;
  min-height: 38px;
  border: 1px solid rgba(53, 157, 213, 0.75);
  border-radius: 4px;
  background: rgba(15, 60, 94, 0.92);
  color: #e9f8ff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
}

.role-multi-text {
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.role-multi-arrow {
  flex: 0 0 auto;
  font-size: 11px;
  color: #9fd2eb;
  transition: transform 0.2s ease;
}

.role-multi-arrow.open {
  transform: rotate(180deg);
}

.role-multi-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  max-height: 180px;
  overflow: auto;
  border: 1px solid rgba(53, 157, 213, 0.65);
  border-radius: 6px;
  background: rgba(12, 48, 76, 0.98);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  padding: 6px;
  overflow-x: hidden;
}

.role-multi-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 4px 8px;
  border-radius: 4px;
  color: #e9f8ff;
  cursor: pointer;
}

.role-multi-option span {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-multi-option:hover {
  background: rgba(45, 120, 176, 0.28);
}

.role-multi-option input {
  accent-color: #2f9fdb;
}

.role-multi-empty {
  padding: 8px;
  color: #9cc9dd;
  font-size: 13px;
}

.role-select {
  background-color: rgba(15, 60, 94, 0.92) !important;
  color: #e9f8ff;
  border: 1px solid rgba(53, 157, 213, 0.75);
}

.role-select:focus {
  border-color: rgba(96, 196, 245, 0.9);
  box-shadow: 0 0 0 2px rgba(89, 185, 235, 0.15);
}

.role-select option {
  background-color: #174a70;
  color: #e9f8ff;
}
</style>



