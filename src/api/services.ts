import { apiClient, API_BASE_URL, type ApiResponse, type PaginatedResponse } from './config'
import type { User, Dock, Drone, Mission, MissionRecord, Alert, Role, Device, HmsAlert, VisionAlert, VisionAlertsResponse, Permission, Robot, RobotsResponse } from '../types'
import { getCurrentConfig } from '../config/environment'

// 闁荤姳闄嶉崐娑㈡儊婢舵劖鍎庣紒瀣仢瑜扮娀鏌熼幁鎺戝姎鐟?
export const authApi = {
  // 闂佹椿娼块崝宥夊春濞戙垺鍎岄悹鍥皺缁?- 闂備緡鍋勯崐鍧楀储閵堝瑙﹂幖杈剧秵娴间精PI
  login: (username: string, password: string) => {
    console.log('Login attempt:', { username, password })

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
      console.log('Login response status:', response.status)
      if (!response.ok) {
        return response.json().then(errorData => {
          console.error('Login error:', response.status, errorData)
          throw new Error(`HTTP error! status: ${response.status}`)
        })
      }
      return response.json().then(data => {
        console.log('Login success:', data)
        return data
      })
    })
  },

  // 闂佹椿娼块崝宥夊春濞戙垺鍎岄悹鍥ㄥ絻濮?
  logout: () => {
    return apiClient.post<ApiResponse>('/auth/logout')
  },

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ亗浜归柟鎯у暱椤ゅ懘鏌ｉ～顒€濡介柛鈺傜⊕缁岄亶鍩勯崘褏绀€
  getCurrentUser: () => {
    return apiClient.get<ApiResponse<User>>('/auth/me')
  },

  // 闂佸憡甯￠弨閬嶅蓟婵℃樈ken
  refreshToken: () => {
    return apiClient.post<ApiResponse<{ token: string }>>('/auth/refresh')
  }
}

// 闂佹椿娼块崝宥夊春濞戞氨涓嶉柨娑樺閸婄偤鏌熼幁鎺戝姎鐟?
export const userApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍋ㄩ柕濠忕畱閻撴洟鏌涢幒鎿冩畽闁?
  getUsers: (params?: { skip?: number; limit?: number; search?: string }) => {
    return apiClient.get<User[]>('/users/', params)
  },

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣煟椤剙濡介柛?
  getUser: (id: string | number) => {
    return apiClient.get<User>(`/users/${id}`)
  },

  // 获取指定用户可用机器人列表
  getUserRobots: (userId: string | number) => {
    return apiClient.get<Robot[]>(`/users/${userId}/robots`)
  },

  // 闂佸憡甯楃粙鎴犵磽閹剧粯鍋ㄩ柕濠忕畱閻?
  createUser: (userData: { username: string; email?: string; full_name?: string; password: string }) => {
    return apiClient.post<User>('/auth/register', userData)
  },

  // 闂佸搫娲ら悺銊╁蓟婵犲洦鍋ㄩ柕濠忕畱閻?
  updateUser: (id: string | number, userData: { username?: string; email?: string; full_name?: string; password?: string; is_active?: boolean }) => {
    return apiClient.patch<User>(`/users/${id}`, userData)
  },

  // 闂佸憡甯炴繛鈧繛鍛叄閹粙濡搁敃鈧悡?
  deleteUser: (id: string | number) => {
    return apiClient.delete(`/users/${id}`)
  },

  // 婵炴垶鎹佸▍锝夊极閵堝绠ｇ€瑰嫭婢橀悗濠氭⒑閺夎法啸妞ゎ偅顨婇幊?
  assignRole: (userId: number, roleId: number) => {
    return apiClient.post(`/users/${userId}/roles/${roleId}`)
  },

  // 闂佸憡甯炴繛鈧繛鍛叄閹粙濡搁敃鈧悡鏇㈡偡濞嗘劕绗╁?
  removeRole: (userId: number, roleId: number) => {
    return apiClient.delete(`/users/${userId}/roles/${roleId}`)
  },

  // 闂佸憡鑹鹃張顒勵敆閻愬搫鍗抽悗娑櫳戦悡鈧梺娲绘娇閸斿秹宕哄☉姘枂闁圭儤娲栭ˉ?
  syncUserRole: (userId: number, roleIds: number[]) => {
    return apiClient.post(`/users/${userId}/roles`, { role_ids: roleIds })
  },

  // 批量同步用户机器人
  syncUserRobots: (userId: number, robotIds: number[]) => {
    return apiClient.post(`/users/${userId}/robots`, { robot_ids: robotIds })
  }
}

// 闁哄鏅滅划搴ㄥ煝閼测晜瀚柛鎰靛幘濡叉悂鏌熼幁鎺戝姎鐟?
export const remoteDebugApi = {
  // 闂佸湱鐟抽崱鈺傛杸闁哄鏅滅划搴ㄥ煝閼测晜瀚柛鎰靛幘濡叉悂鏌涘☉娆忕亰闁?
  execute: (workspaceId: string, deviceSn: string, method: string, params: any = {}) => {
    return apiClient.post(`/workspaces/${workspaceId}/remote-debug/${deviceSn}/execute`, {
      method,
      params
    })
  }
}

// 闂佸搫鐗嗛幖顐﹀矗閹寸姷涓嶉柨娑樺閸婄偤鏌熼幁鎺戝姎鐟?
export const dockApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙瀚夐柛婵嗗瑜板倿鏌涢幒鎿冩畽闁?
  getDocks: (params?: { page?: number; pageSize?: number; status?: string }) => {
    return apiClient.get<ApiResponse<PaginatedResponse<Dock>>>('/docks', params)
  },

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣煛閸繃鎯堥柛?
  getDock: (id: string) => {
    return apiClient.get<ApiResponse<Dock>>(`/docks/${id}`)
  },

  // 闂佸憡甯楃粙鎴犵磽閹捐瀚夐柛婵嗗瑜?
  createDock: (dockData: Partial<Dock>) => {
    return apiClient.post<ApiResponse<Dock>>('/docks', dockData)
  },

  // 闂佸搫娲ら悺銊╁蓟婵犲洤瀚夐柛婵嗗瑜?
  updateDock: (id: string, dockData: Partial<Dock>) => {
    return apiClient.put<ApiResponse<Dock>>(`/docks/${id}`, dockData)
  },
  // 闂佸憡甯炴繛鈧繛鍛叄瀵敻宕崟顐㈢岛
  deleteDock: (id: string) => {
    return apiClient.delete<ApiResponse>(`/docks/${id}`)
  }
}

