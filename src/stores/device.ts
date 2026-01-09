import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Device, Robot } from '../types'

export const useDeviceStore = defineStore('device', () => {
  const devices = ref<Device[]>([])
  const selectedDockSn = ref<string>(localStorage.getItem('selected_dock_sn') || '')
  const robots = ref<Robot[]>([])
  const selectedRobotId = ref<string>(localStorage.getItem('selected_robot_id') || '')

  // 计算属性：机场列表
  const docks = computed(() => {
    return devices.value.filter(device => device.device_type_info?.device_type === 3)
  })

  // 计算属性：无人机列表
  const drones = computed(() => {
    return devices.value.filter(device => device.child_sn === '')
  })

  // 计算属性：选中的机场
  const selectedDock = computed(() => {
    return devices.value.find(device => device.device_sn === selectedDockSn.value)
  })

  // 计算属性：选中的机器人
  const selectedRobot = computed(() => {
    return robots.value.find(robot => robot.robot_id === selectedRobotId.value)
  })

  // 设置设备列表
  const setDevices = (deviceList: Device[]) => {
    devices.value = deviceList
  }

  // 设置机器人列表
  const setRobots = (robotList: Robot[]) => {
    robots.value = robotList
    // 更新缓存中的选中机器人信息
    if (selectedRobotId.value) {
      const robot = robotList.find(r => r.robot_id === selectedRobotId.value)
      if (robot) {
        localStorage.setItem('selected_robot_info', JSON.stringify(robot))
      }
    }
  }

  // 设置选中的机场
  const setSelectedDock = (dockSn: string) => {
    selectedDockSn.value = dockSn
    localStorage.setItem('selected_dock_sn', dockSn)
  }

  // 设置选中的机器人
  const setSelectedRobot = (robotId: string) => {
    selectedRobotId.value = robotId
    localStorage.setItem('selected_robot_id', robotId)
    const robot = robots.value.find(r => r.robot_id === robotId)
    if (robot) {
      localStorage.setItem('selected_robot_info', JSON.stringify(robot))
    }
  }

  // 从本地缓存恢复设备列表
  const hydrateFromCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem('cached_devices') || '[]')
      if (Array.isArray(cached) && cached.length > 0) {
        devices.value = cached as Device[]
      }
    } catch (_e) {
      // ignore
    }
  }

  // 根据SN获取设备
  const getDeviceBySn = (deviceSn: string) => {
    return devices.value.find(device => device.device_sn === deviceSn)
  }

  // 获取机场SN列表
  const getDockSns = () => {
    return docks.value.map(dock => dock.device_sn)
  }

  // 获取无人机SN列表
  const getDroneSns = () => {
    return drones.value.map(drone => drone.device_sn)
  }

  return {
    devices,
    robots,
    docks,
    drones,
    selectedDockSn,
    selectedRobotId,
    selectedDock,
    selectedRobot,
    setDevices,
    setRobots,
    setSelectedDock,
    setSelectedRobot,
    hydrateFromCache,
    getDeviceBySn,
    getDockSns,
    getDroneSns
  }
})