import { albumArtColors, albumArtHashs } from '../data/albumArtData'
import {
  cosineSimilarity,
  diffHash,
  diffLogoColors,
  getAverageHashFromLogoColor,
  getColorsFromLogo
} from '../graphics'

export function albumArtOCR(logoColors: Uint8Array): number {
  if (albumArtColors.length === 0) return -1

  const logoHash = getAverageHashFromLogoColor(logoColors)

  let bestIndex = -1
  let bestScore = -Infinity
  let bestSimC = -1

  for (let i = 0; i < albumArtColors.length; i++) {
    const colors = albumArtColors[i]
    const hash = albumArtHashs[i]

    const diffC = diffLogoColors(logoColors, colors)
    const simC = diffC
    const cosine = cosineSimilarity(logoHash, hash)
    const diffH = diffHash(logoHash, hash)
    const score = simC + cosine + diffH

    if (simC > bestSimC) {
      bestIndex = i
      bestScore = score
      bestSimC = simC
    }
  }

  if (
    bestSimC > 0.875 ||
    (bestSimC > 0.865 && bestScore > 2.45) ||
    (bestSimC > 0.845 && bestScore > 2.48) ||
    (bestSimC > 0.8 && bestIndex === 197)
  ) {
    return bestIndex
  }

  return -1
}

export async function testAlbumArtOCR(): Promise<void> {
  const logoColors = await getColorsFromLogo('C:\\Users\\heebb\\Downloads\\470.jpg')
  const startTime = performance.now()
  const index = await albumArtOCR(logoColors)

  if (index === -1) {
    console.log('No matching AlbumArt')
  } else {
    console.log('AlbumArt index:', index)
  }
  const endTime = performance.now()
  const duration = (endTime - startTime).toFixed(2)
  console.log(`Duration: ${duration} ms`)
}
