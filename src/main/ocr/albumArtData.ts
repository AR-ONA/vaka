import path from 'path'
import { getColorsFromHexString, getAverageHashFromLogoColor } from './graphics'
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises'
import { testAlbumArtOCR } from './albumArtOCR'

const CACHE_DIR = path.join(process.cwd(), 'album_art')

export let TOTAL_INDEX_COUNT = 0

export async function checkAndCreateCache(jacketList: string[]): Promise<void> {
  const isReady = await isCacheComplete(jacketList.length)

  if (!isReady) {
    console.log('Starting full cache regeneration...')
    await setAllAlbumArtCaches(jacketList)
  } else {
    TOTAL_INDEX_COUNT = jacketList.length
  }

  await testAlbumArtOCR()
}

export async function setAllAlbumArtCaches(jacketList: string[]): Promise<void> {
  await rm(CACHE_DIR, { recursive: true, force: true })

  await mkdir(path.join(CACHE_DIR, 'colors'), { recursive: true })
  await mkdir(path.join(CACHE_DIR, 'hashs'), { recursive: true })

  let index = 0
  for (const hex of jacketList) {
    if (hex.length !== 9600) {
      console.warn('wrong HEX length:', hex.length)
      continue
    }

    const colorsUint8Array = getColorsFromHexString(hex)
    const hashs = getAverageHashFromLogoColor(colorsUint8Array)

    const colorPath = path.join(CACHE_DIR, `colors/${index}.dat`)
    await writeFile(colorPath, colorsUint8Array)

    const hashPath = path.join(CACHE_DIR, `hashs/${index}.json`)
    await writeFile(hashPath, JSON.stringify(hashs), 'utf8')

    index++
  }

  console.log(`Cache complete: ${index} files`)
  TOTAL_INDEX_COUNT = index
}

export async function loadAlbumArtHashFromCache(index: number): Promise<number[]> {
  const hashPath = path.join(CACHE_DIR, `hashs/${index}.json`)
  try {
    const hashsJson = await readFile(hashPath, 'utf8')
    return JSON.parse(hashsJson) as number[]
  } catch (error) {
    console.error(`Hash cache load failed for index ${index}:`, error)
    throw new Error(`Failed to load hash cache for index ${index}`)
  }
}

export async function loadAlbumArtColorsFromCache(index: number): Promise<Uint8Array> {
  const colorPath = path.join(CACHE_DIR, `colors/${index}.dat`)
  try {
    const colorsBuffer = await readFile(colorPath)
    return new Uint8Array(colorsBuffer)
  } catch (error) {
    console.error(`Color cache load failed for index ${index}:`, error)
    throw new Error(`Failed to load color cache for index ${index}`)
  }
}

export async function isCacheComplete(jacketLength: number): Promise<boolean> {
  const colorsPath = path.join(CACHE_DIR, 'colors')

  try {
    const files = await readdir(colorsPath)

    if (files.length === jacketLength) {
      console.log('Cache is complete!')
      return true
    } else {
      console.log(`Cache size mismatch. Expected ${jacketLength}, found ${files.length}.`)
      return false
    }
  } catch {
    return false
  }
}
