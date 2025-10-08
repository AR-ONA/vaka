import { loadAlbumArtColorsFromCache, loadAlbumArtHashFromCache, TOTAL_INDEX_COUNT } from './albumArtData'
import {
  getAverageHashFromLogoColor,
  cosineSimilarity,
  diffHash,
  diffLogoColors,
  getColorsFromLogo
} from './graphics'

const HASH_THRESHOLD = 1.75
const COLOR_THRESHOLD = 0.8
const MAX_CANDIDATES = 10 // 해시 비교 상위 N개

export async function albumArtOCR(logoColors: Uint8Array): Promise<number> {
  const logoHashs = getAverageHashFromLogoColor(logoColors)

  const candidates: { index: number; score: number }[] = []

  // 모든 캐시 로드
  const indices = Array.from({ length: TOTAL_INDEX_COUNT }, (_, i) => i)
  const results = await Promise.allSettled(
    indices.map(async (index) => {
      const hashs = await loadAlbumArtHashFromCache(index)
      const sim = cosineSimilarity(logoHashs, hashs)
      const diff = diffHash(logoHashs, hashs)
      const score = sim + diff
      if (score >= HASH_THRESHOLD) return { index, score }
      return null
    })
  )

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) candidates.push(r.value)
  }

  if (candidates.length === 0) return -1

  // 상위 N개 후보 비교
  candidates.sort((a, b) => b.score - a.score)
  console.log(candidates.slice(0, MAX_CANDIDATES))
  const topCandidates = candidates.slice(0, MAX_CANDIDATES)

  let bestIndex = -1
  let bestSimC = 0

  for (const { index } of topCandidates) {
    try {
      const colors = await loadAlbumArtColorsFromCache(index)
      const colorSim = diffLogoColors(logoColors, colors)
      if (colorSim > bestSimC) {
        bestSimC = colorSim
        bestIndex = index
      }

      if (colorSim >= 0.9) return index
    } catch {
      continue
    }
  }

  return bestSimC >= COLOR_THRESHOLD ? bestIndex : -1
}

export async function testAlbumArtOCR(): Promise<void> {
  const logoColors = await getColorsFromLogo('C:\\Users\\heebb\\Downloads\\553.jpg')
  const index = await albumArtOCR(logoColors)

  if (index === -1) {
    console.log('No matching AlbumArt')
  } else {
    console.log('AlbumArt index:', index)
  }
}
