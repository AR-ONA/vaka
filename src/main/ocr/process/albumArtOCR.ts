import { albumArtColors } from '../data/albumArtData'
import { correlation, getColorsFromLogo, normalizeColors } from '../graphics'

// 1위의 스코어가 MIN_SCORE 이상이고, 2등과의 격차가 MIN_MARGIN 이상
const MIN_SCORE = 0.3
const MIN_MARGIN = 0.08

export function albumArtOCR(logoColors: Uint8Array): number {
  const logo = normalizeColors(logoColors)

  let bestIndex = -1
  let best = -Infinity
  let second = -Infinity

  for (let i = 0; i < albumArtColors.length; i++) {
    const score = correlation(logo, albumArtColors[i])
    if (score > best) {
      second = best
      best = score
      bestIndex = i
    } else if (score > second) {
      second = score
    }
  }

  return best >= MIN_SCORE && best - second >= MIN_MARGIN ? bestIndex : -1
}

export async function testAlbumArtOCR(imagePath: string): Promise<void> {
  const logoColors = await getColorsFromLogo(imagePath)
  const startTime = performance.now()
  const index = albumArtOCR(logoColors)
  const duration = (performance.now() - startTime).toFixed(2)

  console.log(index === -1 ? 'No matching AlbumArt' : `AlbumArt index: ${index}`)
  console.log(`Duration: ${duration} ms`)
}
