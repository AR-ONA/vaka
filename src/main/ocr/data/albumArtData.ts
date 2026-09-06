import { app } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { getAverageHashFromLogoColor, getColorsFromHexString } from '../graphics'

export const albumArtColors: Uint8Array[] = []
export const albumArtHashs: number[][] = []

const JACKET_DATA_FILE = 'jacket-data.json'

interface JacketDataFile {
  version: number
  jacketList: string[]
}

function getJacketDataPath(): string {
  return join(app.getPath('userData'), JACKET_DATA_FILE)
}

function computeAlbumArt(jacketList: string[]): void {
  albumArtColors.length = 0
  albumArtHashs.length = 0

  for (const hex of jacketList) {
    if (hex.length !== 9600) {
      console.warn('wrong HEX length:', hex.length)
      continue
    }

    const colorsUint8Array = getColorsFromHexString(hex)
    albumArtColors.push(colorsUint8Array)
    albumArtHashs.push(getAverageHashFromLogoColor(colorsUint8Array))
  }

  console.log('Colors length: ', albumArtColors.length)
  console.log('Hashs length: ', albumArtHashs.length)
}

export function readJacketDataVersion(): number {
  try {
    const data = JSON.parse(readFileSync(getJacketDataPath(), 'utf-8')) as JacketDataFile
    if (!Array.isArray(data.jacketList)) {
      console.warn('Cache: invalid cache file!')
      return 0
    }
    console.log('Cache: cached version:', data.version)
    return data.version
  } catch {
    console.log('Cache: no cache file found')
    return 0
  }
}

export function loadAlbumArtData(jacketList: string[], version: number): void {
  if (albumArtColors.length > 0) return

  computeAlbumArt(jacketList)

  const data: JacketDataFile = { version, jacketList }
  const filePath = getJacketDataPath()
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(data))
  console.log(
    `Cache: saved ${jacketList.length} jackets to ${JACKET_DATA_FILE} (version: ${version})`
  )
}

export function loadAlbumArtDataFromFile(version: number): boolean {
  if (albumArtColors.length > 0) return true

  try {
    const data = JSON.parse(readFileSync(getJacketDataPath(), 'utf-8')) as JacketDataFile
    if (data.version !== version) {
      console.warn(`Cache: cache version (${data.version}) need to update, target: (${version})`)
      return false
    }

    computeAlbumArt(data.jacketList)
    console.log(`Cache: loaded ${data.jacketList.length} jackets. (${data.version})`)
    return true
  } catch {
    console.warn('Cache: failed to read cache!')
    return false
  }
}
