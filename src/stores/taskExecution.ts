import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useRobotStore } from './robot'

const MULTI_RUNNING_KEY = 'multi_task_running'

export const useTaskExecutionStore = defineStore('taskExecution', () => {
  const robotStore = useRobotStore()

  const initialMultiRunning =
    typeof window !== 'undefined' ? localStorage.getItem(MULTI_RUNNING_KEY) === '1' : false
  const multiTaskRunning = ref(initialMultiRunning)

  const persistMultiRunning = (running: boolean) => {
    multiTaskRunning.value = running
    if (typeof window !== 'undefined') {
      localStorage.setItem(MULTI_RUNNING_KEY, running ? '1' : '0')
    }
  }

  const isTrackTaskRunning = computed(() => robotStore.isTracking)
  const isPointTaskRunning = computed(() => robotStore.isPointTaskRunning)
  const isMultiTaskRunning = computed(() => multiTaskRunning.value)
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
  }
})
