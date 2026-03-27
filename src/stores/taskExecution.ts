import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRobotStore } from './robot'
import { useDeviceStore } from './device'
import { getRobotMapCacheKeys } from '../utils/robotBootstrap'

const MULTI_RUNNING_KEY = 'multi_task_running'
const SELECTED_MAP_KEY = 'selected_map_name'

export const useTaskExecutionStore = defineStore('taskExecution', () => {
  const robotStore = useRobotStore()
  const deviceStore = useDeviceStore()

  const initialMultiRunning =
    typeof window !== 'undefined' ? localStorage.getItem(MULTI_RUNNING_KEY) === '1' : false
  const multiTaskRunning = ref(initialMultiRunning)

  const readSelectedMapName = (robotId?: string) => {
    if (typeof window === 'undefined') return ''
    const currentRobotId = robotId || deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
    if (currentRobotId) {
      const { selectedMapKey } = getRobotMapCacheKeys(currentRobotId)
      const robotScopedMap = localStorage.getItem(selectedMapKey)
      if (robotScopedMap) return robotScopedMap
    }
    return localStorage.getItem(SELECTED_MAP_KEY) || ''
  }

  const syncLegacySelectedMap = (name: string) => {
    if (typeof window === 'undefined') return
    if (name) {
      localStorage.setItem(SELECTED_MAP_KEY, name)
    } else {
      localStorage.removeItem(SELECTED_MAP_KEY)
    }
  }

  // ===== 全局选中地图（供首页、导航页、路线录制页共享） =====
  const selectedMapName = ref(typeof window !== 'undefined' ? readSelectedMapName() : '')

  const setSelectedMapName = (name: string) => {
    selectedMapName.value = name
    if (typeof window !== 'undefined') {
      const currentRobotId = deviceStore.selectedRobotId || localStorage.getItem('selected_robot_id') || ''
      if (currentRobotId) {
        const { selectedMapKey } = getRobotMapCacheKeys(currentRobotId)
        if (name) {
          localStorage.setItem(selectedMapKey, name)
        } else {
          localStorage.removeItem(selectedMapKey)
        }
      }
      syncLegacySelectedMap(name)
    }
  }

  /** 地图是否锁定（导航/INS/MSF 任一开启时不允许切换） */
  const isMapSelectionLocked = computed(() => {
    const cmd = robotStore.cmdStatus
    return cmd?.nav === 1 || cmd?.ins === 1 || cmd?.msf === 1
  })

  const persistMultiRunning = (running: boolean) => {
    multiTaskRunning.value = running
    if (typeof window !== 'undefined') {
      localStorage.setItem(MULTI_RUNNING_KEY, running ? '1' : '0')
    }
  }

  const isTrackTaskRunning = computed(() => robotStore.isTracking)
  const isPointTaskRunning = computed(() => robotStore.isPointTaskRunning)
  const isMultiTaskRunning = computed(() => robotStore.multitaskStatus?.status === true)
  const isNavigationEnabled = computed(() => robotStore.isNavigating)
  const navPaused = ref(false)

  const runningTaskType = computed<'track' | 'point' | 'multi' | null>(() => {
    if (isTrackTaskRunning.value) return 'track'
    if (isPointTaskRunning.value) return 'point'
    if (isMultiTaskRunning.value) return 'multi'
    return null
  })

  const isAnyTaskRunning = computed(() => runningTaskType.value !== null)

  const canStartTrackTask = computed(() => !isPointTaskRunning.value && !isMultiTaskRunning.value)
  const canStartPointTask = computed(() => !isTrackTaskRunning.value && !isMultiTaskRunning.value)
  const canStartMultiTask = computed(() => !isTrackTaskRunning.value && !isPointTaskRunning.value)

  const markMultiTaskStarted = () => {
    persistMultiRunning(true)
  }

  const markMultiTaskStopped = () => {
    persistMultiRunning(false)
  }

  const setNavPaused = (paused: boolean) => {
    navPaused.value = paused
  }

  // 循迹或发布点任务启动时，清理多任务组本地运行标记，避免跨页状态冲突
  watch([isTrackTaskRunning, isPointTaskRunning], ([trackRunning, pointRunning]) => {
    if ((trackRunning || pointRunning) && multiTaskRunning.value) {
      persistMultiRunning(false)
    }
  })

  watch(isNavigationEnabled, (enabled) => {
    if (!enabled) {
      navPaused.value = false
    }
  })

  watch(
    () => deviceStore.selectedRobotId,
    (robotId) => {
      const nextMap = readSelectedMapName(robotId)
      selectedMapName.value = nextMap
      syncLegacySelectedMap(nextMap)
    },
    { immediate: true }
  )

  return {
    isTrackTaskRunning,
    isPointTaskRunning,
    isMultiTaskRunning,
    isNavigationEnabled,
    navPaused,
    runningTaskType,
    isAnyTaskRunning,
    canStartTrackTask,
    canStartPointTask,
    canStartMultiTask,
    markMultiTaskStarted,
    markMultiTaskStopped,
    setNavPaused,
    selectedMapName,
    setSelectedMapName,
    isMapSelectionLocked,
  }
})
