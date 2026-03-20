import { apiClient, API_BASE_URL, type ApiResponse, type PaginatedResponse } from './config'
import type { User, Dock, Drone, Mission, MissionRecord, Alert, Role, Device, HmsAlert, VisionAlert, VisionAlertsResponse, Permission, Robot, RobotsResponse } from '../types'
import { getCurrentConfig } from '../config/environment'

// 前端接口服务定义
export const authApi = {
  login: (username: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    return fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    }).then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          console.error('Login error:', response.status, errorData)
          throw new Error(`HTTP error! status: ${response.status}`)
        })
      }
      return response.json()
    })
  },

  logout: () => {
    return apiClient.post<ApiResponse>('/auth/logout')
  },

  getCurrentUser: () => {
    return apiClient.get<ApiResponse<User>>('/auth/me')
  },

  refreshToken: () => {
    return apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh')
  }
}

export const userApi = {
  getUsers: (params?: { skip?: number; limit?: number; search?: string }) => {
    return apiClient.get<User[]>('/users/', params)
  },

  getUser: (id: string | number) => {
    return apiClient.get<User>(`/users/${id}`)
  },

  // 获取指定用户可用机器人列表
  getUserRobots: (userId: string | number) => {
    return apiClient.get<Robot[]>(`/users/${userId}/robots`)
  },

  createUser: (userData: { username: string; email?: string; full_name?: string; password: string }) => {
    return apiClient.post<User>('/auth/register', userData)
  },

  updateUser: (id: string | number, userData: { username?: string; email?: string; full_name?: string; password?: string; is_active?: boolean }) => {
    return apiClient.patch<User>(`/users/${id}`, userData)
  },

  deleteUser: (id: string | number) => {
    return apiClient.delete(`/users/${id}`)
  },

  assignRole: (userId: number, roleId: number) => {
    return apiClient.post(`/users/${userId}/roles/${roleId}`)
  },

  removeRole: (userId: number, roleId: number) => {
    return apiClient.delete(`/users/${userId}/roles/${roleId}`)
  },

  syncUserRole: (userId: number, roleIds: number[]) => {
    return apiClient.post(`/users/${userId}/roles`, { role_ids: roleIds })
  },

  // 批量同步用户机器人
  syncUserRobots: (userId: number, robotIds: number[]) => {
    return apiClient.post(`/users/${userId}/robots`, { robot_ids: robotIds })
  }
}

export const remoteDebugApi = {
  execute: (workspaceId: string, deviceSn: string, method: string, params: any = {}) => {
    return apiClient.post(`/workspaces/${workspaceId}/remote-debug/${deviceSn}/execute`, {
      method,
      params
    })
  }
}

export const dockApi = {
  getDocks: (params?: { page?: number; pageSize?: number; status?: string }) => {
    return apiClient.get<ApiResponse<PaginatedResponse<Dock>>>('/docks', params)
  },

  getDock: (id: string) => {
    return apiClient.get<ApiResponse<Dock>>(`/docks/${id}`)
  },

  createDock: (dockData: Partial<Dock>) => {
    return apiClient.post<ApiResponse<Dock>>('/docks', dockData)
  },

  updateDock: (id: string, dockData: Partial<Dock>) => {
    return apiClient.put<ApiResponse<Dock>>(`/docks/${id}`, dockData)
  },
  deleteDock: (id: string) => {
    return apiClient.delete<ApiResponse>(`/docks/${id}`)
  }
}

export const droneApi = {
  getDrones: (params?: { page?: number; pageSize?: number; status?: string; dockId?: string }) => {
    return apiClient.get<ApiResponse<PaginatedResponse<Drone>>>('/drones', params)
  },

  getDrone: (id: string) => {
    return apiClient.get<ApiResponse<Drone>>(`/drones/${id}`)
  },

  createDrone: (droneData: Partial<Drone>) => {
    return apiClient.post<ApiResponse<Drone>>('/drones', droneData)
  },

  updateDrone: (id: string, droneData: Partial<Drone>) => {
    return apiClient.put<ApiResponse<Drone>>(`/drones/${id}`, droneData)
  },

  deleteDrone: (id: string) => {
    return apiClient.delete<ApiResponse>(`/drones/${id}`)
  },

  getDroneStatus: (id: string) => {
    return apiClient.get<ApiResponse<{ status: string; battery: number; location?: any }>>(`/drones/${id}/status`)
  },

  takeoff: (id: string) => {
    return apiClient.post<ApiResponse>(`/drones/${id}/takeoff`)
  },

  land: (id: string) => {
    return apiClient.post<ApiResponse>(`/drones/${id}/land`)
  },

  returnToHome: (id: string) => {
    return apiClient.post<ApiResponse>(`/drones/${id}/return-home`)
  }
}