// 闂佸搫鍟版慨鍐残ф径鎰珘闁惧繗顕栭崥鈧梺鑽ゅ仜濡瑧鏁幘顔肩煑?
export const droneApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绫嶉柣妯块哺閻粙鏌￠崼婵囨儓闁割煈浜為幃?
  getDrones: (params?: { page?: number; pageSize?: number; status?: string; dockId?: string }) => {
    return apiClient.get<ApiResponse<PaginatedResponse<Drone>>>('/drones', params)
  },

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣煛閸愵亜小婵懓顦靛?
  getDrone: (id: string) => {
    return apiClient.get<ApiResponse<Drone>>(`/drones/${id}`)
  },

  // 闂佸憡甯楃粙鎴犵磽閹捐绫嶉柣妯块哺閻粙鏌?
  createDrone: (droneData: Partial<Drone>) => {
    return apiClient.post<ApiResponse<Drone>>('/drones', droneData)
  },

  // 闂佸搫娲ら悺銊╁蓟婵犲洤绫嶉柣妯块哺閻粙鏌?
  updateDrone: (id: string, droneData: Partial<Drone>) => {
    return apiClient.put<ApiResponse<Drone>>(`/drones/${id}`, droneData)
  },

  // 闂佸憡甯炴繛鈧繛鍛叄瀵噣鎮╂潏銊ф簞闂?
  deleteDrone: (id: string) => {
    return apiClient.delete<ApiResponse>(`/drones/${id}`)
  },

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绫嶉柣妯块哺閻粙鏌￠崼锝嗩仩濠殿喗鎮傞獮鈧?
  getDroneStatus: (id: string) => {
    return apiClient.get<ApiResponse<{ status: string; battery: number; location?: any }>>(`/drones/${id}/status`)
  },

  // 闂佺鐭囬崘銊у幀闂佸搫鍟版慨鍐残ф径鎰珘濡わ附瀵у畷鍐差渻?
  takeoff: (id: string) => {
    return apiClient.post<ApiResponse>(`/drones/${id}/takeoff`)
  },

  // 闂佺鐭囬崘銊у幀闂佸搫鍟版慨鍐残ф径鎰珘婵炲樊浜濋鏍煢閳?
  land: (id: string) => {
    return apiClient.post<ApiResponse>(`/drones/${id}/land`)
  },

  // 闂佺鐭囬崘銊у幀闂佸搫鍟版慨鍐残ф径鎰珘濡わ箒娉曠粻鏌ユ煠?
  returnToHome: (id: string) => {
    return apiClient.post<ApiResponse>(`/drones/${id}/return-home`)
  }
}

// 婵炲濮鹃褎鎱ㄩ悢铏逛笉闁挎稑瀚崐鐐烘煙閹帒鍔氱憸?
export const missionApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸ャ劎顩烽悹鍥ㄥ絻椤倝鏌涢幒鎿冩畽闁?
  getMissions: (params?: { page?: number; pageSize?: number; status?: string; droneId?: string }) => {
    return apiClient.get<ApiResponse<PaginatedResponse<Mission>>>('/missions', params)
  },

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣归悩渚殭濠?
  getMission: (id: string) => {
    return apiClient.get<ApiResponse<Mission>>(`/missions/${id}`)
  },

  // 闂佸憡甯楃粙鎴犵磽閹惧顩烽悹鍥ㄥ絻椤?
  createMission: (missionData: Partial<Mission>) => {
    return apiClient.post<ApiResponse<Mission>>('/missions', missionData)
  },

  // 闂佸搫娲ら悺銊╁蓟婵犲啰顩烽悹鍥ㄥ絻椤?
  updateMission: (id: string, missionData: Partial<Mission>) => {
    return apiClient.put<ApiResponse<Mission>>(`/missions/${id}`, missionData)
  },

  // 闂佸憡甯炴繛鈧繛鍛缁傛帞鎷犻幓鎺濇匠
  deleteMission: (id: string) => {
    return apiClient.delete<ApiResponse>(`/missions/${id}`)
  },

  // 闂佸憡鍑归崹鐗堟叏閳哄倻顩烽悹鍥ㄥ絻椤?
  startMission: (id: string) => {
    return apiClient.post<ApiResponse>(`/missions/${id}/start`)
  },

  // 闂佺顑嗙划宥夘敆濞戞瑧顩烽悹鍥ㄥ絻椤?
  stopMission: (id: string) => {
    return apiClient.post<ApiResponse>(`/missions/${id}/stop`)
  },

  // 闂佸搫妫楅崐鍛婄閻樺磭顩烽悹鍥ㄥ絻椤?
  pauseMission: (id: string) => {
    return apiClient.post<ApiResponse>(`/missions/${id}/pause`)
  },

  // 闂佽鍘归崹褰捤囬崣澶岊浄閻犲洦褰冮～?
  resumeMission: (id: string) => {
    return apiClient.post<ApiResponse>(`/missions/${id}/resume`)
  }
}

// 婵炲濮鹃褎鎱ㄩ悢鐑樺闁哄娉曠粔鍧楁煙閹帒鍔氱憸?
export const missionRecordApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸ャ劎顩烽悹鍥ㄥ絻椤倝鎮规担瑙勭凡缂傚秴绉瑰畷姘旈崟鈹惧亾?
  getMissionRecords: (params?: { page?: number; pageSize?: number; status?: string; startDate?: string; endDate?: string }) => {
    return apiClient.get<ApiResponse<PaginatedResponse<MissionRecord>>>('/mission-records', params)
  },

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣归悩渚殭濠殿喚鍠撻幏瀣级鐠恒劎协
  getMissionRecord: (id: string) => {
    return apiClient.get<ApiResponse<MissionRecord>>(`/mission-records/${id}`)
  },

  // 闂佸憡甯炴繛鈧繛鍛缁傛帞鎷犻幓鎺濇匠闁荤姳鐒﹀妯肩礊?
  deleteMissionRecord: (id: string) => {
    return apiClient.delete<ApiResponse>(`/mission-records/${id}`)
  }
}

// 闂佺缈伴崕鎾敆閻旇櫣涓嶉柨娑樺閸婄偤鏌熼幁鎺戝姎鐟?
export const alertApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绠柕澶樼厛閸斿懘鏌涢幒鎿冩畽闁?
  getAlerts: (params?: { page?: number; pageSize?: number; status?: string; deviceType?: string }) => {
    return apiClient.get<ApiResponse<PaginatedResponse<Alert>>>('/alerts', params)
  },

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣煙闊彃鍔ユい?
  getAlert: (id: string) => {
    return apiClient.get<ApiResponse<Alert>>(`/alerts/${id}`)
  },

  // 闂佸搫绉村ú鈺咁敊閸ヮ剙绠柕澶樼厛閸斿懎鈽夐幘铏儓闁告埊绱曢幏?
  markAsRead: (id: string) => {
    return apiClient.put<ApiResponse<Alert>>(`/alerts/${id}/read`)
  },

  // 闂佸搫绉村ú鈺咁敊閸ヮ剙绠ラ柍褜鍓熷鍨緞鐎ｎ€捇鎮归埀顒勬晜閼愁垳顦伴悗瑙勭摃鐏忣亪顢?
  markAllAsRead: () => {
    return apiClient.put<ApiResponse>('/alerts/read-all')
  },

  // 闂佸憡甯炴繛鈧繛鍛叄楠炲酣濡烽…鎴濆Τ
  deleteAlert: (id: string) => {
    return apiClient.delete<ApiResponse>(`/alerts/${id}`)
  }
}

