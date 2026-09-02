import { ref, onUnmounted, type Ref } from 'vue'

export interface UseWebRTCVideoOptions {
  iceServers?: RTCIceServer[]
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectDelayMs?: number
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: any) => void
}

/**
 * 将 webrtc:// 流地址转换为本地/反向代理能够处理的 HTTP API 地址
 * 统一走 /rtc-proxy/{hostname}/rtc/v1/play/
 */
export function buildWebRtcApiUrl(webrtcUrl: string): string {
  try {
    const url = new URL(webrtcUrl)
    return `/rtc-proxy/${url.hostname}`
  } catch (_) {
    const match = webrtcUrl.replace('webrtc://', '').split('/')[0].split(':')[0]
    return `/rtc-proxy/${match}`
  }
}

/**
 * 统一 WebRTC 视频流播放 Composable
 * 封装 RTCPeerConnection 状态机、SDP 握手、自动重连与组件卸载自动清理
 */
export function useWebRTCVideo(options: UseWebRTCVideoOptions = {}) {
  const {
    iceServers = [{ urls: 'stun:stun.l.google.com:19302' }],
    autoReconnect = true,
    maxReconnectAttempts = 10,
    reconnectDelayMs = 2000
  } = options

  const isPlaying = ref(false)
  const isLoading = ref(false)
  const isReconnecting = ref(false)
  const hasVideoFrame = ref(false)
  const streamUrl = ref('')

  let pc: RTCPeerConnection | null = null
  let currentSessionId = 0
  let reconnectCount = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let targetVideoEl: HTMLVideoElement | null = null

  const clearReconnectTimer = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const stopPlayback = () => {
    currentSessionId++
    clearReconnectTimer()

    if (pc) {
      try {
        pc.close()
      } catch (_) {}
      pc = null
    }

    if (targetVideoEl) {
      targetVideoEl.srcObject = null
    }

    isPlaying.value = false
    isLoading.value = false
    isReconnecting.value = false
    hasVideoFrame.value = false
  }

  const scheduleReconnect = () => {
    if (!autoReconnect || !streamUrl.value || !targetVideoEl) return
    if (reconnectCount >= maxReconnectAttempts) {
      console.warn('[WebRTC] 达到最大重连次数，停止自动重连')
      isReconnecting.value = false
      return
    }

    clearReconnectTimer()
    isReconnecting.value = true
    reconnectCount++
    const delay = Math.min(reconnectDelayMs * Math.pow(1.5, reconnectCount - 1), 10000)

    reconnectTimer = setTimeout(() => {
      if (streamUrl.value && targetVideoEl) {
        startPlayback(streamUrl.value, targetVideoEl).catch(err => {
          console.error('[WebRTC] 自动重连失败:', err)
        })
      }
    }, delay)
  }

  const startPlayback = async (
    url: string,
    videoEl: HTMLVideoElement | Ref<HTMLVideoElement | null | undefined>
  ) => {
    if (!url) return

    const el = (videoEl && typeof videoEl === 'object' && 'value' in videoEl)
      ? (videoEl as Ref<HTMLVideoElement | null | undefined>).value
      : (videoEl as HTMLVideoElement | null)

    if (!el) {
      console.error('[WebRTC] 目标 video 元素未就绪')
      return
    }

    targetVideoEl = el
    streamUrl.value = url
    currentSessionId++
    const sessionId = currentSessionId

    clearReconnectTimer()

    if (pc) {
      try {
        pc.close()
      } catch (_) {}
      pc = null
    }

    isLoading.value = true

    try {
      const currentPc = new RTCPeerConnection({ iceServers })
      pc = currentPc

      currentPc.ontrack = (e) => {
        if (pc !== currentPc || sessionId !== currentSessionId) return
        if (targetVideoEl && e.streams && e.streams[0]) {
          const vEl = targetVideoEl
          vEl.srcObject = e.streams[0]
          hasVideoFrame.value = true
          isLoading.value = false
          isReconnecting.value = false

          vEl.play().then(() => {
            isPlaying.value = true
            reconnectCount = 0
            options.onConnected?.()
          }).catch(err => {
            if (err?.name === 'AbortError' || /interrupted/i.test(err?.message)) return
            console.error('[WebRTC] 视频播放失败:', err)
            scheduleReconnect()
          })
        }
      }

      currentPc.oniceconnectionstatechange = () => {
        if (pc !== currentPc || sessionId !== currentSessionId) return
        const state = currentPc.iceConnectionState
        if (state === 'connected') {
          isPlaying.value = true
          isLoading.value = false
          isReconnecting.value = false
          reconnectCount = 0
          clearReconnectTimer()
          options.onConnected?.()
        } else if (state === 'disconnected' || state === 'failed') {
          isPlaying.value = false
          options.onDisconnected?.()
          scheduleReconnect()
        }
      }

      const offer = await currentPc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })

      if (pc !== currentPc || sessionId !== currentSessionId) {
        currentPc.close()
        return
      }

      await currentPc.setLocalDescription(offer)

      const apiUrl = buildWebRtcApiUrl(url)
      const response = await fetch(`${apiUrl}/rtc/v1/play/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdp: offer.sdp, streamurl: url })
      })

      if (!response.ok) {
        throw new Error(`SRS HTTP 响应错误: ${response.status}`)
      }

      const data = await response.json()
      if (data.code !== 0 || !data.sdp) {
        throw new Error(`SRS 握手失败: ${data.msg || data.code || '未知错误'}`)
      }

      if (pc !== currentPc || sessionId !== currentSessionId) {
        currentPc.close()
        return
      }

      await currentPc.setRemoteDescription({
        type: 'answer',
        sdp: data.sdp
      })

    } catch (err: any) {
      if (sessionId !== currentSessionId) return
      console.error('[WebRTC] 播放初始化异常:', err)
      isLoading.value = false
      isPlaying.value = false
      options.onError?.(err)
      if (pc) {
        try {
          pc.close()
        } catch (_) {}
        pc = null
      }
      scheduleReconnect()
    }
  }

  onUnmounted(() => {
    stopPlayback()
  })

  return {
    isPlaying,
    isLoading,
    isReconnecting,
    hasVideoFrame,
    streamUrl,
    startPlayback,
    stopPlayback,
    buildWebRtcApiUrl
  }
}
