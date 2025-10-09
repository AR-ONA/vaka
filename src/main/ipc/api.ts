import { ipcMain } from 'electron'
import { loadAlbumArtData } from '../ocr/data/albumArtData'
// import { testAlbumArtOCR } from '../ocr/process/albumArtOCR'

interface UpdateDataResponse {
  success: boolean
  autoUpdate?: {
    version: string
    downloadFiles: { url: string; fileName: string }[]
    runFileName: string
  }
  jacketList?: string[]
  titleList?: string[]
  notice?: string
}

export function registerApiIPC(): void {
  ipcMain.handle('load-data', async () => {
    try {
      const [songsResp, boardsResp, tiersResp] = await Promise.all([
        fetch('https://v-archive.net/db/songs.json', { method: 'GET' }),
        fetch('https://v-archive.net/db/boards.json', { method: 'GET' }),
        fetch('https://v-archive.net/db/tiers.json', { method: 'GET' })
      ])

      if (!songsResp.ok || !boardsResp.ok || !tiersResp.ok) {
        throw new Error('Network response was not ok')
      }

      const [songs, boards, tiers] = await Promise.all([
        songsResp.json(),
        boardsResp.json(),
        tiersResp.json()
      ])

      const updateResp = await fetch('https://v-archive.net/client/update', { method: 'GET' })
      if (!updateResp.ok) throw new Error('Failed to fetch update info')
      const updateData: UpdateDataResponse = await updateResp.json()
      const autoUpdateVersion = updateData.autoUpdate?.version || '0.0'

      const jacketResp = await fetch('https://v-archive.net/client/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userNo: 0,
          version: autoUpdateVersion,
          noticeVersion: '0',
          lastUpdate: 0
        })
      })
      if (!jacketResp.ok) throw new Error('Failed to fetch jacketList')
      const jacketData: UpdateDataResponse = await jacketResp.json()
      const jacketList = jacketData.jacketList || []

      await loadAlbumArtData(jacketList)
      // await testAlbumArtOCR()

      return { songs, boards, tiers }
    } catch (error) {
      console.error('Failed to load data:', error)
      throw new Error('데이터를 불러오는 중 오류 발생')
    }
  })
}