export const missionApi = {
  getMissions: (params?: { page?: number; pageSize?: number; status?: string; droneId?: string }) => {
    return apiClient.get<ApiResponse<PaginatedResponse<Mission>>>('/missions', params)
  },

  getMission: (id: string) => {
    return apiClient.get<ApiResponse<Mission>>(`/missions/${id}`)
  },

  createMission: (missionData: Partial<Mission>) => {
    return apiClient.post<ApiResponse<Mission>>('/missions', missionData)
  },

  updateMission: (id: string, missionData: Partial<Mission>) => {
    return apiClient.put<ApiResponse<Mission>>(`/missions/${id}`, missionData)
  },

  deleteMission: (id: string) => {
    return apiClient.delete<ApiResponse>(`/missions/${id}`)
  },

  startMission: (id: string) => {
    return apiClient.post<ApiResponse>(`/missions/${id}/start`)
  },

  stopMission: (id: string) => {
    return apiClient.post<ApiResponse>(`/missions/${id}/stop`)
  },

  pauseMission: (id: string) => {
    return apiClient.post<ApiResponse>(`/missions/${id}/pause`)
  },

  resumeMission: (id: string) => {
    return apiClient.post<ApiResponse>(`/missions/${id}/resume`)
  }
}

export const missionRecordApi = {
  getMissionRecords: (params?: { page?: number; pageSize?: number; status?: string; startDate?: string; endDate?: string }) => {
    return apiClient.get<ApiResponse<PaginatedResponse<MissionRecord>>>('/mission-records', params)
  },

  getMissionRecord: (id: string) => {
    return apiClient.get<ApiResponse<MissionRecord>>(`/mission-records/${id}`)
  },

  deleteMissionRecord: (id: string) => {
    return apiClient.delete<ApiResponse>(`/mission-records/${id}`)
  }
}

export const alertApi = {
  getAlerts: (params?: { page?: number; pageSize?: number; status?: string; deviceType?: string }) => {
    return apiClient.get<ApiResponse<PaginatedResponse<Alert>>>('/alerts', params)
  },

  getAlert: (id: string) => {
    return apiClient.get<ApiResponse<Alert>>(`/alerts/${id}`)
  },

  markAsRead: (id: string) => {
    return apiClient.put<ApiResponse<Alert>>(`/alerts/${id}/read`)
  },

  markAllAsRead: () => {
    return apiClient.put<ApiResponse>('/alerts/read-all')
  },

  deleteAlert: (id: string) => {
    return apiClient.delete<ApiResponse>(`/alerts/${id}`)
  }
}

export const roleApi = {
  getRoles: (params?: { skip?: number; limit?: number; search?: string }) => {
    return apiClient.get<Role[]>('/roles/', params)
  },

  getRole: (id: string | number) => {
    return apiClient.get<Role>(`/roles/${id}`)
  },

  createRole: (roleData: { role_name: string; role_code: string; description: string }) => {
    return apiClient.post<Role>('/roles/', roleData)
  },

  updateRole: (id: string | number, roleData: { role_name: string; role_code: string; description: string }) => {
    return apiClient.patch<Role>(`/roles/${id}`, roleData)
  },

  deleteRole: (id: string | number) => {
    return apiClient.delete(`/roles/${id}`)
  },

  updateRolePermissions: (roleId: number, payload: { permission_ids: number[] }) => {
    return apiClient.post(`/roles/${roleId}/permissions`, payload)
  }
}

export const systemApi = {
  getSystemStatus: () => {
    return apiClient.get<ApiResponse<{
      totalDocks: number
      onlineDocks: number
      totalDrones: number
      onlineDrones: number
      activeMissions: number
      unreadAlerts: number
    }>>('/system/status')
  },

  getSystemHealth: () => {
    return apiClient.get<ApiResponse<{
      status: string
      uptime: number
      version: string
      lastCheck: string
    }>>('/system/health')
  }
}

export const deviceApi = {
  getDevices: (params?: { skip?: number; limit?: number; keyword?: string }) => {


    return apiClient.get<Device[]>('/devices/', params)
  },

  getDevice: (deviceSn: string) => {
    return apiClient.get<Device>(`/devices/${deviceSn}`)
  },

  updateDevice: (deviceSn: string, deviceData: Partial<Device>) => {
    return apiClient.put<Device>(`/devices/${deviceSn}`, deviceData)
  },

  deleteDevice: (deviceSn: string) => {
    return apiClient.delete(`/devices/${deviceSn}`)
  }
}

export const hmsApi = {
  getDeviceHms: (deviceSn: string) => {
    return apiClient.get<HmsAlert[]>(`/hms/devices/${deviceSn}/hms`)
  }
}