// 闁荤喐鐟︾敮鐔哥珶婵犲嫮涓嶉柨娑樺閸婄偤鏌熼幁鎺戝姎鐟?
export const roleApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸モ晜鍠嗛柟鐑樻礀椤ュ繘鏌涢幒鎿冩畽闁靛棗鍟撮弫宥夊醇濠靛棛妯侀梺鍛婂嚬閸嬪懎顭囬崼銉︹挃闁归偊浜欑换鍡涙煙椤撗冪伈缂?
  getRoles: (params?: { skip?: number; limit?: number; search?: string }) => {
    return apiClient.get<Role[]>('/roles/', params)
  },

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣偡濞嗘劕绗╁?
  getRole: (id: string | number) => {
    return apiClient.get<Role>(`/roles/${id}`)
  },

  // 闂佸憡甯楃粙鎴犵磽閹捐埖鍠嗛柟鐑樻礀椤?
  createRole: (roleData: { role_name: string; role_code: string; description: string }) => {
    return apiClient.post<Role>('/roles/', roleData)
  },

  // 闂佸搫娲ら悺銊╁蓟婵犲嫭鍠嗛柟鐑樻礀椤?
  updateRole: (id: string | number, roleData: { role_name: string; role_code: string; description: string }) => {
    return apiClient.patch<Role>(`/roles/${id}`, roleData)
  },

  // 闂佸憡甯炴繛鈧繛鍛捣閹叉挳骞掗弴鐑嗘
  deleteRole: (id: string | number) => {
    return apiClient.delete(`/roles/${id}`)
  },

  // 婵炴垶鎹囩紓姘讹綖濡ゅ懏鍤岄柟缁樺笒閻庡姊洪弶璺ㄐｆ繛鐓庣墦濮?
  updateRolePermissions: (roleId: number, payload: { permission_ids: number[] }) => {
    return apiClient.post(`/roles/${roleId}/permissions`, payload)
  }
}

// 缂備緡鍨靛畷鐢靛垝濞差亝鍋愰柤鍝ヮ暯閸嬫挻鎷呴悷鏉款槻闂?
export const systemApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸モ晛瀵查柤濮愬€楅崺鐘绘煟濡灝鐓愰柍褜鍏涢悞锕傘€呰閹?
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

  // 闂佸吋鍎抽崲鑼躲亹閸モ晛瀵查柤濮愬€楅崺鐘绘煕鐎ｃ劌鍔氶柟顔肩Ч閹晠鎳滅喊妯轰壕?
  getSystemHealth: () => {
    return apiClient.get<ApiResponse<{
      status: string
      uptime: number
      version: string
      lastCheck: string
    }>>('/system/health')
  }
}

// 闁荤姳鐒﹂崕鎶剿囬鍌滀笉闁挎稑瀚崐鐐烘煙閹帒鍔氱憸?
export const deviceApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸モ晜濯奸柟顖嗗本校闂佸憡甯楅〃澶愬Υ?
  getDevices: (params?: { skip?: number; limit?: number; keyword?: string }) => {
    console.log('闁荤姳鐒﹂崕鎶剿囬悵绛咺闁荤姴顑呴崯浼村极?- 闂佸憡鐟ラ崐褰掑汲?', params)
    console.log('Current ApiClient status - checking Authorization header')
    return apiClient.get<Device[]>('/devices/', params)
  },

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣偣娴ｇ懓鍔ゆい?
  getDevice: (deviceSn: string) => {
    return apiClient.get<Device>(`/devices/${deviceSn}`)
  },

  // 闂佸搫娲ら悺銊╁蓟婵犲嫭濯奸柟顖嗗本校婵烇絽娲犻崜婵囧?
  updateDevice: (deviceSn: string, deviceData: Partial<Device>) => {
    return apiClient.put<Device>(`/devices/${deviceSn}`, deviceData)
  },

  // 闂佸憡甯炴繛鈧繛鍛捣閹峰骞嗚濡?
  deleteDevice: (deviceSn: string) => {
    return apiClient.delete(`/devices/${deviceSn}`)
  }
}

// HMS闂佺缈伴崕鎾敆閻旂厧绫嶉柕澶堝劤缁犲爼鏌熼幁鎺戝姎鐟?
export const hmsApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸モ晜濯奸柟顖嗗本校闂佹眹鍔岄崵妗礢闂佺缈伴崕鎾敆閻旂厧绫嶉柕澶堝劤缁?
  getDeviceHms: (deviceSn: string) => {
    return apiClient.get<HmsAlert[]>(`/hms/devices/${deviceSn}/hms`)
  }
}

// 闁荤喐鐟ュΛ婵嬨€傜捄濂借鎷呴悷鏉款槻闂?
export const livestreamApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸モ晜鍠嗛柛鈩冧緱閺嗐儵鎮楅悷鎵Ш闁革絿鍎ょ粚閬嶅焺閸愌呯
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

  // 闂佸憡鍑归崹鐗堟叏閳哄啯鍠嗛柛鈩冧緱閺嗐儲绻?
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

  // 闂佸憡甯掑ú锕€鐣烽弻銉︹拹婵犲﹤鍟ㄦ禒?
  changeLens: (deviceSn: string, data: {
    video_id: string
    video_type: string
  }) => {
    return apiClient.post<{
      message: string
      bid: string
    }>(`/livestream/devices/${deviceSn}/livestream/lens-change`, data)
  },

  // 闁荤姳绀佹晶浠嬫偪閸℃ぜ鈧帡宕ㄩ鐣屽酱闁?
  setQuality: (deviceSn: string, data: {
    video_id: string
    video_quality: number
  }) => {
    return apiClient.post<{
      message: string
      bid: string
    }>(`/livestream/devices/${deviceSn}/livestream/set-quality`, data)
  },

  // 闂佸憡甯掑Λ妤呮儓閸℃稑绠崇憸宥夊春?
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

