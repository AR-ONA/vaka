import { albumArtColors, albumArtHashs } from './albumArtData'
import {
  Color,
  getAverageHashFromLogoColor,
  cosineSimilarity,
  diffHash,
  diffLogoColors,
  getColorsFromLogo
} from './graphics'

export function albumArtOCR(logoColors: Color[]): number {
  if (albumArtColors.length === 0) return -1

  const logoHash = getAverageHashFromLogoColor(logoColors)

  let bestIndex = -1
  let bestScore = 0
  let bestDiffC = 0
  // let bestCosine = 0
  // let bestDiffH = 0

  for (let i = 0; i < albumArtColors.length; i++) {
    const colors = albumArtColors[i]
    const hash = albumArtHashs[i]

    const diffC = diffLogoColors(logoColors, colors)
    if (diffC < 0.8) continue

    const cosine = cosineSimilarity(logoHash, hash)
    const diffH = diffHash(logoHash, hash)
    const score = diffC + cosine + diffH

    if (diffC > bestDiffC) {
      bestIndex = i
      bestScore = score
      bestDiffC = diffC
      // bestCosine = cosine
      // bestDiffH = diffH
      console.log(`Index ${i}: diffC=${diffC}, cosine=${cosine}, diffH=${diffH}, score=${score}`)
    }
  }

  if (
    bestDiffC > 0.875 ||
    (bestDiffC > 0.865 && bestScore > 2.45) ||
    (bestDiffC > 0.845 && bestScore > 2.48) ||
    (bestDiffC > 0.8 && bestIndex === 197)
  ) {
    return bestIndex
  }

  return -1
}

export async function testAlbumArtOCR(): Promise<void> {
  const logoColors = await getColorsFromLogo('C:\\Users\\heebb\\Downloads\\553.jpg')
  const index = albumArtOCR(logoColors)

  if (index === -1) {
    console.log('No matching AlbumArt')
  } else {
    console.log('AlbumArt index:', index)
  }
}