export const livestreamApi = {
  getCapacity: () => {
    return apiClient.get<{
      available_devices: Array<{
        sn: string
        available_video_number: number
        coexist_video_number_max: number
        camera_list: Array<{
          camera_index: string
          available_video_number: number
          coexist_video_number_max: number
          video_list: Array<{
            video_index: string
            video_type: string
            switchable_video_types: string[]
          }>
        }>
      }>
      total_devices: number
      total_cameras: number
      total_videos: number
    }>('/livestream/capacity')
  },

  startLivestream: (deviceSn: string, data: {
    video_id: string
  }) => {
    return apiClient.post<{
      message: string
      bid: string
      push_url: string
      play_urls: {
        rtmp: string
        http_flv: string
        hls: string
      }
      protocol: string
    }>(`/livestream/devices/${deviceSn}/livestream/start`, data)
  },

  changeLens: (deviceSn: string, data: {
    video_id: string
    video_type: string
  }) => {
    return apiClient.post<{
      message: string
      bid: string
    }>(`/livestream/devices/${deviceSn}/livestream/lens-change`, data)
  },

  setQuality: (deviceSn: string, data: {
    video_id: string
    video_quality: number
  }) => {
    return apiClient.post<{
      message: string
      bid: string
    }>(`/livestream/devices/${deviceSn}/livestream/set-quality`, data)
  },

  setScreenSplit: (deviceSn: string, data: {
    payload_index: string
    enable: boolean
  }) => {
    return apiClient.post<{
      message: string
      code: number
    }>(`/control/devices/${deviceSn}/camera/screen-split`, data)
  }
}

export const permissionApi = {
  // ??????
  getAllPermissions: () => {
    return apiClient.get<Permission[]>('/permissions/')
  },
  // ????
  createPermission: (permissionData: {
    permission_name: string
    permission_code: string
    description: string
    resource: string
    action: string
  }) => {
    return apiClient.post<Permission>('/permissions/', permissionData)
  },
  // ????
  deletePermission: (permissionId: string | number) => {
    return apiClient.delete(`/permissions/${permissionId}`)
  },
  // ??????
  getUserPermissions: (userId: number) => {
    return apiClient.get<string[]>(`/users/${userId}/permissions/`)
  }
}
export const drcApi = {
  checkDrcReady: (deviceSn: string) => {
    return apiClient.get<{
      code: number
      message: string
      data: {
        ready: boolean
        reason?: string
      }
    }>(`/drc/devices/${deviceSn}/drc/ready`)
  },

  getDrcStatus: (deviceSn: string) => {
    return apiClient.get<{
      code: number
      message: string
      data: {
        drc_mode: 'active' | 'inactive'
        session: string | null
      }
    }>(`/drc/devices/${deviceSn}/drc/status`)
  },

  enterDrcMode: (deviceSn: string) => {
    return apiClient.post<{
      message: string
      code: number
    }>(`/drc/devices/${deviceSn}/drc/enter`, {
      osd_frequency: 10,
      hsi_frequency: 4
    })
  },

  exitDrcMode: (deviceSn: string) => {
    return apiClient.post<{
      message: string
      code: number
    }>(`/drc/devices/${deviceSn}/drc/exit`)
  },

  simpleControl: (deviceSn: string, control: {
    forward?: number
    right?: number
    up?: number
    turn_right?: number
  }) => {
    return apiClient.post<{
      message: string
      code: number
    }>(`/drc/devices/${deviceSn}/drc/control/simple`, {
      forward: control.forward || 0,
      right: control.right || 0,
      up: control.up || 0,
      turn_right: control.turn_right || 0
    })
  }
}

