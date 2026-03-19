import { ref, reactive, readonly } from 'vue'
import { authApi, userApi, dockApi, droneApi, missionApi, alertApi, systemApi, deviceApi, roleApi, hmsApi, livestreamApi, waylineApi, permissionApi } from '../api/services'
import { apiClient } from '../api/config'
import { config, refreshEnvironmentConfig } from '../config/environment'
import type { User, Dock, Drone, Mission, Alert, Device, Role, HmsAlert, Permission } from '../types'
import { useDeviceStore } from '../stores/device'
import { setVideoStreams, setDefaultVideoType, cleanupOldVideoCache } from '../utils/videoCache'

// 闁荤喐鐟ュΛ婵嬨€傞崜浣虹＝闁规儳纾幗鐘电磼閻欏懐纾块柟?
const VIDEO_CACHE_KEY = 'video_devices_cache'
// const VIDEO_CACHE_VERSION_KEY = 'video_cache_version'

// 闁荤喐鐟ュΛ婵嬨€傞崜浣瑰闁诡垎灞拘ｆ繛锝呮礌閸撴繃瀵奸崨顖滅＜闁规儳顕埀?
interface VideoDeviceInfo {
  deviceSn: string
  deviceType: 'dock' | 'drone_visible' | 'drone_infrared'
  cameraIndex: string
  videoIndex: string
  videoId: string
  switchableVideoTypes: string[]
  lastUpdate: number
}

interface VideoCacheData {
  version: string
  devices: VideoDeviceInfo[]
  lastUpdate: number
}

// 缂傚倸鍊归幐鎼佹偤閵娧勫枂闁糕剝渚楅弳銉╂偣娴ｇ懓鍔ゆい锔诲墯缁岄亶鍩勯崘褏绀€
const cacheVideoDevices = (capacityData: any, dockSns: string[], droneSns: string[]) => {
  const videoDevices: VideoDeviceInfo[] = []
  const now = Date.now()
  
  console.log('閻庢鍠掗崑鎾斥攽椤旂⒈鍎戠紒鎲嬪閳ь剚绋掗…鍫ワ綖鐎ｎ偓绱ｉ柟杈剧秵閸熷骸顭跨捄鐑樼煑濞ｅ洤锕獮?..')
  
  if (capacityData.available_devices) {
    for (const device of capacityData.available_devices) {
      if (device.camera_list && device.camera_list.length > 0) {
        for (const camera of device.camera_list) {
          if (camera.video_list && camera.video_list.length > 0) {
            for (const video of camera.video_list) {
              const videoId = `${device.sn}/${camera.camera_index}/${video.video_index}`
              const switchableTypes = video.switchable_video_types || []
              
              // 闂佸憡甯囬崐鏍蓟閸モ晜濯奸柟顖嗗本校缂備緡鍋夐褔鎮?
              let deviceType: 'dock' | 'drone_visible' | 'drone_infrared'
              if (dockSns.includes(device.sn)) {
                deviceType = 'dock'
              } else if (droneSns.includes(device.sn)) {
                // 闂佸搫绉烽～澶婄暤娑旂瞼itchable_video_types闂佽桨妞掗崡鎶藉闯濞差亜绀嗛柕鍫濇閻掍粙鏌￠崟闈涚仩鐟滄媽灏欓幉瀛樻媴缁嬪灝杈呴柡澶嗘櫆钃辨俊鎻掓憸閻ヮ亪濮€閻欌偓濡?
                deviceType = switchableTypes.length > 2 ? 'drone_visible' : 'drone_infrared'
              } else {
                continue // 闁荤姴鎼悿鍥╂崲閸愵喖瀚夋い蹇撴閸欌偓闁荤姳鐒﹂崕鎶剿囬鍌滃暗閻犲洩灏欓埀?
              }
              
              videoDevices.push({
                deviceSn: device.sn,
                deviceType,
                cameraIndex: camera.camera_index,
                videoIndex: video.video_index,
                videoId,
                switchableVideoTypes: switchableTypes,
                lastUpdate: now
              })
              
              console.log(`缂傚倸鍊归幐鎼佹偤閵娧勫枂闁糕剝渚楅弳銉╂偣娴ｇ懓鍔ゆい? ${deviceType} - ${device.sn} - ${videoId} - types: ${switchableTypes.length}`)
            }
          }
        }
      }
    }
  }
  
  const cacheData: VideoCacheData = {
    version: '1.0',
    devices: videoDevices,
    lastUpdate: now
  }
  
  localStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(cacheData))
  console.log("Video devices cached: " + videoDevices.length)
  
  return videoDevices
}

// 闂佸吋鍎抽崲鑼躲亹閸モ晝纾介柟鎯х－閹界娀鏌ｉ妸銉ヮ伂妞ゎ偄顑嗛敍鎰板箣閿濆骸鏅繝銏ｆ硾濞诧絾绌辨繝鍥х畳?
const getCachedVideoDevices = (): VideoDeviceInfo[] => {
  const cacheStr = localStorage.getItem(VIDEO_CACHE_KEY)
  if (!cacheStr) {
    return []
  }
  
  try {
    const cacheData: VideoCacheData = JSON.parse(cacheStr)
    return cacheData.devices || []
  } catch (error) {
    console.error('闁荤喐鐟辩徊楣冩倵閻ｅ本鍠嗛柛鈩冧緱閺嗐儵鎮规担鐟板姢妞わ富鍓涚槐鎾诲箻瀹曞洦鎲兼繝銏″劶缁墽鎲?', error)
    return []
  }
}

