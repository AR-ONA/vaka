import { ipcMain } from 'electron'
import { readFile } from 'fs/promises'
import { getJacketPath } from '../ocr/data/albumArtData'

const dataUrls = new Map<number, string>()

async function getJacketDataUrl(id: number): Promise<string | undefined> {
  const cached = dataUrls.get(id)
  if (cached) return cached

  try {
    const url = `data:image/jpeg;base64,${(await readFile(getJacketPath(id))).toString('base64')}`
    dataUrls.set(id, url)
    return url
  } catch {
    return undefined // 받지 못한 자켓
  }
}

export function registerJacketsIPC(): void {
  ipcMain.handle('get-jackets', async (_, ids: number[]): Promise<Record<number, string>> => {
    const result: Record<number, string> = {}
    await Promise.all(
      ids.map(async (id) => {
        const url = await getJacketDataUrl(id)
        if (url) result[id] = url
      })
    )
    return result
  })
}