export const waylineApi = {
  getJobs: (workspaceId: string, params?: {
    page?: number;
    page_size?: number;
    status?: number;
    task_type?: number;
    wayline_type?: number;
    file_id?: string;
  }) => {
    return apiClient.get<{
      code: number
      message: string
      data: {
        data: Array<{
          job_id: string
          name: string
          file_id: string
          file_name: string
          dock_sn: string
          dock_name: string
          workspace_id: string
          task_type: number
          wayline_type: number
          status: number
          progress: number | null
          out_of_control_action: number
          rth_altitude: number
          media_count: number
          uploaded_count: number
          username: string
          begin_time: string
          end_time: string | null
          execute_time: string | null
          completed_time: string | null
          error_code: string | null
          create_time: string
          update_time: string
          uploading: boolean
        }>
        pagination: {
          page: number
          page_size: number
          total: number
          pages: number
        }
      }
    }>(`/wayline/workspaces/${workspaceId}/jobs`, params)
  },

  getWaylineFiles: (workspaceId: string, params?: {
    page?: number
    page_size?: number
    name?: string
  }) => {
    return apiClient.get<{
      code: number
      message: string
      data: {
        data: Array<{
          wayline_id: string
          name: string
          object_key: string
          sign: string
          drone_model_key: string
          payload_model_keys: string
          template_types: string
          favorited: boolean
          create_time: string
          update_time: string
          waypoint_count: number
          action_count: number
          action_types: string[]
          height_range: {
            min: number
            max: number
          }
        }>
        pagination: {
          total: number
          page: number
          page_size: number
        }
      }
    }>(`/wayline/workspaces/${workspaceId}/files`, params)
  },

  getWaylineDetail: (workspaceId: string, waylineId: string) => {
    return apiClient.get<{
      code: number
      message: string
      data: {
        wayline_id: string
        name: string
        object_key: string
        sign: string
        drone_model_key: string
        payload_model_keys: string
        template_types: string
        favorited: boolean
        create_time: string
        update_time: string
        mission_config: {
          flyToWaylineMode: string
          finishAction: string
          exitOnRCLost: string
          executeRCLostAction: string
          takeOffSecurityHeight: string
          globalTransitionalSpeed: string
          globalRTHHeight: string
          droneInfo: any
          payloadInfo: any
        }
        waylines: Array<{
          templateId: string
          waylineId: string
          executeHeightMode: string
          autoFlightSpeed: string
          waypointCount: number
          waypoints: Array<{
            index: number
            coordinates: [number, number]
            executeHeight: number
            waypointSpeed: number
            headingParam: {
              mode: string
              angle: string
              pathMode: string
            }
            turnParam: {
              mode: string
              dampingDist: string
            }
            actions: Array<{
              actionId: string
              type: string
              typeName: string
              params: any
              trigger: {
                type: string
                param: string
              }
              groupInfo: {
                actionGroupId: string
                startIndex: string
                endIndex: string
                mode: string
              }
            }>
          }>
        }>
        summary: {
          totalWaypoints: number
          totalActions: number
          actionTypes: string[]
          waypointRange: {
            minHeight: number
            maxHeight: number
          }
          speedRange: {
            min: number
            max: number
          }
        }
      }
    }>(`/wayline/workspaces/${workspaceId}/files/${waylineId}`)
  },

  deleteWaylineFile: (workspaceId: string, waylineId: string) => {
    return apiClient.delete<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/files/${waylineId}`)
  },

  createJob: (workspaceId: string, data: {
    name: string
    dock_sn: string
    file_id: string
    task_type: number
    out_of_control_action: number
    rth_altitude: number
    rth_mode: number
    exit_wayline_when_rc_lost: number
    wayline_precision_type: number
    begin_time?: string | null
    end_time?: string | null
    execute_time?: string
    enable_vision?: boolean
    vision_algorithms?: number[]
    vision_threshold?: number
    recurrence_config?: {
      recurrence_type: string // e.g. 'date_range'
      start_date: string      // YYYY-MM-DD
      end_date: string        // YYYY-MM-DD
    }
  }) => {
    return apiClient.post<{
      code: number
      message: string
      data: {
        job_id: string
        name: string
        file_id: string
        file_name: string
        dock_sn: string
        dock_name: string
        workspace_id: string
        task_type: number
        wayline_type: number
        status: number
        progress: number
        out_of_control_action: number
        rth_altitude: number
        media_count: number
        uploaded_count: number
        username: string
        begin_time: string
        end_time: string
        execute_time: string
        completed_time: string
        error_code: number
        create_time: string
        update_time: string
        uploading: boolean
      }
    }>(`/wayline/workspaces/${workspaceId}/flight-tasks`, data)
  },

  getWaylineProgress: (workspaceId: string, dockSn: string) => {
    return apiClient.get<{
      code: number
      message: string
      data: {
        dock_sn: string
        job_id: string
        status: string
        progress: {
          current_step: number
          percent: number
          current_waypoint_index: number
          total_waypoints: number
        }
        ext: {
          current_waypoint_index: number
          media_count: number
          flight_id: string
          track_id: string
          wayline_mission_state: number
          wayline_id: number
        }
        timestamp: number
        result: number
      }
    }>(`/wayline/workspaces/${workspaceId}/docks/${dockSn}/progress`)
  },

  getWaylineJobDetail: (workspaceId: string, jobId: string) => {
    return apiClient.get<{
      code: number
      message: string
      data: {
        job_id: string
        name: string
        file_id: string
        file_name: string
        dock_sn: string
        dock_name: string
        workspace_id: string
        task_type: number
        wayline_type: number
        status: number
        progress: any
        out_of_control_action: number
        rth_altitude: number
        media_count: number
        uploaded_count: number
        username: string
        begin_time: string
        end_time: string | null
        execute_time: string | null
        completed_time: string | null
        error_code: string | null
        create_time: string
        update_time: string
        uploading: boolean
      }
    }>(`/wayline/workspaces/${workspaceId}/jobs/${jobId}`)
  },

  deleteJob: (workspaceId: string, jobId: string) => {
    return apiClient.delete<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/jobs/${jobId}`)
  },

  cancelReturnHome: (workspaceId: string, dockSn: string) => {
    return apiClient.post<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/docks/${dockSn}/cancel-return-home`)
  },

  stopJob: (workspaceId: string, jobId: string) => {
    return apiClient.post<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/jobs/${jobId}/stop`)
  },

  pauseJob: (workspaceId: string, jobId: string) => {
    return apiClient.post<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/jobs/${jobId}/pause`)
  },

  resumeJob: (workspaceId: string, jobId: string) => {
    return apiClient.post<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/jobs/${jobId}/resume`)
  },

  executeJob: (workspaceId: string, jobId: string, algorithmData?: {
    enable_vision?: boolean
    vision_algorithms?: number[]
    vision_threshold?: number
  }) => {
    return apiClient.post<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/jobs/${jobId}/execute`, algorithmData)
  },

  getFlightStatistics: (workspaceId: string, days?: number) => {
    return apiClient.get<{
      code: number
      message: string
      data: {
        summary: {
          total_tasks: number
          completed_tasks: number
          failed_tasks: number
          canceled_tasks: number
          in_progress_tasks: number
          total_flight_time: number
          total_distance: number
          total_media_count: number
        }
        daily_stats: Array<{
          date: string
          total_tasks: number
          completed_tasks: number
          failed_tasks: number
          canceled_tasks: number
          in_progress_tasks: number
          total_flight_time: number
          total_distance: number
          total_media_count: number
        }>
        status_stats: Array<{
          status: number
          status_name: string
          count: number
          percentage: number
        }>
        date_range: {
          start_date: string
          end_date: string
        }
      }
    }>(`/wayline/workspaces/${workspaceId}/reports/flight-statistics`, days ? { days } : {})
  }
}

export const mediaApi = {
  getMediaFiles: (params?: {
    job_id?: string
    page?: number
    page_size?: number
  }) => {
    return apiClient.get<{
      items: Array<{
        file_id: string
        file_name: string
        workspace_id: string
        drone_sn: string
        job_id: string
        is_original: boolean
        create_time: number
        thumbnail: string | null
      }>
      total: number
      page: number
      page_size: number
      has_more: boolean
    }>('/media/files', params)
  },

  downloadMediaFile: (fileId: string) => {
    return apiClient.get(`/media/download/${fileId}`, {}, {
      responseType: 'blob'
    } as any)
  }
}

export const visionApi = {
  getAlerts: (workspaceId: string, params?: {
    device_sn?: string
    job_id?: string
    alert_level?: string
    status?: string
    limit?: number
    offset?: number
  }) => {
    return apiClient.get<VisionAlertsResponse>(`/workspaces/${workspaceId}/vision/alerts`, params)
  },

  getAlert: (workspaceId: string, alertId: string) => {
    return apiClient.get<VisionAlert>(`/workspaces/${workspaceId}/vision/alerts/${alertId}`)
  },

  handleAlert: (workspaceId: string, alertId: string, data: {
    status: 'HANDLED' | 'IGNORED'
    handle_note?: string
  }) => {
    return apiClient.put<VisionAlert>(`/workspaces/${workspaceId}/vision/alerts/${alertId}`, data)
  },

  updateAlertStatus: (workspaceId: string, alertId: string, data: {
    status: 'HANDLED' | 'IGNORED'
    handle_note?: string
  }) => {
    return apiClient.put<VisionAlert>(`/workspaces/${workspaceId}/vision/alerts/${alertId}/status`, data)
  }
}

export const robotApi = {
  getRobots: (params?: { skip?: number; limit?: number }) => {
    return apiClient.get<RobotsResponse>('/robots', params)
  },
  getRobotDetail: (robotId: string) => {
    return apiClient.get<Robot>(`/robots/${encodeURIComponent(robotId)}`)
  }
}

export const dogApi = {
  sendCommand: (robotId: string, data: { command_name: string }) => {
    return apiClient.post(`/dog/${robotId}/dog_command`, data)
  }
}

export const navigationApi = {
  getMapList: (robotId: string, signal?: AbortSignal) => {
    return apiClient.get<{ msg: { error_code: number; error_msg: string; result: string[] }; request_id: string }>(`/navigation/${robotId}/map_list`, undefined, { signal })
  },
  deleteMap: (robotId: string, mapName: string) => {
    return apiClient.delete(`/navigation/${robotId}/map/${mapName}`)
  },
  controlNavigation: (robotId: string, data: { action: number; map_name: string }) => {
    return apiClient.post(`/navigation/${robotId}/ctrl_nav`, data)
  },
  getTrackList: (robotId: string, signal?: AbortSignal) => {
    return apiClient.get<{ msg: { error_code: number; error_msg: string; result: string[] }; request_id: string }>(`/navigation/${robotId}/track_list`, undefined, { signal })
  },
  getTaskpointList: (robotId: string, trackName: string, signal?: AbortSignal) => {
    return apiClient.get<{ msg: { error_code: number; error_msg: string; result: string[] }; request_id: string }>(`/navigation/${robotId}/taskpoint_list`, { track_name: trackName }, { signal })
  },
  getAllTrackTaskList: (robotId: string, signal?: AbortSignal) => {
    return apiClient.get<{
      data: Array<{
        createtime: string;
        no_switch: string;
        preset?: string;
        remark?: string;
        task_id: string;
        theta: string;
        time: string;
        track_name: string;
        track_point_name: string;
        type: string;
        type_text: string;
        x: string;
        y: string;
        z?: string;
        cam_key?: string;
        extra?: string;
        gait?: string;
        ground?: string;
        nostop?: string;
        presetID?: string;
        type_id?: string;
      }>;
      request_id: string;
    }>(`/tracks/${robotId}/alltask_list`, undefined, { signal })
  },
  getPointTaskList: (robotId: string, signal?: AbortSignal) => {
    return apiClient.get<{ data: { isStart: boolean; task_id: string; task_name: string; taskcontent: any[] }[]; request_id: string }>(`/taskpoints/${robotId}/task_list`, undefined, { signal })
  },
  updatePointTaskList: (robotId: string, data: { data: { task_id: string; task_name: string; taskcontent: any[] }[] }) => {
    return apiClient.post<{ 
      message: string; 
      response: { 
        data: { isStart: boolean; task_id: string; task_name: string; taskcontent: any[] }[]; 
        request_id: string 
      } 
    }>(`/taskpoints/${robotId}/task_list`, data)
  },
  startPointTask: (robotId: string, data: {
    id: string;
    sn: string;
  }) => {
    return apiClient.post(`/taskpoints/${robotId}/start_task`, data)
  },
  stopPointTask: (robotId: string, data: {
    id: string;
    sn: string;
  }) => {
    return apiClient.post(`/taskpoints/${robotId}/stop_task`, data)
  },
  getMultiTaskList: (robotId: string, signal?: AbortSignal) => {
    return apiClient.get<{ msg: { multitask_id: string; multitask_name: string; multitask_list: any[] }[]; request_id: string }>(`/multitasks/${robotId}/multitask_list`, undefined, { signal })
  },
  getTaskTypeList: (robotId: string) => {
    return apiClient.get<{
      data: Array<{
        type: string;
        type_text: string;
        iType: number;
        single: boolean;
        cn_name: string;
      }>;
      request_id: string;
    }>(`/taskpoints/${robotId}/task_type_list`)
  },
  startTrack: (robotId: string, data: {
    action: number;
    wait: number;
    obs_mode: number;
    track_name: string;
    taskpoint_name: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/start_track`, data)
  },
  cancelTrack: (robotId: string, data: {
    action: number;
    wait: number;
    obs_mode: number;
    track_name: string;
    taskpoint_name: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/start_track`, data)
  },
  addTrackPoint: (robotId: string, data: any) => {
    return apiClient.post(`/tracks/${robotId}/add_track_point`, data)
  },
  updateTaskPoint: (robotId: string, data: any) => {
    return apiClient.put(`/tracks/${robotId}/update_taskpoint`, data)
  },
  deleteTrackPoint: (robotId: string, data: any) => {
    return apiClient.delete(`/tracks/${robotId}/delete_track_point`, data)
  },
  deleteTaskpointFile: (robotId: string, data: { action: number; track_name: string; taskpoint_name: string }) => {
    return apiClient.post(`/navigation/${robotId}/delete_taskpoint_file`, data)
  },
  updateTrackTaskList: (robotId: string, trackName: string, taskPointName: string, data: { data: any[] }) => {
    return apiClient.post<{
      message: string;
      response: {
        data: any[];
        request_id: string;
      }
    }>(`/tracks/${robotId}/task_list`, { track_name: trackName, track_point_name: taskPointName, ...data })
  },
  msfControl: (robotId: string, data: {
    action: number;
    mode: number;
    session: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/msf_control`, data)
  },
  dataRecord: (robotId: string, data: {
    action: number;
    data_name: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/data_record`, data)
  },
  slam: (robotId: string, data: {
    action: number;
    data_name: string;
    map_name: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/slam`, data)
  },
  changePcd: (robotId: string, data: {
    action: number;
    map_name: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/change_pcd`, data)
  },
  createMsfData: (robotId: string, data: {
    session: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/create_msf_data`, data)
  },
  insControl: (robotId: string, data: {
    action: number;
  }) => {
    return apiClient.post(`/navigation/${robotId}/ins_control`, data)
  },
  initINS: (robotId: string, data: {
    action: number;
  }) => {
    return apiClient.post(`/speed/${robotId}/nav_stop`, data)
  },
  startMultiTaskGroup: (robotId: string, data: {
    multitask_name: string;
    multitask_id: string;
    middle_start: number;
    action: number;
  }) => {
    return apiClient.post(`/multitasks/${robotId}/start_multitask_group`, data)
  },
  cancelMultiTaskGroup: (robotId: string) => {
    return apiClient.post(`/multitasks/${robotId}/cancel_multitask_group`, {})
  },
  createMultiTaskGroup: (robotId: string, data: { multitask_name: string }) => {
    return apiClient.post(`/multitasks/${robotId}/multitask_group`, data)
  },
  deleteMultiTaskGroup: (robotId: string, data: { multitask_id: string }) => {
    return apiClient.delete(`/multitasks/${robotId}/multitask_group`, data)
  },
  addTaskToMultiTaskGroup: (robotId: string, data: {
    multitask_id: string;
    task_data: {
      map_name: string;
      task_name: string;
      task_pointname: string;
      task_type: string;
      circle: number;
      task_id: string;
      obs_mode: string;
      is_origin_publish: number;
      start_mode: string;
      gait: string;
      ground: string;
    };
  }) => {
    return apiClient.post(`/multitasks/${robotId}/multitask`, data)
  },
  updateTaskInMultiTaskGroup: (robotId: string, data: {
    multitask_id: string;
    task_data: {
      map_name: string;
      task_name: string;
      task_pointname: string;
      task_type: string;
      circle: number;
      task_id: string;
      obs_mode: string;
      is_origin_publish: number;
      start_mode: string;
      gait: string;
      ground: string;
    };
  }) => {
    return apiClient.put(`/multitasks/${robotId}/multitask`, data)
  },
  deleteTaskFromMultiTaskGroup: (robotId: string, data: {
    multitask_id: string;
    child_id: string;
  }) => {
    return apiClient.delete(`/multitasks/${robotId}/multitask`, data)
  },
  swapTaskOrder: (robotId: string, data: {
    multitask_id: string;
    child_id: string;
    order: string;
  }) => {
    return apiClient.post(`/multitasks/${robotId}/order_swap`, data)
  },
  getScheduledTasks: (robotId: string, params?: {
    track_name?: string;
    track_point_name?: string;
  }) => {
    return apiClient.get<{
      data: Array<{
        id: string;
        sn: string;
        start_time: string;
        status: number;
        track_name: string;
        track_point_name: string;
      }>;
      request_id: string;
    }>(`/scheduled/${robotId}/scheduled_tasks`, params || {})
  },
  createScheduledTask: (robotId: string, data: {
    track_name: string;
    track_point_name: string;
    start_time: string;
  }) => {
    return apiClient.post<{
      message: string;
      track_name: string;
      track_point_name: string;
      response: {
        msg: {
          error_code: number;
          error_msg: string;
          result: Array<{
            id: string;
            sn?: string;
            start_time: string;
            status: number;
            track_name: string;
            track_point_name: string;
          }>;
        };
        request_id: string;
      };
    }>(`/scheduled/${robotId}/scheduled_tasks`, data)
  },
  deleteScheduledTask: (robotId: string, taskId: string) => {
    return apiClient.delete(`/scheduled/${robotId}/scheduled_tasks`, {
      id: taskId
    })
  },
  createTaskpointFile: (robotId: string, data: {
    track_name: string;
    keypoint_name: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/create_taskpoint_file`, data)
  },
  setObsHandle: (robotId: string, data: {
    action: number;
  }) => {
    return apiClient.post(`/navigation/${robotId}/set_obs_handle`, data)
  },
  useGps: (robotId: string, data: {
    action: number;
  }) => {
    return apiClient.post(`/navigation/${robotId}/use_gps`, data)
  },
  getGpsStatus: (robotId: string) => {
    return apiClient.get<{ msg: { error_code: number; error_msg: string; result: number }; request_id: string }>(`/navigation/${robotId}/use_gps`)
  },
  getDataList: (robotId: string) => {
    return apiClient.get<{ msg: { error_code: number; error_msg: string; result: string[] }; request_id: string }>(`/navigation/${robotId}/data_list`)
  },
  deleteDataPackage: (robotId: string, dataName: string) => {
    return apiClient.delete(`/navigation/${robotId}/data/${dataName}`)
  },
  getNavigationList: (robotId: string, mapName: string, path?: string, robotIp?: string) => {
    const params: Record<string, any> = { map_name: mapName }
    if (path) params.path = path
    if (robotIp) params.robot_ip = robotIp
    return apiClient.get<{ code: number; msg: string; data: any[] }>('/navigation_list', params, {
      baseURL: ''
    })
  },
  deleteNavigationData: (data: {
    map_name: string;
    type: string;
    pwd?: string;
    is_file?: number;
    path?: string;
    robot_ip?: string;
  }) => {
    const { robot_ip, ...bodyData } = data
    const qs = robot_ip ? `?robot_ip=${encodeURIComponent(robot_ip)}` : ''

    const params = new URLSearchParams()
    Object.entries(bodyData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    return apiClient.post<{ code: number; msg: string }>(`/navigation_delete${qs}`, params.toString(), {
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      baseURL: ''
    })
  },
  trackRecord: (robotId: string, data: { action: number; track_name: string }) => {
    return apiClient.post(`/navigation/${robotId}/track_record`, data)
  },
  deleteTrack: (robotId: string, data: { track_name: string }) => {
    return apiClient.post(`/navigation/${robotId}/delete_track`, data)
  },
  trajectorySmooth: (robotId: string, data: { track_name: string }) => {
    return apiClient.post(`/navigation/${robotId}/trajectory_smooth`, data)
  },
  oneKeyRecharge: (robotId: string, data: { sn: string; action: number; chargeIndex: string }) => {
    return apiClient.post(`/charging/${robotId}/one_key_recharge`, data)
  },
  pauseNavigation: (robotId: string, data: any = {}) => {
    return apiClient.post(`/navigation/${robotId}/nav_pause`, data)
  },
  getPresets: (robotId: string, deviceName: string) => {
    return apiClient.get<{ list: { id: string | number; presetName: string }[]; code: number }>(`/ptz/${robotId}/presets`, { device_name: deviceName })
  }
}



export interface CameraInfo {
  CamName: string
  CamKey: string
  CamType: string
  PtzName: string
  PtzType: string
  Ip: string
  UserName: string
  PassWord: string
  MainUrl: string
  SubUrl: string
}

export const cameraApi = {
  getCameraList: (robotId: string, signal?: AbortSignal) => {
    return apiClient.get<{ data: CameraInfo[]; request_id: string }>(`/cameras/${robotId}/list`, undefined, { signal })
  },
  startCameraStream: (robotId: string, camKey: string, useSubStream = false, signal?: AbortSignal) => {
    return apiClient.post<{ message: string; cam_key: string; stream_url: string; rtmp_push_url: string }>(
      `/cameras/${robotId}/stream/start`,
      { cam_key: camKey, use_sub_stream: useSubStream },
      { signal }
    )
  },
  stopCameraStream: (robotId: string, camKey: string) => {
    return apiClient.post<{ message: string }>(
      `/cameras/${robotId}/stream/stop`,
      { cam_key: camKey }
    )
  }
}

const MAP_DOWNLOAD_LOG_TTL_MS = 5000
const recentMapDownloadLogs = new Map<string, number>()

const logMapDownloadOnce = (key: string, message: string, error?: unknown) => {
  if (recentMapDownloadLogs.has(key)) return

  recentMapDownloadLogs.set(key, Date.now())
  window.setTimeout(() => {
    recentMapDownloadLogs.delete(key)
  }, MAP_DOWNLOAD_LOG_TTL_MS)

  if (error) {
    console.error(message, error)
    return
  }

  console.error(message)
}

export const mapFileApi = {
  MAP_FILES: ['tinyMap.pcd', 'gridMap.pgm', 'gridMap.yaml', 'gnss_origin.txt'],

  downloadMapFile: async (
    robotIp: string,
    mapName: string,
    fileName: string,
    suppressErrorLog = false
  ): Promise<Blob | null> => {
    const url = `/download_file?remote_path=/root/dxr_data/map/${mapName}/${fileName}&robot_ip=${robotIp}`

    try {
      const response = await fetch(url, {
        method: 'GET'
      })

      if (!response.ok) {
        if (!suppressErrorLog) {
          logMapDownloadOnce(
            `${robotIp}:${mapName}:${fileName}:status:${response.status}`,
            `[地图下载] 文件下载失败: ${mapName}/${fileName}，HTTP ${response.status}`
          )
        }
        return null
      }

      const blob = await response.blob()

      if (blob.type.includes('text/html')) {
        if (!suppressErrorLog) {
          logMapDownloadOnce(
            `${robotIp}:${mapName}:${fileName}:html`,
            `[地图下载] 文件返回了 HTML 内容: ${mapName}/${fileName}`
          )
        }
        return null
      }

      return blob
    } catch (error) {
      if (!suppressErrorLog) {
        logMapDownloadOnce(
          `${robotIp}:${mapName}:${fileName}:catch`,
          `[地图下载] 请求异常: ${mapName}/${fileName}`,
          error
        )
      }
      return null
    }
  },

  downloadAllMapFiles: async (robotIp: string, mapName: string): Promise<Map<string, Blob>> => {
    const results = new Map<string, Blob>()
    const failedFiles: string[] = []

    for (const fileName of mapFileApi.MAP_FILES) {
      const blob = await mapFileApi.downloadMapFile(robotIp, mapName, fileName, true)
      if (blob) {
        results.set(fileName, blob)
      } else {
        failedFiles.push(fileName)
      }
    }

    if (failedFiles.length > 0) {
      logMapDownloadOnce(
        `${robotIp}:${mapName}:batch:${failedFiles.join(',')}`,
        `[地图下载] 地图 ${mapName} 有 ${failedFiles.length} 个文件下载失败: ${failedFiles.join(', ')}`
      )
    }

    return results
  },

  uploadMapFile: async (robotIp: string, mapName: string, fileName: string, file: Blob): Promise<boolean> => {
    const remotePath = `/root/dxr_data/map/${mapName}`
    const url = `/upload_single_file?robot_ip=${robotIp}`

    const formData = new FormData()
    formData.append('file', file, fileName)
    formData.append('remote_path', remotePath)

    console.log('[轨迹上传] 开始上传文件:', {
      url,
      remotePath,
      fileName,
      fileSize: file.size
    })

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        console.error(`[轨迹上传] 地图文件上传失败: ${fileName}, HTTP ${response.status}`)
        const responseText = await response.text()
        console.error('[轨迹上传] 服务端响应内容:', responseText)
        return false
      }
      console.log('trajectory upload success')
      return true
    } catch (error) {
      console.error(`[轨迹上传] 地图文件上传异常: ${fileName}`, error)
      return false
    }
  },

  downloadTrajectoryFile: async (trajectoryName: string, robotIp: string): Promise<Blob | null> => {
    const url = `/download_file?remote_path=/root/dxr_data/trajectory/${trajectoryName}/${trajectoryName}.txt&robot_ip=${robotIp}`
    try {
      const response = await fetch(url, { method: 'GET' })
      if (!response.ok) {
        console.error(`[轨迹下载] 轨迹文件下载失败: ${trajectoryName}, HTTP ${response.status}`)
        return null
      }
      return await response.blob()
    } catch (error) {
      console.error(`[轨迹下载] 轨迹文件下载异常: ${trajectoryName}`, error)
      return null
    }
  }

}