// 闂佸搫顦崯鏉戭瀶閾忓湱涓嶉柨娑樺閸婄偤鏌熼幁鎺戝姎鐟?
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
// DRC濠碘槅鍨埀顒€纾涵鈧梺瑙勪航閸庤精銇?
export const drcApi = {
  // 濠碘槅鍋€閸嬫捇鏌″畝濠冾€揜C闂佸搫瀚烽崹浼村箚娓氣偓瀹曟瑩宕卞Δ濠冃ｉ柣蹇撶箺娴滎剟宕?
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

  // 闂佸吋鍎抽崲鑼躲亹閸㈠硤C闂佺粯顭堥崺鏍焵?
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

  // 闁哄鏅滅粙鎴﹀矗閸滅澐C濠碘槅鍨埀顒€纾涵鈧?
  enterDrcMode: (deviceSn: string) => {
    return apiClient.post<{
      message: string
      code: number
    }>(`/drc/devices/${deviceSn}/drc/enter`, {
      osd_frequency: 10,
      hsi_frequency: 4
    })
  },

  // 闂備緡鍋€閸嬫捇鏌涢幋鐘垫АRC濠碘槅鍨埀顒€纾涵鈧?
  exitDrcMode: (deviceSn: string) => {
    return apiClient.post<{
      message: string
      code: number
    }>(`/drc/devices/${deviceSn}/drc/exit`)
  },

  // 缂備胶濮崑鎾绘煕濡や焦绀冮悽顖氱埣瀹?
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

// 婵炲濮鹃褎鎱ㄩ悢鐑樺闁哄娉曠粔鍧楁煟閳哄喚鐒鹃柛娅诲洤绠抽柕澶堝劚缂?
export const waylineApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸ャ劎顩烽悹鍥ㄥ絻椤倝鎮规担瑙勭凡缂傚秴绉瑰畷姘旈崟鈹惧亾?
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

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍤嬫い蹇撴濞堢娀鏌￠崒姘煑婵炲棎鍨藉畷姘旈崟鈹惧亾?
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

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍤嬫い蹇撴濞堢娀鎮归崶鐑芥闁?
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

  // 闂佸憡甯炴繛鈧繛鍛叄閹虫粓顢旈崱妤佺枃闂佸搫鍊稿ú锝呪枎?
  deleteWaylineFile: (workspaceId: string, waylineId: string) => {
    return apiClient.delete<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/files/${waylineId}`)
  },

  // 闂佸憡甯楃粙鎴犵磽閹惧顩烽悹鍥ㄥ絻椤?
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
    // 缂備胶濮甸〃鍡欐兜閸洘鍎庣紒瀣仢瑜扮娀鎮楀☉娆樻畷妞ゆ柨鐭傞弫宥夊醇閳跺簱鏅犲畷婵嬪Ω閵夈儳鍘抐light-tasks闂佽浜介崕杈亹濞戙垺鏅?
    enable_vision?: boolean
    vision_algorithms?: number[]
    vision_threshold?: number
    // 闂佸憡绋忛崝宥咃耿閳╁啰顩烽悹鍥ㄥ絻椤倝姊洪弶璺ㄐら柣銈呮閺佸秹宕奸悢鍝ュ帎婵犫拃鍛壋缂?
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

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍤嬫い蹇撴濞堢姴霉閻樹警鍤欏┑顔惧枔閳ь剙婀遍崑鐐差渻閸屾稒浜ゆ繛鎴灻?
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

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍤嬫い蹇撴濞堢姴霉閻樹警鍤欏┑顔惧枔閹风娀鏁傞崜褏鐓勬繛锝呮礌閸撴繃瀵?
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

  // 闂佸憡甯炴繛鈧繛鍛缁傛帞鎷犻幓鎺濇匠闁荤姳鐒﹀妯肩礊?
  deleteJob: (workspaceId: string, jobId: string) => {
    return apiClient.delete<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/jobs/${jobId}`)
  },

  // 闂佸憡鐟﹂悧妤冪矓闁垮浜ら柡鍐ㄦ搐閻?
  cancelReturnHome: (workspaceId: string, dockSn: string) => {
    return apiClient.post<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/docks/${dockSn}/cancel-return-home`)
  },

  // 闂佸憡鐟﹂悧妤冪矓闁垮顩烽悹鍥ㄥ絻椤?
  stopJob: (workspaceId: string, jobId: string) => {
    return apiClient.post<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/jobs/${jobId}/stop`)
  },

  // 闂佺厧澹婃禍鐐哄吹鎼淬劌姹查柛灞剧煯缁?
  pauseJob: (workspaceId: string, jobId: string) => {
    return apiClient.post<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/jobs/${jobId}/pause`)
  },

  // 闂佺厧澹婃禍鐐哄吹鎼淬劌绠掗柕蹇曞濡?
  resumeJob: (workspaceId: string, jobId: string) => {
    return apiClient.post<{
      code: number
      message: string
    }>(`/wayline/workspaces/${workspaceId}/jobs/${jobId}/resume`)
  },

  // 闂佸湱鐟抽崱鈺傛杸婵炲濮鹃褎鎱?
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

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ煈妲归柣鎰邦杺閺€鐣岀磽娴ｅ搫鏋欐い鎾存倐楠炲酣濡烽妸锝傚亾?
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

// 婵犳鍨辩敮濠勭礊鐎ｎ喖妫橀柛銉檮椤愪粙鏌熼幁鎺戝姎鐟?
export const mediaApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸ャ劌鍨旈柟鍝勭Ф缁夊ジ鏌￠崒姘煑婵炲棎鍨藉畷姘旈崟鈹惧亾?
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

  // 婵炴垶鎸搁鍫澝归崶銊ュ灁闁瑰搫绉剁粔濂告煛閸屾碍鐭楁繛?
  downloadMediaFile: (fileId: string) => {
    return apiClient.get(`/media/download/${fileId}`, {}, {
      responseType: 'blob'
    } as any)
  }
}

// Vision闂佺缈伴崕鎾敆閻旂厧绠抽柕澶堝劚缂?
export const visionApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绠柕澶樼厛閸斿懘鏌涢幒鎿冩畽闁?
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

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣煙闊彃鍔ユい鎺斿枔閹风娀鏁傞挊澶婂
  getAlert: (workspaceId: string, alertId: string) => {
    return apiClient.get<VisionAlert>(`/workspaces/${workspaceId}/vision/alerts/${alertId}`)
  },

  // 婵犮垼娉涚€氼噣骞冩繝鍥х闁靛鐓堥崝?
  handleAlert: (workspaceId: string, alertId: string, data: {
    status: 'HANDLED' | 'IGNORED'
    handle_note?: string
  }) => {
    return apiClient.put<VisionAlert>(`/workspaces/${workspaceId}/vision/alerts/${alertId}`, data)
  },

  // 闂佸搫娲ら悺銊╁蓟婵犲洤绠柕澶樼厛閸斿懘鏌ｅΟ鍨厫闁逞屽厸缁躲倗妲愬▎鎰閻犳亽鍔嶉弳蹇旀叏濠垫挾鎮奸柍銉︼耿閹啴宕欏鐢€闂侀潻闄勫妯侯焽閸愵喗鏅?
  updateAlertStatus: (workspaceId: string, alertId: string, data: {
    status: 'HANDLED' | 'IGNORED'
    handle_note?: string
  }) => {
    return apiClient.put<VisionAlert>(`/workspaces/${workspaceId}/vision/alerts/${alertId}/status`, data)
  }
}

// 闂佸搫鐗嗛幖顐⑩枍閹烘挾顩查柧蹇氼嚃閸氣偓闂佽崵鍋涘Λ娆戞暜閹绢喖鐭?
export const robotApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙瀚夐柛婵嗗閻濄倕霉濠婂啯鎯堥柛顭戜簽閹?
  getRobots: (params?: { skip?: number; limit?: number }) => {
    return apiClient.get<RobotsResponse>('/robots', params)
  },
  getRobotDetail: (robotId: string) => {
    return apiClient.get<Robot>(`/robots/${encodeURIComponent(robotId)}`)
  }
}

// 闂佸搫鐗嗛幖顐⑩枍閹烘鍋戞俊銈勭娴犳﹢鏌涢幒鏇炵厫閻㈩垱鎸冲畷?
export const dogApi = {
  // 闂佸憡鐟﹂崹鍧楀焵椤戣法鍔嶆繝褉鍋撻梺闈╃祷閸斿海鈧艾绉归獮鎺曨槻闁糕晜顨婇獮鎰板炊閿旇棄袘
  sendCommand: (robotId: string, data: { command_name: string }) => {
    return apiClient.post(`/dog/${robotId}/dog_command`, data)
  }
}

// 闁诲簼绲绘竟鍫ュ春閸涱垳涓嶉柨娑樺閸婄偤鏌熼幁鎺戝姎鐟?
export const navigationApi = {
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙鎹堕柡澶嬪缁傚牓鏌涢幒鎿冩畽闁?
  getMapList: (robotId: string, signal?: AbortSignal) => {
    return apiClient.get<{ msg: { error_code: number; error_msg: string; result: string[] }; request_id: string }>(`/navigation/${robotId}/map_list`, undefined, { signal })
  },
  // 闂佸憡甯炴繛鈧繛鍛叄瀹曠兘寮堕幐搴ｎ洯
  deleteMap: (robotId: string, mapName: string) => {
    return apiClient.delete(`/navigation/${robotId}/map/${mapName}`)
  },
  // 闁诲簼绲绘竟鍫ュ春閸涙潙绠崇憸宥夊春?
  controlNavigation: (robotId: string, data: { action: number; map_name: string }) => {
    return apiClient.post(`/navigation/${robotId}/ctrl_nav`, data)
  },
  // 闂佸吋鍎抽崲鑼躲亹閸パ屽殫妞ゅ繐娲︽慨澶娒归悩渚殭濠殿喚鍠栧畷姘旈崟鈹惧亾?
  getTrackList: (robotId: string, signal?: AbortSignal) => {
    return apiClient.get<{ msg: { error_code: number; error_msg: string; result: string[] }; request_id: string }>(`/navigation/${robotId}/track_list`, undefined, { signal })
  },
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绀傞柟鎯板Г閺嗘盯鏌ｉ幇顖ｆ綈闁哄鍟粋鎺旀崉閸濆嫮浠氶柣?
  getTaskpointList: (robotId: string, trackName: string, signal?: AbortSignal) => {
    return apiClient.get<{ msg: { error_code: number; error_msg: string; result: string[] }; request_id: string }>(`/navigation/${robotId}/taskpoint_list`, { track_name: trackName }, { signal })
  },
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绠ラ柍褜鍓熷鍨緞婵犲啫鍓烽柡澶嗘櫊閳ь剚绋掑畷鏌ユ煕閺冩挾纾块柛瀣剁秮瀹曟艾螖閸曗斁鍋?
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
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙鐭楅柟瀛樼箘椤忔挳鏌ｉ幇鎵冲亾濞戞瑥搴婇梺鍛婃煛閳ь剙鍟块悘娆撴偠?
  getPointTaskList: (robotId: string, signal?: AbortSignal) => {
    return apiClient.get<{ data: { isStart: boolean; task_id: string; task_name: string; taskcontent: any[] }[]; request_id: string }>(`/taskpoints/${robotId}/task_list`, undefined, { signal })
  },
  // 闂佸搫娲ら悺銊╁蓟婵犲洤鐭楅柟瀛樼箘椤忔挳鏌ｉ幇鎵冲亾濞戞瑥搴婇梺鍛婃煛閳ь剙鍟块悘娆撴偠?
  updatePointTaskList: (robotId: string, data: { data: { task_id: string; task_name: string; taskcontent: any[] }[] }) => {
    return apiClient.post<{ 
      message: string; 
      response: { 
        data: { isStart: boolean; task_id: string; task_name: string; taskcontent: any[] }[]; 
        request_id: string 
      } 
    }>(`/taskpoints/${robotId}/task_list`, data)
  },
  // 闂佸憡鍑归崹鐗堟叏閳哄懎鐭楅柟瀛樼箘椤忔挳鏌ｉ幇鎵冲亾濞戞瑥搴婇梺?
  startPointTask: (robotId: string, data: {
    id: string;
    sn: string;
  }) => {
    return apiClient.post(`/taskpoints/${robotId}/start_task`, data)
  },
  // 闂佺顑嗙划宥夘敆濞戙垹鐭楅柟瀛樼箘椤忔挳鏌ｉ幇鎵冲亾濞戞瑥搴婇梺?
  // 闂佺顑嗙划宥夘敆濞戙垹鐭楅柟瀛樼箘椤忔挳鏌ｉ幇鎵冲亾濞戞瑥搴婇梺?
  stopPointTask: (robotId: string, data: {
    id: string;
    sn: string;
  }) => {
    return apiClient.post(`/taskpoints/${robotId}/stop_task`, data)
  },
  // 闂佸吋鍎抽崲鑼躲亹閸ャ劌绶炴慨姗嗗亝瀹曟煡鏌涢弮鎾剁？缂侇喖绉瑰畷姘旈崟鈹惧亾?
  getMultiTaskList: (robotId: string, signal?: AbortSignal) => {
    return apiClient.get<{ msg: { multitask_id: string; multitask_name: string; multitask_list: any[] }[]; request_id: string }>(`/multitasks/${robotId}/multitask_list`, undefined, { signal })
  },
  // 闂佸吋鍎抽崲鑼躲亹閸ャ劎顩烽悹鍥ㄥ絻椤倗绱掗銉殭闁诲海鍏樺畷姘旈崟鈹惧亾?
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
  // 闂佸憡鍑归崹鐗堟叏閳轰緡鍤楁い蹇撴处婵霉閻樹警鍤欏┑?
  startTrack: (robotId: string, data: {
    action: number;
    wait: number;
    obs_mode: number;
    track_name: string;
    taskpoint_name: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/start_track`, data)
  },
  // 闂佸憡鐟﹂悧妤冪矓瀹勯偊鍤楁い蹇撴处婵霉閻樹警鍤欏┑?
  // 闂佸憡鐟﹂悧妤冪矓瀹勯偊鍤楁い蹇撴处婵霉閻樹警鍤欏┑?
  cancelTrack: (robotId: string, data: {
    action: number;
    wait: number;
    obs_mode: number;
    track_name: string;
    taskpoint_name: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/start_track`, data)
  },
  // 濠电儑缍€椤曆勬叏閻愬樊鍤楁い蹇撴处婵霉閻樹警鍤欏┑顔惧枛閹?
  addTrackPoint: (robotId: string, data: any) => {
    return apiClient.post(`/tracks/${robotId}/add_track_point`, data)
  },
  // 闂佸搫娲ら悺銊╁蓟婵犲偆鍤楁い蹇撴处婵霉閻樹警鍤欏┑顔惧枛閹?
  updateTaskPoint: (robotId: string, data: any) => {
    return apiClient.put(`/tracks/${robotId}/update_taskpoint`, data)
  },
  // 闂佸憡甯炴繛鈧繛鍛椤曘儵顢旈崶銊ヮ潕婵炲濮鹃褎鎱ㄩ悢鍏煎€?
  deleteTrackPoint: (robotId: string, data: any) => {
    return apiClient.delete(`/tracks/${robotId}/delete_track_point`, data)
  },
  // 闂佸憡甯炴繛鈧繛鍛缁傛帞鎷犻幓鎺濇匠缂?
  deleteTaskpointFile: (robotId: string, data: { action: number; track_name: string; taskpoint_name: string }) => {
    return apiClient.post(`/navigation/${robotId}/delete_taskpoint_file`, data)
  },
  // 闂佸搫娲ら悺銊╁蓟婵犲偆鍤楁い蹇撴处婵霉閻樹警鍤欏┑顔惧枛瀹曟艾螖閸曗斁鍋撻崘顔芥櫖闁割偁鍨婚崺鐘测槈閹绢垰浜鹃梺鍦帛閸旀帒顫濋敃鍌涙櫖?
  updateTrackTaskList: (robotId: string, trackName: string, taskPointName: string, data: { data: any[] }) => {
    return apiClient.post<{
      message: string;
      response: {
        data: any[];
        request_id: string;
      }
    }>(`/tracks/${robotId}/task_list`, { track_name: trackName, track_point_name: taskPointName, ...data })
  },
  // MSF闂佺鐭囬崘銊у幀
  msfControl: (robotId: string, data: {
    action: number;
    mode: number;
    session: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/msf_control`, data)
  },
  // 閻熸粎澧楀ú鏍偓鍨耿楠炴帟顦查柛鈺傤殜閺佸秹宕煎┑鍫紱婵?闂佺顑嗙划宥夘敆濞戙垺鏅?
  dataRecord: (robotId: string, data: {
    action: number;
    data_name: string;
  }) => {
    // 闂佸憡鑹惧ù鐑筋敂椤掑嫬绠抽柕澶堝劚缂嶆捇鎮规笟顖氱仩缂佸墎鍋ら獮鎰緞鐏炶棄瀛?/navigation/{robot_id}/data_record
    return apiClient.post(`/navigation/${robotId}/data_record`, data)
  },
  // 闂佹眹鍨婚崰鎰板垂濮樿泛鎹堕柡澶嬪缁傚牓鏌ㄥ☉妯绘睘LAM闂?
  slam: (robotId: string, data: {
    action: number;
    data_name: string;
    map_name: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/slam`, data)
  },
  // 闂佹眹鍨婚崰鎰板垂濮樿泛鍐€闁告侗鍠氭竟鎰版煕閿旇姤绶叉繛?
  changePcd: (robotId: string, data: {
    action: number;
    map_name: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/change_pcd`, data)
  },
  // 闂佸搫鍊瑰妯肩磽閹剧粯鎳氱€广儱鎳忛崐銈夋煕閿旇姤绶叉繛?
  createMsfData: (robotId: string, data: {
    session: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/create_msf_data`, data)
  },
  // INS闂佺鐭囬崘銊у幀
  insControl: (robotId: string, data: {
    action: number;
  }) => {
    return apiClient.post(`/navigation/${robotId}/ins_control`, data)
  },
  // INS闂佸憡甯楃换鍌烇綖閹版澘绀?
  initINS: (robotId: string, data: {
    action: number;
  }) => {
    return apiClient.post(`/speed/${robotId}/nav_stop`, data)
  },
  // 闂佸憡鍑归崹鐗堟叏閳哄倸绶炴慨姗嗗亝瀹曟煡鏌涢弮鎾剁？缂?
  startMultiTaskGroup: (robotId: string, data: {
    multitask_name: string;
    multitask_id: string;
    middle_start: number;
    action: number;
  }) => {
    return apiClient.post(`/multitasks/${robotId}/start_multitask_group`, data)
  },
  // 闂佸憡鐟﹂悧妤冪矓闁垮绶炴慨姗嗗亝瀹曟煡鏌涢弮鎾剁？缂?
  cancelMultiTaskGroup: (robotId: string) => {
    return apiClient.post(`/multitasks/${robotId}/cancel_multitask_group`, {})
  },
  // 闂佸憡甯楃粙鎴犵磽閹炬潙绶炴慨姗嗗亝瀹曟煡鏌涢弮鎾剁？缂?
  createMultiTaskGroup: (robotId: string, data: { multitask_name: string }) => {
    return apiClient.post(`/multitasks/${robotId}/multitask_group`, data)
  },
  // 闂佸憡甯炴繛鈧繛鍛瀵板嫬顫濋锝呭簥闂佸憡妫戠槐鏇犲垝?
  deleteMultiTaskGroup: (robotId: string, data: { multitask_id: string }) => {
    return apiClient.delete(`/multitasks/${robotId}/multitask_group`, data)
  },
  // 濠电儑缍€椤曆勬叏閻愬顩烽悹鍥ㄥ絻椤倝鏌涢幒鎾寸凡妞わ附瀵х粋鎺旀嫚閹绘帩娼崇紓?
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
  // 闂佸搫娲ら悺銊╁蓟婵犲啫绶炴慨姗嗗亝瀹曟煡鏌涢弮鎾剁？缂侇喖绉电粙澶愵敇閻樺磭鏆犳繛瀵稿Ь椤曆勬叏?
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
  // 闂佸憡甯炴繛鈧繛鍛瀵板嫬顫濋锝呭簥闂佸憡妫戠槐鏇犲垝瀹ュ棛鈻旀い鎾跺У閻ｅ崬霉閻樹警鍤欏┑?
  deleteTaskFromMultiTaskGroup: (robotId: string, data: {
    multitask_id: string;
    child_id: string;
  }) => {
    return apiClient.delete(`/multitasks/${robotId}/multitask`, data)
  },
  // 闁荤姴顑呴崯顖炲汲閿濆棗绶炴慨姗嗗亝瀹曟煡鏌涢弮鎾剁？缂侇喖绉电粙澶愵敇濠靛洤搴婇梺鍛婃缁绘繈濡存惔銏″劅?
  swapTaskOrder: (robotId: string, data: {
    multitask_id: string;
    child_id: string;
    order: string;
  }) => {
    return apiClient.post(`/multitasks/${robotId}/order_swap`, data)
  },
  // 闂佸吋鍎抽崲鑼躲亹閸モ斁鍋撶憴鍕暡婵＄偛鍊圭粋鎺旀嫚閹绘帩娼抽梺鍛婂笚椤ㄥ濡?
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
  // 闂佸搫鍊瑰姗€路閸愵亖鍋撶憴鍕暡婵＄偛鍊圭粋鎺旀嫚閹绘帩娼?
  createScheduledTask: (robotId: string, data: {
    track_name: string;
    track_point_name: string;
    start_time: string; // 闂佸搫绉堕崢褏妲? "HH:MM"
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
  // 闂佸憡甯炴繛鈧繛鍛捣閳ь剝顫夌喊宥咁渻閸屾稓顩烽悹鍥ㄥ絻椤?
  deleteScheduledTask: (robotId: string, taskId: string) => {
    return apiClient.delete(`/scheduled/${robotId}/scheduled_tasks`, {
      id: taskId
    })
  },
  // 闂佸憡甯楃粙鎴犵磽閹惧顩烽悹鍥ㄥ絻椤倗绱撴担绋款仾闁哄鍟粋?
  createTaskpointFile: (robotId: string, data: {
    track_name: string;
    keypoint_name: string;
  }) => {
    return apiClient.post(`/navigation/${robotId}/create_taskpoint_file`, data)
  },
  // 闁荤姳绀佹晶浠嬫偪閸℃稒鈷曟繝濠傛媼閺嗏€愁熆鐠哄搫顏柟顔硷工铻ｉ柍銉ョ－绾偓
  setObsHandle: (robotId: string, data: {
    action: number; // 0: 闁哄鏅滈崹鍨枔? 1: 闂佺顑嗙划鎾斥枔? 2: 缂傚倷鐒﹀ú鐔封枔?
  }) => {
    return apiClient.post(`/navigation/${robotId}/set_obs_handle`, data)
  },
  // GPS闂佺鐭囬崘銊у幀
  useGps: (robotId: string, data: {
    action: number; // 0: 闂佺绻戞繛濠偽涚喊鎬璖, 1: 閻庢鍠掗崑鎾绘煕濮樿鲸鐏丳S
  }) => {
    return apiClient.post(`/navigation/${robotId}/use_gps`, data)
  },
  // 闂佸吋鍎抽崲鑼躲亹閸㈡墾S闂佺粯顭堥崺鏍焵?
  getGpsStatus: (robotId: string) => {
    return apiClient.get<{ msg: { error_code: number; error_msg: string; result: number }; request_id: string }>(`/navigation/${robotId}/use_gps`)
  },
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙鏋侀柣妤€鐗嗙粊锕傛煕閺嵮勫櫣闁割煈浜為幃?
  getDataList: (robotId: string) => {
    return apiClient.get<{ msg: { error_code: number; error_msg: string; result: string[] }; request_id: string }>(`/navigation/${robotId}/data_list`)
  },
  // 闂佸憡甯炴繛鈧繛鍛叄瀵偊鎮ч崼婵堛偊闂?
  deleteDataPackage: (robotId: string, dataName: string) => {
    return apiClient.delete(`/navigation/${robotId}/data/${dataName}`)
  },
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙妫橀柛銉檮椤愪粙鏌涢幒鎿冩畽闁?
  getNavigationList: (robotId: string, mapName: string, path?: string, robotIp?: string) => {
    // 婵炶揪缍€濞夋洟寮妶澶嬪剮缂佸顑欓崵鐘绘偣娓氼垰鐏犵紒鍓佸仱閺佸秴鐣濋埀顒勫极?nginx 婵炲濯寸徊鍧楀箖婵犲啫绶為柛鏇ㄥ幗閸婄偤鏌ㄥ☉娆戔棩缂佸崬鐖煎畷?robot_ip 闂佽　鍋撴い鏍ㄧ☉閻︻噣鏌涢弬璇插闁逞屽厸濞村洭鎯屾ィ鍐╁仺?
    const params: Record<string, any> = { map_name: mapName }
    if (path) params.path = path
    if (robotIp) params.robot_ip = robotIp
    return apiClient.get<{ code: number; msg: string; data: any[] }>('/navigation_list', params, {
      baseURL: ''
    })
  },
  // 闂佸憡甯炴繛鈧繛鍛捣閳ь兛绲绘竟鍫ュ春閸涙潙鏋侀柣妤€鐗嗙粊?
  deleteNavigationData: (data: {
    map_name: string;
    type: string;
    pwd?: string;
    is_file?: number;
    path?: string;
    robot_ip?: string;
  }) => {
    // robot_ip 闂佽　鍋撻柟顖嗗啰鍘?URL query string闂佹寧绋戞總鏃傛?nginx $arg_robot_ip 闁荤姴娲╅褑銇愰崶顒€纾绘慨姗嗗墮琚熼梺璇″厸濞村洭鎯屾ィ鍐╁仺?
    // 闂佺绻戝﹢鍦礊閹寸偟鈻旀慨姗嗗墮椤倝鏌涘▎蹇撯偓褰掑汲閻旂厧缁?form-urlencoded body
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
  // 闁荤姳璀﹂崹鎶藉吹鎼淬們浜归柡鍥╁仜閻?
  trackRecord: (robotId: string, data: { action: number; track_name: string }) => {
    return apiClient.post(`/navigation/${robotId}/track_record`, data)
  },
  // 闂佸憡甯炴繛鈧繛鍛唉閵囨劙寮撮悙鑼幀闂佹眹鍔岀€氼垶鎯岄崜褏妫?
  deleteTrack: (robotId: string, data: { track_name: string }) => {
    return apiClient.post(`/navigation/${robotId}/delete_track`, data)
  },
  // 闁哄鍋戦崝蹇涘箮濡ゅ懐宓侀柧蹇ｅ亞閹?
  trajectorySmooth: (robotId: string, data: { track_name: string }) => {
    return apiClient.post(`/navigation/${robotId}/trajectory_smooth`, data)
  },
  // 婵炴垶鎸撮崑鎾绘⒑濞嗘儳鏋涢柛妯荤墵閹?闂佸憡甯楁竟鍡涘磻?
  oneKeyRecharge: (robotId: string, data: { sn: string; action: number; chargeIndex: string }) => {
    return apiClient.post(`/charging/${robotId}/one_key_recharge`, data)
  },
  // 闂佸搫妫楅崐鍛婄閻樼鍋撴担鍐棈闁?閻庣敻鍋婃禍锝夊箮?
  pauseNavigation: (robotId: string, data: any = {}) => {
    return apiClient.post(`/navigation/${robotId}/nav_pause`, data)
  },
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ煉绱ｉ柛鏇ㄥ幘閺嬪倿鏌ｉ幇顔藉殌闁割煈浜為幃?
  getPresets: (robotId: string, deviceName: string) => {
    return apiClient.get<{ list: { id: string | number; presetName: string }[]; code: number }>(`/ptz/${robotId}/presets`, { device_name: deviceName })
  }
}



// 闂佺妫勭€氼剟宕曞顓炵窞閻庨潧鎲＄粊鏌ユ煕韫囨碍鐝悽顖涙尦瀹?
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
  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绠洪柛鏇ㄥ亜閸撶厧顭块懜鍨稇闁割煈浜為幃?
  getCameraList: (robotId: string, signal?: AbortSignal) => {
    return apiClient.get<{ data: CameraInfo[]; request_id: string }>(`/cameras/${robotId}/list`, undefined, { signal })
  },
  // 闂佸憡鍑归崹鐗堟叏閳哄懎绠洪柛鏇ㄥ亜閸撶厧顭跨捄铏规憼缂佷緤绠撻弫宥夊锤缁€绂竢tc闂?
  startCameraStream: (robotId: string, camKey: string, useSubStream = false, signal?: AbortSignal) => {
    return apiClient.post<{ message: string; cam_key: string; stream_url: string; rtmp_push_url: string }>(
      `/cameras/${robotId}/stream/start`,
      { cam_key: camKey, use_sub_stream: useSubStream },
      { signal }
    )
  },
  // 闂佺顑嗙划宥夘敆濞戙垹绠洪柛鏇ㄥ亜閸撶厧顭跨捄铏规憼缂?
  stopCameraStream: (robotId: string, camKey: string) => {
    return apiClient.post<{ message: string }>(
      `/cameras/${robotId}/stream/stop`,
      { cam_key: camKey }
    )
  }
}

// 闂侀潻闄勫妯好瑰鈧顒勫炊閿旂瓔鍋ㄦ繛鎴炴尭椤戝牆霉閸ヮ剚鍎庣紒瀣仢瑜?
export const mapFileApi = {
  // 闂傚倸娲犻崑鎾绘偡閺囨碍顦风紒妤€鎳忓顏堟偩鐏炲墽鏆犻梺闈╅檮濠㈡ê霉濮椻偓瀵剟宕堕敂绛嬪仺闂佸憡甯楅〃澶愬Υ?
  MAP_FILES: ['tinyMap.pcd', 'gridMap.pgm', 'gridMap.yaml', 'gnss_origin.txt'],

  // 婵炴垶鎸搁鍫澝归崶顒€纭€闁哄洦宀搁崵瀣煕閿旇姤绶叉繛瀛橈耿瀵剟宕堕敂绛嬪仺
  downloadMapFile: async (robotIp: string, mapName: string, fileName: string): Promise<Blob | null> => {
    // 婵炶揪缍€濞夋洟寮妶澶嬪剮缂佸顑欓崵鐘绘偣娓氼垰鐏犵紒鍓佸仧閹秆勶紣娴ｅ憡鏆曢梺鑽ゅ仜濡妲愬纾慴ot_ip 闂?Vite(閻庢鍠掗崑鎾绘煕? / Nginx(闂佹眹鍨婚崰宥嗩殽? 闁荤姴娲╅褑銇愰崶顒€瑙﹂幖绮光偓鎵挎鏌熼鎸庣グ婵炴潙妫濆畷锝夊箣濠靛棛鍘掗柣搴ｆ暩閹虫挾鑺遍弻銉ュ珘闁告繂瀚悵銈吤?
    const url = `/download_file?remote_path=/root/dxr_data/map/${mapName}/${fileName}&robot_ip=${robotIp}`
    
    try {
      const response = await fetch(url, {
        method: 'GET'
      })
      
      if (!response.ok) {
        console.error(`[闂侀潻闄勫妯好瑰Ο鑽も枖閻庯綆鍘界粊鐧?婵犮垺鍎肩划鍓ф喆? ${fileName}, 闂佺粯顭堥崺鏍焵? ${response.status}`)
        return null
      }
      
      const blob = await response.blob()
      
      // 濠碘槅鍋€閸嬫捇鏌＄仦璇插姕婵″弶鎮傚畷銉╂晜鐠恒劎鎲柡澶屽仩濡嫰宕虹仦鍓ь洸?HTML 闂備焦瀵ч悷銊╊敋閵堝棎浜滈柣銏犳啞濡椼劑鏌ら弶鍨殭缂佹顦靛浼搭敍濠婂嫬鐒搁柣搴℃贡閸嬬偤寮搁崘鈺冾浄?
      if (blob.type.includes('text/html')) {
        console.error(`[闂侀潻闄勫妯好瑰Ο鑽も枖閻庯綆鍘界粊鐧?闂佽　鍋撻悹鍝勬惈閻?HTML 闂備焦瀵ч悷銊╊敋閵堝棎浜滈柣銏犳啞濡? ${fileName}`)
        return null
      }
      
      return blob
    } catch (error) {
      console.error(`[闂侀潻闄勫妯好瑰Ο鑽も枖閻庯綆鍘界粊鐧?闁荤姴娲弨閬嶆儑閺夋鍤曢柛灞炬皑閸? ${fileName}`, error)
      return null
    }
  },

  // 婵炴垶鎸搁鍫澝归崶顒€绠ラ柍褜鍓熷鍨緞婵犲啫瀣€闂佹悶鍎抽崑鎾诲几閸愨晝顩?
  downloadAllMapFiles: async (robotIp: string, mapName: string): Promise<Map<string, Blob>> => {
    const results = new Map<string, Blob>()

    for (const fileName of mapFileApi.MAP_FILES) {
      const blob = await mapFileApi.downloadMapFile(robotIp, mapName, fileName)
      if (blob) {
        results.set(fileName, blob)
      }
    }

    return results
  },

  // 婵炴垶鎸搁敃锝囨閸洖纭€闁哄洦宀搁崵瀣煕閿旇姤绶叉繛瀛橈耿瀵剟宕堕敂绛嬪仺
  uploadMapFile: async (robotIp: string, mapName: string, fileName: string, file: Blob): Promise<boolean> => {
    // 婵炶揪缍€濞夋洟寮妶澶嬪剮缂佸顑欓崵鐘绘偣娓氼垰鐏犵紒鍓佸仧閹秆勶紣娴ｅ憡鏆曢梺鑽ゅ仜濡妲愬纾慴ot_ip 闂?Vite(閻庢鍠掗崑鎾绘煕? / Nginx(闂佹眹鍨婚崰宥嗩殽? 闁荤姴娲╅褑銇愰崶顒€瑙﹂幖绮光偓鎵挎鏌熼鎸庣グ婵炴潙妫濆畷锝夊箣濠靛棛鍘掗柣搴ｆ暩閹虫挾鑺遍弻銉ュ珘闁告繂瀚悵銈吤?
    const remotePath = `/root/dxr_data/map/${mapName}`
    const url = `/upload_single_file?robot_ip=${robotIp}`

    const formData = new FormData()
    formData.append('file', file, fileName)
    formData.append('remote_path', remotePath)  // remote_path 婵炶揪绲剧划鍫㈡嫻?form data 闁诲孩绋掗〃鍡涱敊?

    console.log('婵炴垶鎸搁敃锝囨閸洖妫橀柛銉檮椤愪粙鎮归崶鐑芥闁?', {
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
        console.error(`婵炴垶鎸搁敃锝囨閸洖妫橀柛銉檮椤愯棄顭块幆鎵翱閻? ${fileName}, 闂佺粯顭堥崺鏍焵? ${response.status}`)
        const responseText = await response.text()
        console.error('闂佸憡绻傜粔瀵歌姳閺屻儱绀冮柛娑卞弾閸?', responseText)
        return false
      }
      console.log('trajectory upload success')
      return true
    } catch (error) {
      console.error(`婵炴垶鎸搁敃锝囨閸洖妫橀柛銉檮椤愯棄顭块幆鎵翱閻? ${fileName}`, error)
      return false
    }
  },

  // 婵炴垶鎸搁鍫澝归崶銊﹀闁靛鍔嶆慨澶愭煛閸屾碍鐭楁繛?
  downloadTrajectoryFile: async (trajectoryName: string, robotIp: string): Promise<Blob | null> => {
    // 婵炶揪缍€濞夋洟寮妶澶嬪剮缂佸顑欓崵鐘绘偣娓氼垰鐏犵紒鍓佸仧閹秆勶紣娴ｅ憡鏆曢梺鑽ゅ仜濡妲愬纾慴ot_ip 闂?Vite(閻庢鍠掗崑鎾绘煕? / Nginx(闂佹眹鍨婚崰宥嗩殽? 闁荤姴娲╅褑銇愰崶顒€瑙﹂幖绮光偓鎵挎鏌熼鎸庣グ婵炴潙妫濆畷锝夊箣濠靛棛鍘掗柣搴ｆ暩閹虫挾鑺遍弻銉ュ珘闁告繂瀚悵銈吤?
    const url = `/download_file?remote_path=/root/dxr_data/trajectory/${trajectoryName}/${trajectoryName}.txt&robot_ip=${robotIp}`
    try {
      const response = await fetch(url, { method: 'GET' })
      if (!response.ok) {
        console.error(`婵炴垶鎸搁鍫澝归崶銊﹀闁靛鍔嶆慨澶愭煛閸屾碍鐭楁繛鍡愬灪瀵板嫭娼忛銉? ${trajectoryName}, 闂佺粯顭堥崺鏍焵? ${response.status}`)
        return null
      }
      return await response.blob()
    } catch (error) {
      console.error(`婵炴垶鎸搁鍫澝归崶銊﹀闁靛鍔嶆慨澶愭煛閸屾碍鐭楁繛鍡愬灪瀵板嫭娼忛銉? ${trajectoryName}`, error)
      return null
    }
  }

}


