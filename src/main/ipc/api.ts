import { ipcMain } from 'electron'

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

      return { songs, boards, tiers }
    } catch (error) {
      console.error('Failed to load data:', error)
      throw new Error('데이터를 불러오는 중 오류 발생')
    }
  })
}
