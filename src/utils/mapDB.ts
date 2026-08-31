// ================= 地图文件本地缓存 (IndexedDB) ================
export const MAP_DB_NAME = 'robot_map_cache_db'
export const MAP_STORE_NAME = 'mapFiles'

export const openMapDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MAP_DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(MAP_STORE_NAME)) {
        db.createObjectStore(MAP_STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const saveMapFile = async (mapName: string, fileName: string, blob: Blob): Promise<void> => {
  try {
    const db = await openMapDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([MAP_STORE_NAME], 'readwrite')
      const store = tx.objectStore(MAP_STORE_NAME)
      store.put({ id: `${mapName}_${fileName}`, mapName, fileName, blob, timestamp: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (error) {
    console.warn('[地图缓存] 保存地图文件失败:', error)
  }
}

export const getMapFile = async (mapName: string, fileName: string): Promise<Blob | null> => {
  try {
    const db = await openMapDB()
    return new Promise((resolve) => {
      const tx = db.transaction([MAP_STORE_NAME], 'readonly')
      const store = tx.objectStore(MAP_STORE_NAME)
      const request = store.get(`${mapName}_${fileName}`)
      request.onsuccess = () => {
        resolve(request.result?.blob || null)
      }
      request.onerror = () => resolve(null)
    })
  } catch (error) {
    console.warn('[地图缓存] 读取地图文件失败:', error)
    return null
  }
}

export const deleteMapFile = async (mapName: string, fileName?: string): Promise<void> => {
  try {
    const db = await openMapDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction([MAP_STORE_NAME], 'readwrite')
      const store = tx.objectStore(MAP_STORE_NAME)
      if (fileName) {
        store.delete(`${mapName}_${fileName}`)
      } else {
        const req = store.openCursor()
        req.onsuccess = (e: any) => {
          const cursor = e.target.result
          if (cursor) {
            if (String(cursor.key).startsWith(`${mapName}_`)) {
              cursor.delete()
            }
            cursor.continue()
          }
        }
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (error) {
    console.warn('[地图缓存] 删除地图文件失败:', error)
  }
}