// 濠碘槅鍋€閸嬫捇鏌＄仦璇插姢缂佹唻濡囬埀顒佺⊕钃辨俊鍙夋倐瀹曘儵鏁冮崒娑楃帛闁荤喐娲戦悞锕€煤閸ф妫?
const shouldUpdateVideoCache = (capacityData: any): boolean => {
  const cacheStr = localStorage.getItem(VIDEO_CACHE_KEY)
  if (!cacheStr) {
    console.log('No video cache found, refresh required')
    return true
  }
  
  try {
    const cacheData: VideoCacheData = JSON.parse(cacheStr)
    const cacheDeviceCount = cacheData.devices.length
    
    // 闁荤姳绶ょ槐鏇㈡偩閺勫繈浜归柟鎯у暱椤ゅ崒apacity闂佽桨鑳舵晶妤€鐣垫担鍦枖妞ゆ挾濮甸悾閬嶆偡濞嗗繑顥㈡い锝呭閹峰骞嗚濡茬敻鏌℃担宄板祮闁?
    let currentDeviceCount = 0
    if (capacityData.available_devices) {
      for (const device of capacityData.available_devices) {
        if (device.camera_list) {
          for (const camera of device.camera_list) {
            if (camera.video_list) {
              currentDeviceCount += camera.video_list.length
            }
          }
        }
      }
    }
    
    if (cacheDeviceCount !== currentDeviceCount) {
      console.log("Video device count changed: cache=" + cacheDeviceCount + ", current=" + currentDeviceCount)
      return true
    }
    
    // 濠碘槅鍋€閸嬫捇鏌＄仦璇插姕婵＄偛鍊垮鑽も偓娑櫳戠瑧闂佸憡鐔粻鎺旂矓鐎涙ɑ浜?0闂佸憡甯掑Λ婵嬪箰?
    const thirtyMinutes = 30 * 60 * 1000
    if (Date.now() - cacheData.lastUpdate > thirtyMinutes) {
      console.log('Video cache expired, refresh required')
      return true
    }
    
    console.log('Video cache is valid')
    return false
  } catch (error) {
    console.error('濠碘槅鍋€閸嬫捇鏌＄仦璇插姤妞ゎ偄顑嗛敍鎰板箣閻橀潧顦╅柣搴㈢⊕閿氶柕鍥ㄥ灩閹?', error)
    return true
  }
}

// 闂佸搫绉烽～澶婄暤娴ｈ櫣灏甸悹鍥皺閳ь剛鍏橀幊銏犵暋閺夎法鎮奸梺鍝勭墐閸嬫挸霉閿濆懐鏋冩い顐㈩儐閿涙劙骞嬮敐搴℃櫗婵?
const getBestVideoDevice = (deviceType: 'dock' | 'drone_visible' | 'drone_infrared'): VideoDeviceInfo | null => {
  const cachedDevices = getCachedVideoDevices()
  const devices = cachedDevices.filter(device => device.deviceType === deviceType)
  
  if (devices.length === 0) {
    console.warn("No video device found for type: " + deviceType)
    return null
  }
  
  // 婵炴潙鍚嬮敋闁告ɑ鐩弻鍛緞鐎ｎ亶浠磗witchable_video_types闂佸搫鐗冮崑鎾愁熆閼稿灚鐨戞繛鍫熷灩閹峰骞嗚濡?
  devices.sort((a, b) => b.switchableVideoTypes.length - a.switchableVideoTypes.length)
  
  console.log("Selected best " + deviceType + " video device:", devices[0])
  return devices[0]
}
export function useAuth() {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 闂佸憡甯楃换鍌烇綖閹版澘绀岄柡宥冨妽椤ρ兠归悩鑼崗ocalStorage闂佽鍘归崹褰捤囬弻銉﹀仺闁靛绠戦悡鏇炃庨崶锝呭⒉濞?
  const initAuth = () => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    
    if (savedUser && savedToken) {
      user.value = JSON.parse(savedUser)
      token.value = savedToken
      apiClient.setAuthToken(savedToken)
    }
  }



  // 闂佽皫鍡╁殭缂?
  const login = async (loginData: { username: string; password: string }) => {
    loading.value = true
    error.value = null
    
    try {
      // 閻庢鍠栭幖顐﹀春濡ゅ懎绀嗛梺鍨儐閻撯偓闂佺粯绮犻崹浼淬€傞妸鈺傜厐鐎广儱娲ㄩ弸鍌炴煥濞戞鐏遍柍銉ι戠粚鍗炩攽閸涱厸鏋忛梺娲绘娇閸斿秴銆掗崼鏇炴闁规鍠楅悾閬嶆煟濠婂骸鐏犳い锝冨妿閹峰宕滆閺?
      const currentConfig = refreshEnvironmentConfig()
      console.log('濡絽鍟弳?闂佽皫鍡╁殭缂傚秴绉瑰顕€宕滄担鍝ョ暰婵犫拃鍐ㄦ殻闁告ǜ鍊楃槐鏃堫敋閳ь剟鎮板▎鎴炲珰?')
      console.log('- 閻熸粎澧楅幐鍛婃櫠閻樼粯鍋濇い鏍ㄥ嚬閺嗘棃鏌涘▎鎰惰€块柛?', import.meta.env.VITE_APP_ENVIRONMENT)
      console.log('- 閻熸粎澧楅幐鍛婃櫠閻樺灚鍠嗛柛鈩冧緱閺嗐儵姊洪弶璺ㄐら柣?', currentConfig.video.webrtcDomain)
      
      const response = await authApi.login(loginData.username, loginData.password)
      const { access_token, token_type } = response
      
      console.log('闂佽皫鍡╁殭缂傚秴绉瑰畷顐㈩吋閸涱垰鐣?', response)
      console.log('闂佸吋鍎抽崲鑼躲亹閸ヮ剙绀嗛柟娈垮枟閻ｇ湜oken:', access_token)
      console.log('token缂備緡鍋夐褔鎮?', token_type)
      
      // 闁荤姳绀佹晶浠嬫偪閸℃瑦濯奸柕鍫濈墢濡插澅oken
      apiClient.setAuthToken(access_token)
      
      // 闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍋ㄩ柕濠忕畱閻撴洖菐閸ワ絽澧插ù?
      const userResponse = await authApi.getCurrentUser()
      console.log('闂佹椿娼块崝宥夊春濞戞瑧鈹嶉柍鈺佸暕缁辨牠鏌涘┑鍡櫺㈢紒?', userResponse)
      console.log('闂佸憡绻傜粔瀵歌姳閼碱剛灏甸悹鍥皺閳?', typeof userResponse)
      console.log('闂佸憡绻傜粔瀵歌姳閺屻儲鐓?', Object.keys(userResponse))
      
      // 闁诲繐绻戠换鍡涙儊椤栨稓鈻旂€广儱鎳忛崐閬嶆煟閵娿儱顏╅柟濂告敱閹棃寮崒婊勫皾闂?
      let userData: any
      if (userResponse.data) {
        userData = userResponse.data
        console.log('Login response.data:', response.data)
      } else {
        userData = userResponse
        console.log('Login response is direct object')
      }
      
      console.log('闂佹椿娼块崝宥夊春濞戙垹鏋侀柣妤€鐗嗙粊?', userData)
      console.log('workspace_id:', userData?.workspace_id)
      
      user.value = userData
      token.value = access_token
      
      // 婵烇絽娲︾换鍌炴偤閵娾晛绀嗛柣褏纾alStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', access_token)
      
      // 缂傚倸鍊归幐鎼佹偤閳虹rkspace_id
      if (userData?.workspace_id) {
        localStorage.setItem('workspace_id', userData.workspace_id)
        console.log('闂佽皫鍡╁殭缂傚秴绉瑰顔剧矓濠曠晢kspace_id閻庤鐡曠亸娆戞閿旈敮鍋?', userData.workspace_id)
      } else {
        console.warn('闂佹椿娼块崝宥夊春濞戙垹鏋侀柣妤€鐗嗙粊锕€鈽夐幙鍐ㄥ箺闁汇儱鎳樺鍨緞鐎ｎ亶妫熼梺鍛婂笧濞堫柕rkspace_id:', userData)
      }
      
      console.log('localStorage婵炴垶鎼╅崢鎯р枔閹插潵ken:', localStorage.getItem('token'))
      
      
      return { user: userData, token: access_token }
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佽皫鍡╁殭闁?
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.error('闂佽皫鍡╁殭闁搞倗鎳燩I闁荤姴顑呴崯浼村极閵堝棗绶為弶鍫亯琚?', err)
    } finally {
      // 濠电偞鎸搁幊妯衡枍鎼淬劌瀚夋い鎺嗗亾婵犫偓閹绢喗鍋愰柤鍝ヮ暯閸?
      user.value = null
      token.value = null
      apiClient.clearAuthToken()
      
      // 濠电偞鎸搁幊妯衡枍瀹告仜calStorage
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ亗浜归柟鎯у暱椤ゅ懘鏌ｉ～顒€濡介柛鈺傜⊕缁岄亶鍩勯崘褏绀€
  const getCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser()
      user.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch current user'
      throw err
    }
  }

  return {
    user: readonly(user),
    token: readonly(token),
    loading: readonly(loading),
    error: readonly(error),
    login,
    logout,
    getCurrentUser,
    initAuth
  }
}

