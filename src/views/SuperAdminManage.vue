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
              <span class="mission-top-title">{{ t.superAdmin }}</span>
            </div>
          </div>

          <div class="mission-content-wrapper split-wrapper">
            <div class="split-layout">
              <section class="split-panel module-panel">
                <div class="panel-head">
                  <div class="panel-title">{{ t.moduleManage }}</div>
                  <button class="mission-btn mission-btn-pause panel-btn" @click="openAddModuleDialog">{{ t.add }}</button>
                </div>

                <div class="module-list">
                  <button
                    v-for="item in modules"
                    :key="item.code"
                    class="module-item"
                    :class="{ active: item.code === selectedModuleCode }"
                    @click="selectedModuleCode = item.code"
                  >
                    <span class="module-name">{{ item.name }}</span>
                    <span class="module-code">{{ item.code }}</span>
                  </button>
                  <div v-if="!loading && modules.length === 0" class="empty-tip">{{ t.noModule }}</div>
                  <div v-if="loading" class="empty-tip">{{ t.loading }}</div>
                </div>
              </section>

              <section class="split-panel permission-panel">
                <div class="panel-head">
                  <div class="panel-title">{{ t.permissionManage }}</div>
                  <div class="panel-actions">
                    <button class="mission-btn mission-btn-pause panel-btn" @click="openAddPageDialog">{{ t.addPage }}</button>
                  </div>
                </div>

                <div class="permission-cards">
                  <div v-for="block in selectedModuleBlocks" :key="block.key" class="page-card">
                    <div class="page-card-head">
                      <div class="page-title-wrap">
                        <span class="checkbox-dot"></span>
                        <span class="page-title">{{ block.name }}</span>
                        <button
                          v-if="block.type === 'page'"
                          class="page-delete-icon-btn"
                          :title="t.deletePage"
                          @click="removePageBlock(block)"
                        >
                          <img :src="deleteIcon" alt="delete-page" />
                        </button>
                        <button
                          v-if="block.type === 'module'"
                          class="page-delete-icon-btn"
                          :title="t.deleteModule"
                          @click="removeModuleBlock(block)"
                        >
                          <img :src="deleteIcon" alt="delete-module" />
                        </button>
                      </div>
                      <div class="page-card-actions">
                        <span class="page-count">{{ block.permissions.length }} {{ t.itemUnit }}</span>
                        <button class="mission-btn mission-btn-pause mini-btn" @click="openAddPermissionDialog(block)">{{ t.addPermission }}</button>
                      </div>
                    </div>
                    <div class="permission-grid">
                      <div v-for="item in block.permissions" :key="item.id" class="permission-chip" :title="item.permission_code">
                        <span class="checkbox-dot"></span>
                        <span class="permission-text">{{ item.display_name }}</span>
                        <button class="delete-icon-btn" :title="t.deletePermission" @click="removePermission(item)">
                          <img :src="deleteIcon" alt="delete" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div v-if="!loading && selectedModule && selectedModuleBlocks.length === 0" class="perm-empty">
                    {{ t.noPermission }}
                  </div>
                  <div v-if="!loading && !selectedModule" class="perm-empty">{{ t.selectModuleFirst }}</div>
                  <div v-if="loading" class="perm-empty">{{ t.loading }}</div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>

  <div v-if="showAddModuleDialog" class="custom-dialog-mask" @click.self="closeDialogs">
    <div class="simple-dialog">
      <div class="simple-dialog-title">{{ t.addModule }}</div>
      <div class="dialog-form-grid">
        <input v-model.trim="moduleForm.moduleNameCn" class="mission-toolbar-select" :placeholder="t.inputNameCn" />
        <input v-model.trim="moduleForm.moduleNameEn" class="mission-toolbar-select" :placeholder="t.inputNameEn" />
      </div>
      <div class="simple-dialog-actions">
        <button class="mission-btn mission-btn-pause" :disabled="submitting" @click="submitAddModule">{{ t.confirm }}</button>
        <button class="mission-btn mission-btn-cancel" :disabled="submitting" @click="closeDialogs">{{ t.cancel }}</button>
      </div>
    </div>
  </div>

  <div v-if="showAddPageDialog" class="custom-dialog-mask" @click.self="closeDialogs">
    <div class="simple-dialog">
      <div class="simple-dialog-title">{{ t.addPage }}</div>
      <div class="dialog-form-grid">
        <input v-model.trim="pageForm.pageNameCn" class="mission-toolbar-select" :placeholder="t.inputNameCn" />
        <input v-model.trim="pageForm.pageNameEn" class="mission-toolbar-select" :placeholder="t.inputNameEn" />
      </div>
      <div class="simple-dialog-actions">
        <button class="mission-btn mission-btn-pause" :disabled="submitting" @click="submitAddPage">{{ t.confirm }}</button>
        <button class="mission-btn mission-btn-cancel" :disabled="submitting" @click="closeDialogs">{{ t.cancel }}</button>
      </div>
    </div>
  </div>

  <div v-if="showAddPermissionDialog" class="custom-dialog-mask" @click.self="closeDialogs">
    <div class="simple-dialog large-dialog">
      <div class="simple-dialog-title">{{ t.addPermission }} - {{ permissionTargetLabel }}</div>
      <div class="dialog-form-grid">
        <input v-model.trim="permissionForm.permissionNameCn" class="mission-toolbar-select" :placeholder="t.inputNameCn" />
        <input v-model.trim="permissionForm.permissionNameEn" class="mission-toolbar-select" :placeholder="t.inputNameEn" />
      </div>
      <div class="code-preview">{{ t.previewCode }}：{{ previewPermissionCode || '-' }}</div>
      <div class="simple-dialog-actions">
        <button class="mission-btn mission-btn-pause" :disabled="submitting" @click="submitAddPermission">{{ t.confirm }}</button>
        <button class="mission-btn mission-btn-cancel" :disabled="submitting" @click="closeDialogs">{{ t.cancel }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permission'
import { permissionApi } from '@/api/services'
import bodyInfoIcon from '@/assets/source_data/svg_data/robot_source/body_info.svg'
import userIcon from '@/assets/source_data/svg_data/user.svg'
import roleIcon from '@/assets/source_data/svg_data/role.svg'
import permissionIcon from '@/assets/source_data/svg_data/permission.svg'
import deleteIcon from '@/assets/source_data/svg_data/delete.svg'

interface PermissionPayload {
  permission_name: string
  permission_code: string
  description: string
  resource: string
  action: string
}

interface RawPermission extends PermissionPayload {
  id: string
}

interface BlockPermission extends RawPermission {
  display_name: string
}

interface PermissionBlock {
  key: string
  name: string
  code: string
  type: 'module' | 'page'
  permissions: BlockPermission[]
}

interface ModuleItem {
  code: string
  name: string
  blocks: PermissionBlock[]
}

const t = {
  superAdmin: '超级管理员',
  moduleManage: '模块管理',
  permissionManage: '权限管理',
  add: '新增',
  addModule: '新增大模块',
  addPage: '新增子页面',
  addPermission: '新增权限',
  deletePage: '删除子页面',
  deleteModule: '删除模块',
  deletePermission: '删除权限',
  confirm: '确认',
  cancel: '取消',
  noModule: '暂无模块数据',
  noPermission: '暂无权限块，请先新增子页面',
  selectModuleFirst: '请先选择左侧模块',
  loading: '加载中...',
  inputNameCn: '请输入中文名称',
  inputNameEn: '请输入英文名称（编码）',
  previewCode: 'permission_code预览',
  itemUnit: '项'
}

const router = useRouter()
const route = useRoute()
const permissionStore = usePermissionStore()

const sidebarTabs = [
  { key: 'body', label: '本体参数', icon: bodyInfoIcon, path: '/dashboard/body-params', permission: 'system-body-show' },
  { key: 'user', label: '用户管理', icon: userIcon, path: '/dashboard/users', permission: 'system-user-show' },
  { key: 'role', label: '角色管理', icon: roleIcon, path: '/dashboard/roles', permission: 'system-role-show' },
  { key: 'super', label: '超级管理员', icon: permissionIcon, path: '/dashboard/super-admin', permission: 'system-super-show' }
]

const MODULE_NAME_BY_CODE: Record<string, string> = {
  main: '首页',
  nav: '导航管理',
  task: '任务管理',
  log: '日志管理',
  system: '系统管理'
}

const currentTab = computed(() => {
  const tab = sidebarTabs.find(item => route.path === item.path)
  return tab?.key ?? 'super'
})
const loading = ref(false)
const submitting = ref(false)
const modules = ref<ModuleItem[]>([])
const selectedModuleCode = ref('')

const showAddModuleDialog = ref(false)
const showAddPageDialog = ref(false)
const showAddPermissionDialog = ref(false)

const moduleForm = ref({ moduleNameCn: '', moduleNameEn: '' })
const pageForm = ref({ pageNameCn: '', pageNameEn: '' })
const permissionForm = ref({ permissionNameCn: '', permissionNameEn: '' })
const permissionTargetBlock = ref<PermissionBlock | null>(null)

const selectedModule = computed(() => modules.value.find(item => item.code === selectedModuleCode.value) ?? null)
const selectedModuleBlocks = computed(() => selectedModule.value?.blocks ?? [])

const permissionTargetLabel = computed(() => {
  const block = permissionTargetBlock.value
  return block ? block.name : ''
})

const previewPermissionCode = computed(() => {
  if (!selectedModule.value || !permissionTargetBlock.value) return ''
  const permissionName = permissionForm.value.permissionNameCn.trim()
  if (!permissionName) return ''
  const actionCode = normalizeAsciiCode(permissionForm.value.permissionNameEn.trim())
  if (!actionCode) return ''
  if (permissionTargetBlock.value.type === 'module') {
    return `${selectedModule.value.code}-${actionCode};${selectedModule.value.name}-${permissionName}`
  }
  return `${selectedModule.value.code}-${permissionTargetBlock.value.code}-${actionCode};${selectedModule.value.name}-${permissionTargetBlock.value.name}-${permissionName}`
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

const extractList = (response: unknown): RawPermission[] => {
  if (Array.isArray(response)) return response as RawPermission[]
  const data = (response as { data?: unknown })?.data
  if (Array.isArray(data)) return data as RawPermission[]
  return []
}

const parsePermission = (permission: RawPermission) => {
  const codePrefix = (permission.permission_code || '').split(';')[0]?.trim() ?? ''
  const codeParts = codePrefix.split('-').filter(Boolean)
  const nameParts = (permission.permission_name || '').split('-').filter(Boolean)

  const moduleCode = codeParts[0] || ''
  const pageCode = codeParts.length >= 3 ? codeParts[1] : ''
  const moduleName = nameParts[0] || MODULE_NAME_BY_CODE[moduleCode] || moduleCode
  const pageName = codeParts.length >= 3 ? (nameParts[1] || pageCode) : ''

  let permissionName = permission.permission_name || ''
  if (nameParts.length >= 3) permissionName = nameParts.slice(2).join('-')
  if (nameParts.length === 2) permissionName = nameParts[1]

  return { moduleCode, moduleName, pageCode, pageName, codeParts, permissionName }
}

const buildModules = (permissionList: RawPermission[]): ModuleItem[] => {
  const moduleMap = new Map<string, ModuleItem>()

  permissionList.forEach((itemRaw, index) => {
    const item: RawPermission = {
      id: String((itemRaw as { id?: string | number }).id ?? `${itemRaw.permission_code}-${index}`),
      permission_name: itemRaw.permission_name || '',
      permission_code: itemRaw.permission_code || '',
      description: itemRaw.description || '',
      resource: itemRaw.resource || '',
      action: itemRaw.action || ''
    }

    const parsed = parsePermission(item)
    if (!parsed.moduleCode) return

    if (!moduleMap.has(parsed.moduleCode)) {
      moduleMap.set(parsed.moduleCode, {
        code: parsed.moduleCode,
        name: parsed.moduleName,
        blocks: []
      })
    }

    const moduleItem = moduleMap.get(parsed.moduleCode)!

    let blockKey = `module:${parsed.moduleCode}`
    let blockName = moduleItem.name
    let blockCode = parsed.moduleCode
    let blockType: 'module' | 'page' = 'module'

    if (parsed.codeParts.length >= 3) {
      blockKey = `page:${parsed.pageCode}`
      blockName = parsed.pageName
      blockCode = parsed.pageCode
      blockType = 'page'
    }

    let block = moduleItem.blocks.find(itemBlock => itemBlock.key === blockKey)
    if (!block) {
      block = {
        key: blockKey,
        name: blockName,
        code: blockCode,
        type: blockType,
        permissions: []
      }
      moduleItem.blocks.push(block)
    }

    block.permissions.push({
      ...item,
      display_name: parsed.permissionName || item.permission_name
    })
  })

  return Array.from(moduleMap.values())
}

const loadPermissions = async (preferredModuleCode?: string) => {
  loading.value = true
  try {
    const response = await permissionApi.getAllPermissions()
    modules.value = buildModules(extractList(response))

    const nextCode = preferredModuleCode && modules.value.some(item => item.code === preferredModuleCode)
      ? preferredModuleCode
      : modules.value[0]?.code || ''

    selectedModuleCode.value = nextCode
  } catch (error) {
    console.error('加载权限列表失败', error)
  } finally {
    loading.value = false
  }
}

const normalizeAsciiCode = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')

const closeDialogs = () => {
  showAddModuleDialog.value = false
  showAddPageDialog.value = false
  showAddPermissionDialog.value = false
  moduleForm.value.moduleNameCn = ''
  moduleForm.value.moduleNameEn = ''
  pageForm.value.pageNameCn = ''
  pageForm.value.pageNameEn = ''
  permissionForm.value.permissionNameCn = ''
  permissionForm.value.permissionNameEn = ''
  permissionTargetBlock.value = null
}

const openAddModuleDialog = () => {
  closeDialogs()
  showAddModuleDialog.value = true
}

const openAddPageDialog = () => {
  if (!selectedModule.value) {
    window.alert(t.selectModuleFirst)
    return
  }
  closeDialogs()
  showAddPageDialog.value = true
}

const openAddPermissionDialog = (block: PermissionBlock) => {
  closeDialogs()
  permissionTargetBlock.value = block
  showAddPermissionDialog.value = true
}

const createPermission = async (payload: PermissionPayload, preferredModuleCode?: string) => {
  submitting.value = true
  try {
    await permissionApi.createPermission(payload)
    await loadPermissions(preferredModuleCode)
    closeDialogs()
  } catch (error) {
    console.error('创建权限失败', error)
    window.alert('提交失败，请检查参数或后端返回信息')
  } finally {
    submitting.value = false
  }
}

const submitAddModule = async () => {
  const moduleName = moduleForm.value.moduleNameCn.trim()
  const moduleCode = normalizeAsciiCode(moduleForm.value.moduleNameEn)
  if (!moduleName || !moduleCode) return

  const payload: PermissionPayload = {
    permission_name: `${moduleName}-页面查看`,
    permission_code: `${moduleCode}-show`,
    description: `${moduleName}页面查看权限`,
    resource: moduleCode,
    action: 'show'
  }

  await createPermission(payload, moduleCode)
}

const submitAddPage = async () => {
  if (!selectedModule.value) return
  const pageName = pageForm.value.pageNameCn.trim()
  const pageCode = normalizeAsciiCode(pageForm.value.pageNameEn)
  if (!pageName || !pageCode) return
  const payload: PermissionPayload = {
    permission_name: `${selectedModule.value.name}-${pageName}-页面查看`,
    permission_code: `${selectedModule.value.code}-${pageCode}-show`,
    description: `${selectedModule.value.name}-${pageName}页面查看权限`,
    resource: `${selectedModule.value.code}-${pageCode}`,
    action: 'show'
  }

  await createPermission(payload, selectedModule.value.code)
}

const submitAddPermission = async () => {
  if (!selectedModule.value || !permissionTargetBlock.value) return

  const permissionName = permissionForm.value.permissionNameCn.trim()
  const actionCode = normalizeAsciiCode(permissionForm.value.permissionNameEn)
  if (!permissionName || !actionCode) return
  const isModuleBlock = permissionTargetBlock.value.type === 'module'

  const permissionCodePrefix = isModuleBlock
    ? `${selectedModule.value.code}-${actionCode}`
    : `${selectedModule.value.code}-${permissionTargetBlock.value.code}-${actionCode}`

  const permissionNameFull = isModuleBlock
    ? `${selectedModule.value.name}-${permissionName}`
    : `${selectedModule.value.name}-${permissionTargetBlock.value.name}-${permissionName}`

  const payload: PermissionPayload = {
    permission_name: permissionNameFull,
    permission_code: permissionCodePrefix,
    description: `${permissionNameFull}权限`,
    resource: isModuleBlock ? selectedModule.value.code : `${selectedModule.value.code}-${permissionTargetBlock.value.code}`,
    action: actionCode
  }

  await createPermission(payload, selectedModule.value.code)
}

const removePermission = async (permission: BlockPermission) => {
  if (!permission.id) return
  if (!window.confirm(`确认删除权限「${permission.display_name}」吗？`)) return

  submitting.value = true
  try {
    await permissionApi.deletePermission(permission.id)
    await loadPermissions(selectedModuleCode.value)
  } catch (error) {
    console.error('删除权限失败', error)
    window.alert('删除权限失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const removePageBlock = async (block: PermissionBlock) => {
  if (block.type !== 'page') return
  if (block.permissions.length === 0) {
    window.alert('该子页面下无权限可删除')
    return
  }
  if (!window.confirm(`确认删除子页面「${block.name}」及其全部权限吗？`)) return

  submitting.value = true
  try {
    const ids = block.permissions.map(item => item.id).filter(Boolean)
    const results = await Promise.allSettled(ids.map(id => permissionApi.deletePermission(id)))
    const failed = results.filter(item => item.status === 'rejected').length

    await loadPermissions(selectedModuleCode.value)

    if (failed > 0) {
      window.alert(`子页面删除部分失败，失败 ${failed} 条`)
    }
  } catch (error) {
    console.error('删除子页面失败', error)
    window.alert('删除子页面失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const removeModuleBlock = async (block: PermissionBlock) => {
  if (block.type !== 'module' || !selectedModule.value) return
  if (!window.confirm(`确认删除模块「${block.name}」及其全部权限吗？`)) return

  submitting.value = true
  try {
    const moduleBlocks = selectedModule.value.blocks
    const ids = moduleBlocks.flatMap(item => item.permissions.map(permission => permission.id)).filter(Boolean)
    if (ids.length === 0) {
      window.alert('该模块下无权限可删除')
      return
    }

    const results = await Promise.allSettled(ids.map(id => permissionApi.deletePermission(id)))
    const failed = results.filter(item => item.status === 'rejected').length

    await loadPermissions()

    if (failed > 0) {
      window.alert(`模块删除部分失败，失败 ${failed} 条`)
    }
  } catch (error) {
    console.error('删除模块失败', error)
    window.alert('删除模块失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadPermissions()
})
</script>

<style scoped>
@import './mission-common.css';

.mission-top-header-left {
  justify-content: flex-start !important;
}

.split-wrapper {
  padding: 14px;
}

.split-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  min-height: 0;
  flex: 1;
}

.split-panel {
  border: 1px solid rgba(62, 121, 150, 0.6);
  border-radius: 10px;
  background: rgba(16, 45, 72, 0.42);
  min-height: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.panel-title {
  color: #67d5fd;
  font-size: 17px;
  font-weight: 600;
}

.panel-actions {
  display: flex;
  gap: 10px;
}

.panel-btn {
  min-width: 96px;
}

.module-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.module-item {
  width: 100%;
  height: 42px;
  border: 1px solid rgba(42, 96, 132, 0.6);
  border-radius: 6px;
  background: rgba(9, 40, 66, 0.45);
  color: #d1ebff;
  margin-bottom: 8px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.module-item.active {
  border-color: rgba(103, 213, 253, 0.95);
  color: #67d5fd;
  background: rgba(12, 66, 102, 0.35);
}

.module-name {
  font-size: 13px;
}

.module-code {
  font-size: 12px;
  color: #8fb8cf;
}

.permission-cards {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.page-card {
  border: 1px solid rgba(54, 109, 144, 0.65);
  border-radius: 10px;
  background: rgba(13, 43, 71, 0.58);
  margin-bottom: 10px;
  padding: 10px 12px;
}

.page-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  row-gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px dashed rgba(68, 122, 156, 0.45);
}

.page-card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
}

.page-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.page-title {
  color: #e4f4ff;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-delete-icon-btn {
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.page-delete-icon-btn:hover {
  background: rgba(235, 62, 62, 0.18);
}

.page-delete-icon-btn img {
  width: 14px;
  height: 14px;
  display: block;
}

.page-count {
  color: #8fc3e6;
  font-size: 12px;
}

.checkbox-dot {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(225, 242, 255, 0.7);
  border-radius: 2px;
  background: rgba(245, 252, 255, 0.08);
  box-sizing: border-box;
  flex-shrink: 0;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 16px;
}

.permission-chip {
  min-height: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #d8eeff;
  font-size: 14px;
}

.permission-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-icon-btn {
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 2px;
  flex-shrink: 0;
  align-self: center;
  padding: 0;
  line-height: 1;
}

.delete-icon-btn:hover {
  background: rgba(235, 62, 62, 0.18);
}

.delete-icon-btn img {
  width: 14px;
  height: 14px;
  display: block;
}

.mini-btn {
  min-width: 90px;
  height: 30px;
  font-size: 12px;
  padding: 0 10px;
  line-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.perm-empty,
.empty-tip {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(210, 230, 245, 0.6);
  border: 1px dashed rgba(68, 122, 156, 0.45);
  border-radius: 8px;
}

.custom-dialog-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(5, 11, 22, 0.6);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.simple-dialog {
  width: 440px;
  background: linear-gradient(180deg, #102744 0%, #0d2038 100%);
  border: 1px solid rgba(54, 109, 144, 0.75);
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  padding: 16px;
}

.large-dialog {
  width: 680px;
}

.simple-dialog-title {
  color: #67d5fd;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.dialog-input {
  width: 100%;
}

.dialog-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.code-preview {
  color: #9dc8df;
  margin-top: 10px;
  font-size: 13px;
}

.simple-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

@media (max-width: 1500px) {
  .split-layout {
    grid-template-columns: 1fr;
  }

  .permission-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .page-title {
    font-size: 15px;
  }

  .permission-chip {
    font-size: 13px;
  }
}

@media (max-width: 1100px) {
  .panel-actions {
    flex-wrap: wrap;
  }

  .permission-grid,
  .dialog-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .simple-dialog,
  .large-dialog {
    width: min(92vw, 680px);
  }
}
</style>



