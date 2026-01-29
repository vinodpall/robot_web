// ================= 轨迹路线文件本地缓存与配置 ================
export const TRAJECTORY_CONFIG_KEY = 'trajectory_config'
export const TRAJECTORY_STORE_NAME = 'trajectory_files'

// 打开轨迹文件的 IndexedDB
export const openTrajectoryDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('trajectory_db', 1)
        request.onupgradeneeded = (event) => {
            const db = request.result
            if (!db.objectStoreNames.contains(TRAJECTORY_STORE_NAME)) {
                db.createObjectStore(TRAJECTORY_STORE_NAME, { keyPath: 'id' })
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

// 保存轨迹文件
export const saveTrajectoryFile = async (trackName: string, blob: Blob): Promise<void> => {
    const db = await openTrajectoryDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction([TRAJECTORY_STORE_NAME], 'readwrite')
        const store = tx.objectStore(TRAJECTORY_STORE_NAME)
        store.put({ id: trackName, blob })
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

// 获取轨迹文件
export const getTrajectoryFile = async (trackName: string): Promise<Blob | null> => {
    try {
        const db = await openTrajectoryDB()
        return new Promise((resolve) => {
            const tx = db.transaction([TRAJECTORY_STORE_NAME], 'readonly')
            const request = tx.objectStore(TRAJECTORY_STORE_NAME).get(trackName)
            request.onsuccess = () => resolve(request.result?.blob || null)
            request.onerror = () => resolve(null)
        })
    } catch {
        return null
    }
}