// 闂佸搫鐗嗛幖顐﹀矗閹寸姷涓嶉柨娑樺閸婄偤鏌ｉ妸銉ヮ伀缂侇喖绉瑰畷銉╁醇濠靛牏顢匒PI
export function useDocks() {
  const docks = ref<Dock[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙瀚夐柛婵嗗瑜板倿鏌涢幒鎿冩畽闁?
  const fetchDocks = async (params?: { page?: number; pageSize?: number; status?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await dockApi.getDocks(params)
      docks.value = response.data.items
      pagination.total = response.data.total
      pagination.page = response.data.page
      pagination.pageSize = response.data.pageSize
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to update current user'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣煛閸繃鎯堥柛?
  const fetchDock = async (id: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await dockApi.getDock(id)
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch all users'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    docks: readonly(docks),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchDocks,
    fetchDock
  }
}

// 闂佸搫鍟版慨鍐残ф径鎰珘闁惧繗顕栭崥鈧梺鑽ゅ仜濡稑鈻撻幋鐘电＜闁告洦鍋呴崐銈団偓娈垮枛缁€璉
export function useDrones() {
  const drones = ref<Drone[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绫嶉柣妯块哺閻粙鏌￠崼婵囨儓闁割煈浜為幃?
  const fetchDrones = async (params?: { page?: number; pageSize?: number; status?: string; dockId?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await droneApi.getDrones(params)
      drones.value = response.data.items
      pagination.total = response.data.total
      pagination.page = response.data.page
      pagination.pageSize = response.data.pageSize
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch data list'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佺鐭囬崘銊у幀闂佸搫鍟版慨鍐残ф径鎰珘濡わ附瀵у畷鍐差渻?
  const takeoff = async (droneId: string) => {
    try {
      const response = await droneApi.takeoff(droneId)
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to create data'
      throw err
    }
  }

  // 闂佺鐭囬崘銊у幀闂佸搫鍟版慨鍐残ф径鎰珘婵炲樊浜濋鏍煢閳?
  const land = async (droneId: string) => {
    try {
      const response = await droneApi.land(droneId)
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to update data'
      throw err
    }
  }

  return {
    drones: readonly(drones),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchDrones,
    takeoff,
    land
  }
}

// 婵炲濮鹃褎鎱ㄩ悢铏逛笉闁挎稑瀚崐鐐烘煟閵娿儱顏紒顔肩Ч瀹曘儵宕煎┑鍫㈩攨API
export function useMissions() {
  const missions = ref<Mission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  })

  // 闂佸吋鍎抽崲鑼躲亹閸ャ劎顩烽悹鍥ㄥ絻椤倝鏌涢幒鎿冩畽闁?
  const fetchMissions = async (params?: { page?: number; pageSize?: number; status?: string; droneId?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await missionApi.getMissions(params)
      missions.value = response.data.items
      pagination.total = response.data.total
      pagination.page = response.data.page
      pagination.pageSize = response.data.pageSize
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch robots'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸憡甯楃粙鎴犵磽閹惧顩烽悹鍥ㄥ絻椤?
  const createMission = async (missionData: Partial<Mission>) => {
    try {
      const response = await missionApi.createMission(missionData)
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to create robot'
      throw err
    }
  }

  // 闂佸憡鍑归崹鐗堟叏閳哄倻顩烽悹鍥ㄥ絻椤?
  const startMission = async (missionId: string) => {
    try {
      const response = await missionApi.startMission(missionId)
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to update robot'
      throw err
    }
  }

  return {
    missions: readonly(missions),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchMissions,
    createMission,
    startMission
  }
}

// 闂佺缈伴崕鎾敆閻旇櫣涓嶉柨娑樺閸婄偤鏌ｉ妸銉ヮ伀缂侇喖绉瑰畷銉╁醇濠靛牏顢匒PI
export function useAlerts() {
  const alerts = ref<Alert[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
  })

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绠柕澶樼厛閸斿懘鏌涢幒鎿冩畽闁?
  const fetchAlerts = async (params?: { page?: number; pageSize?: number; status?: string; deviceType?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await alertApi.getAlerts(params)
      alerts.value = response.data.items
      pagination.total = response.data.total
      pagination.page = response.data.page
      pagination.pageSize = response.data.pageSize
      
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch tasks'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸搫绉村ú鈺咁敊閸ヮ剙绠柕澶樼厛閸斿懎鈽夐幘铏儓闁告埊绱曢幏?
  const markAsRead = async (alertId: string) => {
    try {
      const response = await alertApi.markAsRead(alertId)
      // 闂佸搫娲ら悺銊╁蓟婵犲洤瀚夋い鎺嗗亾婵犫偓閹绢喗鍋愰柤鍝ヮ暯閸?
      const alert = alerts.value.find(a => a.id === alertId)
      if (alert) {
        alert.status = 'read'
      }
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to create task'
      throw err
    }
  }

  return {
    alerts: readonly(alerts),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchAlerts,
    markAsRead
  }
}

// 缂備緡鍨靛畷鐢靛垝濞差亝鍋愰柤鍝ヮ暯閸嬫挻鎷呴悜妯兼殸缂傚倷绀佺€氼剟骞冩惔鈽嗗殨鐎点倕妲
export function useSystem() {
  const systemStatus = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 闂佸吋鍎抽崲鑼躲亹閸モ晛瀵查柤濮愬€楅崺鐘绘煟濡灝鐓愰柍?
  const fetchSystemStatus = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await systemApi.getSystemStatus()
      systemStatus.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch task details'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    systemStatus: readonly(systemStatus),
    loading: readonly(loading),
    error: readonly(error),
    fetchSystemStatus
  }
} 

// 闁荤姳鐒﹂崕鎶剿囬鍌滀笉闁挎稑瀚崐鐐烘煟閵娿儱顏紒顔肩Ч瀹曘儵宕煎┑鍫㈩攨API
export function useDevices() {
  const devices = ref<Device[]>([])
  const docks = ref<Device[]>([])
  const drones = ref<Device[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 缂傚倸鍊归幐鎼佹偤閵娧勫闁诡垎灞拘ｆ繛锝呮礌閸撴繃瀵奸崨鏉戠闁绘鐗婇幏閬嶆煕?
  const cacheDeviceSns = (deviceList: Device[]) => {
    // 闂佸搫绉烽～澶婄暤娑斺暋vice_type闂佸憡鐗曢幖顐﹀垂鎼淬劌瀚夐柛婵嗗缁ㄦ岸鏌涘鍐╂拱婵☆偁鍊栫粋宥夋倻濡崵鐨?
    // device_type=3 闂佸搫瀚烽崹鍗炩攦閳ь剟鏌涢敂鎯х殤缂佽鲸绱砮vice_type=100 闂佸搫瀚烽崹鍗炍涢妶鍡欘洸闁绘垶蓱缁?
    const dockSns = deviceList.filter(device => {
      return device.device_type_info?.device_type === 3
    }).map(device => device.device_sn)
    
    const droneSns = deviceList.filter(device => {
      return device.device_type_info?.device_type === 100
    }).map(device => device.device_sn)
    
    // 婵炴垶鎸鹃崕銈呂涢妶鍡欘洸闁绘垶蓱缁ㄦ岸鎮规担鐟板姢妞わ富鍓欒彁閻犲洦褰冮～?zoom_factor 闁诲孩绋掗〃鍡涱敊?
    const enhancedDeviceList = deviceList.map(device => {
      if (device.device_type_info?.device_type === 100) {
        // 闂佸搫鍟版慨鍐残ф径鎰珘濡わ附顑欓崯搴☆熆鐠虹儤绁紒杈ㄧ箓鑿愰悹鍥ㄥ絻椤?zoom_factor 闁诲孩绋掗〃鍡涱敊?
        return {
          ...device,
          zoom_factor: device.zoom_factor || 1 // 婵帗绋掗…鍫ヮ敇婵犳艾纾归梻鍌滎棎缁€?
        }
      }
      return device
    })
    
    localStorage.setItem('cached_dock_sns', JSON.stringify(dockSns))
    localStorage.setItem('cached_drone_sns', JSON.stringify(droneSns))
    
    // 缂傚倸鍊归幐鎼佹偤閵娧€鍋撻悷鐗堟拱闁哄棴缍侀幆鍐礋椤曞懎鏅繝銏ｆ硾濞诧絾绌辨繝鍥х畳妞ゆ牓鍊楃粈鍕煕閺嵮勫櫣闁?zoom_factor闂?
    localStorage.setItem('cached_devices', JSON.stringify(enhancedDeviceList))
    
    console.log('闁荤姳鐒﹂崕鎶剿囬浣衡攳闁斥晛鍟╃槐鏍偓瑙勭摃鐏忔瑧妲愰敂閿亾濞戞顏堝春瀹€鍕珘妞ゆ巻鍋撴繝鈧?', { 
      dockSns, 
      droneSns, 
      totalDevices: enhancedDeviceList.length 
    })
  }

  // 闂佸搫娲ら悺銊╁蓟婵犲洤绫嶉柣妯块哺閻粙鏌￠崼锝嗩仩婵?zoom_factor 濡ょ姷鍋犲▔娑㈠箖閹炬剚娼?camera_zoom_factor
  const updateDroneZoomFactor = (deviceSn: string, zoomFactor: number) => {
    const devices = getCachedDevices()
    const deviceIndex = devices.findIndex((device: Device) => device.device_sn === deviceSn)
    
    if (deviceIndex !== -1) {
      // 闂佸搫娲ら悺銊╁蓟婵犲嫭濯奸柟顖嗗本校缂傚倸鍊归幐鎼佹偤閵婏妇鈻旀い鎾跺У閻?zoom_factor
      devices[deviceIndex] = {
        ...devices[deviceIndex],
        zoom_factor: zoomFactor
      }
      
      // 闂備焦褰冪粔鐢稿蓟婵犲嫮纾介柟鎯х－閹界娀鎮规担鐟板姢妞わ富鍓氱粚閬嶅焺閸愌呯
      localStorage.setItem('cached_devices', JSON.stringify(devices))
      
      // 闂佸憡鑹鹃張顒勵敆閻愬搫鍗抽悗娑櫳戦悡鈧?camera_zoom_factor
      localStorage.setItem('camera_zoom_factor', zoomFactor.toString())
      
      console.log("Updated zoom_factor for " + deviceSn + ": " + zoomFactor)
      return true
    }
    
    console.warn("Device not found in cache: " + deviceSn)
    return false
  }

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绫嶉柣妯块哺閻粙鏌￠崼锝嗩仩婵?zoom_factor
  const getDroneZoomFactor = (deviceSn: string): number => {
    const devices = getCachedDevices()
    const device = devices.find((device: Device) => device.device_sn === deviceSn)
    
    if (device && (device as any).zoom_factor) {
      return (device as any).zoom_factor
    }
    
    // 婵犵鈧啿鈧綊鎮樻径濞炬煢闁斥晛鍟粻鎺楁煙閸偄鍔ら柛鈺佺焸閺佸秶浠﹂懖鈺冪厾 camera_zoom_factor 闂佸吋鍎抽崲鑼躲亹?
    const cachedZoomFactor = localStorage.getItem('camera_zoom_factor')
    if (cachedZoomFactor) {
      const factor = parseInt(cachedZoomFactor, 10)
      return isNaN(factor) ? 1 : Math.max(1, Math.min(200, factor))
    }
    
    return 1 // 婵帗绋掗…鍫ヮ敇婵犳艾纾?
  }

  // 濠电偞娼欓鍫ユ儊椤栫偛绀勯柤鎭掑劜濞堝爼鏌ㄥ☉娆忓摵闁绘稒鐟ч幏?zoom_factor 闂佸憡鑹鹃張顒勵敆閻愬搫绀夐柣鏃囶嚙閸?
  const testZoomFactorSync = () => {
    const devices = getCachedDevices()
    const droneDevices = devices.filter((device: Device) => 
      device.device_type_info?.device_type === 100
    )
    
    console.log('=== Zoom Factor Sync Check ===')
    console.log('Drone device count:', droneDevices.length)
    
    droneDevices.forEach((device: Device) => {
      const cachedZoomFactor = localStorage.getItem('camera_zoom_factor')
      const deviceZoomFactor = (device as any).zoom_factor || 1
      
      console.log("Device " + device.device_sn + ":")
      console.log("  - cached_devices zoom_factor: " + deviceZoomFactor)
      console.log("  - camera_zoom_factor: " + cachedZoomFactor)
      console.log("  - sync status: " + (deviceZoomFactor === parseInt(cachedZoomFactor || "1", 10) ? "OK" : "MISMATCH"))
    })
  }

  // 婵炲濮寸€涒晛锕㈡导鏉戞嵍闁规鍠氭径鍕倵濞戞瑯鐒炬鐐茬箻瀹曪綁寮介澶婃櫗婵犮垼娉涘Σ銕?
  const getCachedDeviceSns = () => {
    const dockSns = JSON.parse(localStorage.getItem('cached_dock_sns') || '[]')
    const droneSns = JSON.parse(localStorage.getItem('cached_drone_sns') || '[]')
    return { dockSns, droneSns }
  }

  // 婵炲濮寸€涒晛锕㈡导鏉戞嵍闁规鍠氭径鍕倵濞戞瑯鐒炬鐐茬箻瀹曪綁寮借閺嗘岸鏌℃担渚妞ゆ梹娲樺鍕炊閿旇法绠氶梺?
  const getCachedDevices = () => {
    const devices = JSON.parse(localStorage.getItem('cached_devices') || '[]')
    return devices
  }

  // 闂佸搫绉烽～澶婄暤娴ｇ儤濯奸柟顖嗗本校SN婵炲濮村ù椋庢閿旈敮鍋撳☉娆樼劸妤犵偛绻樺畷锝夊冀椤掑鏅繝銏ｆ硾濞诧絾绌辨繝鍥х畳?
  const getCachedDeviceBySn = (deviceSn: string) => {
    const devices = getCachedDevices()
    return devices.find((device: Device) => device.device_sn === deviceSn)
  }

  const getCachedWorkspaceId = () => {
    return localStorage.getItem('workspace_id')
  }

  // 闂佸吋鍎抽崲鑼躲亹閸モ晜濯奸柟顖嗗本校闂佸憡甯楅〃澶愬Υ?
  const fetchDevices = async (params?: { skip?: number; limit?: number; keyword?: string }) => {
    loading.value = true
    error.value = null
    
    console.log('useDevices - fetching device list')
    
    try {
      const response = await deviceApi.getDevices(params || { skip: 0, limit: 100 })
      console.log('useDevices - device response:', response)
      devices.value = response
      
      // 闂佸憡甯掑Λ娑⑩€栭崶顒€瀚夐柛婵嗗缁ㄦ岸鏌涘鍐╂拱婵☆偁鍊栫粋宥夋倻濡崵鐨?
      docks.value = response.filter(device => device.child_sn !== '')
      drones.value = response.filter(device => device.child_sn === '')
      
      console.log('useDevices - docks count:', docks.value.length)
      console.log('useDevices - drones count:', drones.value.length)
      
      // 缂傚倸鍊归幐鎼佹偤閵娧勫闁诡垎灞拘N闂佸憡甯炴晶妤€锕㈡导鏉戞嵍?
      cacheDeviceSns(response)
      
      return response
    } catch (err: any) {
      // 闂佸憡鐟禍婊冿耿椤忓牊顥堥柣鎰暩缁夊湱绱撴担鍦煉闁轰礁锕﹂幏鐘活敍濞戞瑯妲梺鍝勫婢т粙濡靛鑸电叆婵炲棙甯╅崵鏍庨崶锝呭⒉濞?
      if (!(err instanceof TypeError && err.message.includes('Failed to fetch'))) {
        console.error('useDevices - fetch failed:', err)
      }
      error.value = err.message || 'Failed to fetch tracking records'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙瀚夐柛婵嗗缁ㄦ岸鏌涢幒鎿冩畽闁?
  const getDocks = () => {
    return docks.value
  }

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绫嶉柣妯块哺閻粙鏌￠崼婵囨儓闁割煈浜為幃?
  const getDrones = () => {
    return drones.value
  }

  // 闂佸搫绉烽～澶婄暤娴ｇ儤濯奸柟顖嗗本校SN闂佸吋鍎抽崲鑼躲亹閸モ晜濯奸柟顖嗗本校
  const getDeviceBySn = (deviceSn: string) => {
    return devices.value.find(device => device.device_sn === deviceSn)
  }

  // 闁荤姳绀佹晶浠嬫偪閸℃瑦濯奸柟顖嗗本校闂佸憡甯楅〃澶愬Υ?
  const setDevices = (deviceList: Device[]) => {
    devices.value = deviceList
  }

  return {
    devices: readonly(devices),
    loading: readonly(loading),
    error: readonly(error),
    fetchDevices,
    getDocks,
    getDrones,
    getDeviceBySn,
    setDevices,
    cacheDeviceSns,
    getCachedDeviceSns,
    getCachedDevices,
    getCachedDeviceBySn,
    getCachedWorkspaceId,
    updateDroneZoomFactor,
    getDroneZoomFactor,
    testZoomFactorSync
  }
} 

// 闂佹椿娼块崝宥夊春濞戞氨涓嶉柨娑樺閸婄偤鏌ｉ妸銉ヮ伀缂侇喖绉瑰畷銉╁醇濠靛牏顢匒PI
export function useUsers() {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍋ㄩ柕濠忕畱閻撴洟鏌涢幒鎿冩畽闁?
  const fetchUsers = async (params?: { skip?: number; limit?: number; search?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.getUsers(params)
      users.value = response
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch role list'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸憡甯楃粙鎴犵磽閹剧粯鍋ㄩ柕濠忕畱閻?
  const createUser = async (userData: { username: string; email?: string; full_name?: string; password: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.createUser(userData)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to create role'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 婵炴垶鎹佸▍锝夊极閵堝绠ｇ€瑰嫭婢橀悗濠氭⒑閺夎法啸妞ゎ偅顨婇幊?
  const assignUserRole = async (userId: number, roleId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.assignRole(userId, roleId)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update role'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸憡甯炴繛鈧繛鍛叄閹粙濡搁敃鈧悡鏇㈡偡濞嗘劕绗╁?
  const removeUserRole = async (userId: number, roleId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.removeRole(userId, roleId)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to delete role'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸憡鑹鹃張顒勵敆閻愬搫鍗抽悗娑櫳戦悡鈧梺娲绘娇閸斿秹宕哄☉姘枂闁圭儤娲栭ˉ?
  const syncUserRole = async (userId: number, roleIds: number[]) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.syncUserRole(userId, roleIds)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to configure role permissions'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸搫娲ら悺銊╁蓟婵犲洦鍋ㄩ柕濠忕畱閻?
  const updateUser = async (id: string | number, userData: { username?: string; email?: string; full_name?: string; password?: string; is_active?: boolean }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.updateUser(id, userData)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch permission list'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸憡甯炴繛鈧繛鍛叄閹粙濡搁敃鈧悡?
  const deleteUser = async (id: string | number) => {
    loading.value = true
    error.value = null
    
    try {
      await userApi.deleteUser(id)
    } catch (err: any) {
      error.value = err.message || 'Failed to add permission'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣煟椤剙濡介柛?
  const getUser = async (id: string | number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.getUser(id)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update permission list'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ?????????
  const syncUserRobots = async (userId: number, robotIds: number[]) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await userApi.syncUserRobots(userId, robotIds)
      return response
    } catch (err: any) {
      error.value = err.message || '???????'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users: readonly(users),
    loading: readonly(loading),
    error: readonly(error),
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUser,
    assignUserRole,
    removeUserRole,
    syncUserRole,
    syncUserRobots
  }
} 

// 闁荤喐鐟︾敮鐔哥珶婵犲嫮涓嶉柨娑樺閸婄偤鏌ｉ妸銉ヮ伀缂侇喖绉瑰畷銉╁醇濠靛牏顢匒PI
export function useRoles() {
  const roles = ref<Role[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 闂佸吋鍎抽崲鑼躲亹閸モ晜鍠嗛柟鐑樻礀椤ュ繘鏌涢幒鎿冩畽闁?
  const fetchRoles = async (params?: { skip?: number; limit?: number; search?: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await roleApi.getRoles(params)
      roles.value = response
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch user list'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸憡甯楃粙鎴犵磽閹捐埖鍠嗛柟鐑樻礀椤?
  const createRole = async (roleData: { role_name: string; role_code: string; description: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await roleApi.createRole(roleData)
      // 闂備焦褰冪粔鐢稿蓟婵犲洦鍤旂€瑰嫭婢樼徊鍧楁偡濞嗘劕绗╁鐟帮躬瀹曟艾螖閸曗斁鍋?
      await fetchRoles()
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to create user'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸搫娲ら悺銊╁蓟婵犲嫭鍠嗛柟鐑樻礀椤?
  const updateRole = async (id: string | number, roleData: { role_name: string; role_code: string; description: string }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await roleApi.updateRole(id, roleData)
      // 闂備焦褰冪粔鐢稿蓟婵犲洦鍤旂€瑰嫭婢樼徊鍧楁偡濞嗘劕绗╁鐟帮躬瀹曟艾螖閸曗斁鍋?
      await fetchRoles()
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to update user'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸憡甯炴繛鈧繛鍛捣閹叉挳骞掗弴鐑嗘
  const deleteRole = async (id: string | number) => {
    loading.value = true
    error.value = null
    
    try {
      await roleApi.deleteRole(id)
      // 闂備焦褰冪粔鐢稿蓟婵犲洦鍤旂€瑰嫭婢樼徊鍧楁偡濞嗘劕绗╁鐟帮躬瀹曟艾螖閸曗斁鍋?
      await fetchRoles()
    } catch (err: any) {
      error.value = err.message || 'Failed to delete user'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙纭€闁哄洦宀搁崵瀣偡濞嗘劕绗╁?
  const getRole = async (id: string | number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await roleApi.getRole(id)
      return response
    } catch (err: any) {
      error.value = err.message || 'Failed to assign user roles'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateRolePermissions = async (id: number, permissionIds: number[]) => {
    loading.value = true
    error.value = null

    try {
      const response = await roleApi.updateRolePermissions(id, { permission_ids: permissionIds })
      await fetchRoles()
      return response
    } catch (err: any) {
      error.value = err.message || '????????'
      throw err
    } finally {
      loading.value = false
    }
  }


  return {
    roles: readonly(roles),
    loading: readonly(loading),
    error: readonly(error),
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    getRole,
    updateRolePermissions
  }
}

// HMS闂佺缈伴崕鎾敆閻旂厧绫嶉柕澶堝劤缁犲爼鏌ｉ妸銉ヮ伀缂侇喖绉瑰畷銉╁醇濠靛牏顢匒PI
export function useHmsAlerts() {
  const hmsAlerts = ref<HmsAlert[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 闂佸吋鍎抽崲鑼躲亹閸モ晜濯奸柟顖嗗本校闂佹眹鍔岄崵妗礢闂佺缈伴崕鎾敆閻旂厧绫嶉柕澶堝劤缁?
  const fetchDeviceHms = async (deviceSn: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await hmsApi.getDeviceHms(deviceSn)
      hmsAlerts.value = response
      return response
    } catch (err: any) {
      console.error('HMS API闁荤姴顑呴崯浼村极閵堝棗绶為弶鍫亯琚?', err)
      error.value = err.message || 'Failed to fetch point tasks'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闁荤姳绀佹晶浠嬫偪閸℃稑绠ラ柍褜鍓熷鍨緞鐎ｎ€捇鎮归埀顒勬晜閼恒儲顔嶉梺?
  const setAllAlerts = (alerts: HmsAlert[]) => {
    hmsAlerts.value = alerts
  }

  return {
    hmsAlerts: readonly(hmsAlerts),
    loading: readonly(loading),
    error: readonly(error),
    fetchDeviceHms,
    setAllAlerts
  }
}

// 闂佸搫顦崯鏉戭瀶濞差亝鍎庣紒瀣仢瑜扮娀鏌ｉ妸銉ヮ伀缂侇喖绉瑰畷銉╁醇濠靛牏顢匒PI
export function usePermissions() {
  const permissions = ref<Permission[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剙绠ラ柍褜鍓熷鍨緞鐎ｎ偆绉梻?
  const fetchAllPermissions = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await permissionApi.getAllPermissions()
      permissions.value = response
      return response
    } catch (err: any) {
      console.error('闂佸吋鍎抽崲鑼躲亹閸ヮ剙绾ч柛鎰靛枟椤庢瑩鏌涢幒鎿冩畽闁靛棗鍟鍕綇椤愩儛?', err)
      error.value = err.message || 'Failed to fetch wayline jobs'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍋ㄩ柕濠忕畱閻撴洟鏌℃径濠傛殻婵?
  const fetchUserPermissions = async (userId: number) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await permissionApi.getUserPermissions(userId)
      return response
    } catch (err: any) {
      console.error('闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍋ㄩ柕濠忕畱閻撴洟鏌℃径濠傛殻婵″墽鍎ゅ鍕綇椤愩儛?', err)
      error.value = err.message || 'Failed to fetch wayline files'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    permissions: readonly(permissions),
    loading: readonly(loading),
    error: readonly(error),
    fetchAllPermissions,
    fetchUserPermissions
  }
}

// 婵炲濮鹃褎鎱ㄩ悢鐑樺闁哄娉曠粔鍧楁煟閳哄喚鐒鹃柛娅诲洦鍎嶉柛鏇ㄥ幘閻鏌涘顒傚缂侀硸鎼癙I
export function useWaylineJobs() {
  const jobs = ref<any[]>([])
  const waylineFiles = ref<any[]>([])
  const waylineDetail = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    page_size: 10,
    total: 0,
    pages: 0
  })

  const fetchJobs = async (workspaceId: string, params?: {
    page?: number
    page_size?: number
    status?: number
    task_type?: number
    wayline_type?: number
    file_id?: string
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.getJobs(workspaceId, params)
      jobs.value = response.data.data
      pagination.value = response.data.pagination
      console.log('婵炲濮鹃褎鎱ㄩ悢鐑樺闁哄娉曠粔鍧楁煠閹冩Щ鐟滄澘娲獮瀣箛椤掆偓椤?', response)
    } catch (err) {
      console.error('闂佸吋鍎抽崲鑼躲亹閸ャ劎顩烽悹鍥ㄥ絻椤倝鎮规担瑙勭凡缂傚秴绉靛鍕綇椤愩儛?', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch wayline details'
    } finally {
      loading.value = false
    }
  }

  const fetchWaylineFiles = async (workspaceId: string, params?: {
    page?: number
    page_size?: number
    name?: string
  }) => {
    try {
      const response = await waylineApi.getWaylineFiles(workspaceId, params)
      waylineFiles.value = response.data.data
      console.log('闂佺厧澹婃禍鐐哄吹鎼淬劌妫橀柛銉檮椤愪粙鏌ら幆褍妲荤憸鏉挎喘楠炲骞囬鈧～?', response)
      return response.data.data
    } catch (err) {
      console.error('闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍤嬫い蹇撴濞堢娀鏌￠崒姘煑婵炲棎鍨哄鍕綇椤愩儛?', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch wayline progress'
      throw err
    }
  }

  const fetchWaylineDetail = async (workspaceId: string, waylineId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.getWaylineDetail(workspaceId, waylineId)
      waylineDetail.value = response.data
      console.log('闂佺厧澹婃禍鐐哄吹鎼达絾瀚氶柨鏃囨閸撲即鏌ら幆褍妲荤憸鏉挎喘楠炲骞囬鈧～?', response)
      return response.data
    } catch (err) {
      console.error('闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍤嬫い蹇撴濞堢娀鎮归崶鐑芥闁稿骸绻戝鍕綇椤愩儛?', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch wayline job details'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearJobs = () => {
    jobs.value = []
  }

  const clearWaylineDetail = () => {
    waylineDetail.value = null
  }

  const createJob = async (workspaceId: string, data: {
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
      recurrence_type: string // 'date_range'
      start_date: string
      end_date: string
    }
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.createJob(workspaceId, data)
      console.log('婵炲濮鹃褎鎱ㄩ悢鐓庣婵炴垶顭囩槐锕傛煙鐎涙ê濮囧┑?', response)
      return response.data
    } catch (err) {
      console.error('闂佸憡甯楃粙鎴犵磽閹惧顩烽悹鍥ㄥ絻椤倕顭块幆鎵翱閻?', err)
      error.value = err instanceof Error ? err.message : 'Failed to create wayline job'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍤嬫い蹇撴濞堢姴霉閻樹警鍤欏┑顔惧枔閳ь剙婀遍崑鐐差渻閸屾稒浜ゆ繛鎴灻?
  const fetchWaylineProgress = async (workspaceId: string, dockSn: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.getWaylineProgress(workspaceId, dockSn)
      // console.log('闂佺厧澹婃禍鐐哄吹鎼淬垻顩烽悹鍥ㄥ絻椤倝寮堕埡鍌溾槈閻庤濞婇幊銏犵暋閺夎法鎮奸梺鐟扮摠閸旀洘鎱?', response)
      return response.data
    } catch (err) {
      // console.error('闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍤嬫い蹇撴濞堢姴霉閻樹警鍤欏┑顔惧枑濞艰鈽夊Ο渚敽婵犮垺鍎肩划鍓ф喆?', err)
      error.value = err instanceof Error ? err.message : 'Failed to clear wayline jobs'
      // 闁哄鏅滈弻銊ッ洪弶姊猯l闂佸吋婢樻總鏃傜箔婢舵劕鍙婃い鏍ㄧ☉椤棃鏌涢幋婵囨儓缂佽鲸鎸鹃弫顕€妫冮埡鍐槷闁荤姳璁查弲鐐烘儍閻斿吋鍋ㄩ柕濠忛檮閻撴瑥顭跨捄鍝勵伀闁?
      return null
    } finally {
      loading.value = false
    }
  }

  // 闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍤嬫い蹇撴濞堢姴霉閻樹警鍤欏┑顔惧枔閹风娀鏁傞崜褏鐓勬繛锝呮礌閸撴繃瀵?
  const fetchWaylineJobDetail = async (workspaceId: string, jobId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.getWaylineJobDetail(workspaceId, jobId)
      // console.log('闂佺厧澹婃禍鐐哄吹鎼淬垻顩烽悹鍥ㄥ絻椤倝鎮归崶鐑芥闁稿骸绻橀幊銏犵暋閺夎法鎮奸梺鐟扮摠閸旀洘鎱?', response)
      return response.data
    } catch (err) {
      // console.error('闂佸吋鍎抽崲鑼躲亹閸ヮ剚鍤嬫い蹇撴濞堢姴霉閻樹警鍤欏┑顔惧枔閹风娀鏁傞挊澶婂婵犮垺鍎肩划鍓ф喆?', err)
      error.value = err instanceof Error ? err.message : 'Failed to clear wayline details'
      // 闁哄鏅滈弻銊ッ洪弶姊猯l闂佸吋婢樻總鏃傜箔婢舵劕鍙婃い鏍ㄧ☉椤棃鏌涢幋婵囨儓缂佽鲸鎸鹃弫顕€妫冮埡鍐槷闁荤姳璁查弲鐐烘儍閻斿吋鍋ㄩ柕濠忛檮閻撴瑥顭跨捄鍝勵伀闁?
      return null
    } finally {
      loading.value = false
    }
  }

  // 闂佸憡鐟﹂悧妤冪矓闁垮浜ら柡鍐ㄦ搐閻?
  const cancelReturnHome = async (workspaceId: string, dockSn: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.cancelReturnHome(workspaceId, dockSn)
      console.log('闂佸憡鐟﹂悧妤冪矓闁垮浜ら柡鍐ㄦ搐閻掑鏌熺€涙ê濮囧┑?', response)
      return response
    } catch (err) {
      console.error('闂佸憡鐟﹂悧妤冪矓闁垮浜ら柡鍐ㄦ搐閻掕顭块幆鎵翱閻?', err)
      error.value = err instanceof Error ? err.message : 'Failed to cancel return home'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸憡鐟﹂悧妤冪矓闁垮顩烽悹鍥ㄥ絻椤?
  const stopJob = async (workspaceId: string, jobId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.stopJob(workspaceId, jobId)
      console.log('闂佸憡鐟﹂悧妤冪矓闁垮顩烽悹鍥ㄥ絻椤倝鏌熺€涙ê濮囧┑?', response)
      return response
    } catch (err) {
      console.error('闂佸憡鐟﹂悧妤冪矓闁垮顩烽悹鍥ㄥ絻椤倕顭块幆鎵翱閻?', err)
      error.value = err instanceof Error ? err.message : 'Failed to stop job'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佺厧澹婃禍鐐哄吹鎼淬劌姹查柛灞剧煯缁?
  const pauseJob = async (workspaceId: string, jobId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.pauseJob(workspaceId, jobId)
      console.log('闂佺厧澹婃禍鐐哄吹鎼淬劌姹查柛灞剧煯缁鏌熺€涙ê濮囧┑?', response)
      return response
    } catch (err) {
      console.error('闂佺厧澹婃禍鐐哄吹鎼淬劌姹查柛灞剧煯缁顭块幆鎵翱閻?', err)
      error.value = err instanceof Error ? err.message : 'Failed to pause job'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佺厧澹婃禍鐐哄吹鎼淬劌绠掗柕蹇曞濡?
  const resumeJob = async (workspaceId: string, jobId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.resumeJob(workspaceId, jobId)
      console.log('闂佺厧澹婃禍鐐哄吹鎼淬劌绠掗柕蹇曞濡插鏌熺€涙ê濮囧┑?', response)
      return response
    } catch (err) {
      console.error('闂佺厧澹婃禍鐐哄吹鎼淬劌绠掗柕蹇曞濡茶顭块幆鎵翱閻?', err)
      error.value = err instanceof Error ? err.message : 'Failed to resume job'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 闂佸湱鐟抽崱鈺傛杸婵炲濮鹃褎鎱?
  const executeJob = async (workspaceId: string, jobId: string, algorithmData?: {
    enable_vision?: boolean
    vision_algorithms?: number[]
    vision_threshold?: number
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await waylineApi.executeJob(workspaceId, jobId, algorithmData)
      console.log('闂佸湱鐟抽崱鈺傛杸婵炲濮鹃褎鎱ㄩ悢鐓庣闁归偊鍓欓～?', response)
      return response
    } catch (err) {
      console.error('闂佸湱鐟抽崱鈺傛杸婵炲濮鹃褎鎱ㄩ悢绋跨窞閺夊牜鍋夎:', err)
      error.value = err instanceof Error ? err.message : '闂佸湱鐟抽崱鈺傛杸婵炲濮鹃褎鎱ㄩ悢绋跨窞閺夊牜鍋夎'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    jobs: readonly(jobs),
    waylineFiles: readonly(waylineFiles),
    waylineDetail: readonly(waylineDetail),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    fetchJobs,
    fetchWaylineFiles,
    fetchWaylineDetail,
    fetchWaylineProgress,
    fetchWaylineJobDetail,
    createJob,
    cancelReturnHome,
    stopJob,
    pauseJob,
    resumeJob,
    executeJob,
    clearJobs,
    clearWaylineDetail
  }
} 
