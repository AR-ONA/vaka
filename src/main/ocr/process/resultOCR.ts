import { createCanvas, Image, loadImage } from 'canvas'
import { ResultInfo } from '../../../types/api'
import { albumArtSongIds, albumArtTitles } from '../data/albumArtData'
import { getColorsFromImage, Region } from '../graphics'
import { albumArtOCR } from './albumArtOCR'
import { recognizeNum } from './numOCR'

// 1920x1080 결과창 기준 좌표. 다른 해상도는 가로 비율로 맞춘다
const BASE_WIDTH = 1920
const REGIONS = {
  jacket: [705, 14, 60, 60],
  button: [70, 20, 70, 85],
  pattern: [716, 88, 76, 16], // 태그 테두리 안쪽
  badge: [1005, 490, 125, 125],
  accuracy: [880, 598, 160, 50]
} satisfies Record<string, Region>

const PATTERNS = ['NM', 'HD', 'MX', 'SC'] as const

// 뱃지(별 모양)의 색이 영역에서 차지하는 최소 비율
const MIN_BADGE_RATIO = 0.08

function scaled(region: Region, scale: number): Region {
  return region.map((v) => Math.round(v * scale)) as Region
}

// 가장 밝은 채널로 흑백 변환 후 대비를 늘리고 반전(흰 배경, 검은 글씨).
// 분홍/빨강 글씨와 반투명 배경도 읽히게 한다
function prepareText(img: Image, region: Region, upscale = 3, pad = 8): Buffer {
  const [sx, sy, sw, sh] = region
  const w = sw * upscale
  const h = sh * upscale

  const text = createCanvas(w, h)
  const textCtx = text.getContext('2d')
  textCtx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
  const imgData = textCtx.getImageData(0, 0, w, h)
  const data = imgData.data

  let lo = 255
  let hi = 0
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.max(data[i], data[i + 1], data[i + 2])
    data[i] = v
    lo = Math.min(lo, v)
    hi = Math.max(hi, v)
  }
  const range = Math.max(1, hi - lo)
  for (let i = 0; i < data.length; i += 4) {
    const v = 255 - Math.round(((data[i] - lo) / range) * 255)
    data[i] = data[i + 1] = data[i + 2] = v
    data[i + 3] = 255
  }
  textCtx.putImageData(imgData, 0, 0)

  const out = createCanvas(w + pad * 2, h + pad * 2)
  const outCtx = out.getContext('2d')
  outCtx.fillStyle = '#fff'
  outCtx.fillRect(0, 0, out.width, out.height)
  outCtx.drawImage(text, pad, pad)
  return out.toBuffer('image/png')
}

// 채도/명도가 충분한 픽셀의 색상(0~360)
function hueOf(r: number, g: number, b: number): number | null {
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (max < 102 || d / max < 0.5) return null

  const hue = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return hue * 60
}

// MAX COMBO 뱃지는 청록/파랑, PERFECT PLAY 뱃지는 보라/자홍/빨강. 글자를 읽지 않고 색으로 구분한다
function recognizeBadge(img: Image, region: Region): 'MAX_COMBO' | 'PERFECT_PLAY' | undefined {
  const [sx, sy, sw, sh] = region
  const canvas = createCanvas(sw, sh)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
  const data = ctx.getImageData(0, 0, sw, sh).data

  let cool = 0
  let warm = 0
  for (let i = 0; i < data.length; i += 4) {
    const hue = hueOf(data[i], data[i + 1], data[i + 2])
    if (hue === null) continue
    if (hue >= 150 && hue < 250) cool++
    else if (hue >= 260 && hue < 350) warm++
  }

  const min = sw * sh * MIN_BADGE_RATIO
  if (Math.max(cool, warm) < min) return undefined
  return cool > warm ? 'MAX_COMBO' : 'PERFECT_PLAY'
}

export async function recognizeResult(image: Buffer): Promise<ResultInfo> {
  const img = await loadImage(image)
  const scale = img.width / BASE_WIDTH
  const region = (name: keyof typeof REGIONS): Region => scaled(REGIONS[name], scale)

  const jacketIndex = albumArtOCR(getColorsFromImage(img, region('jacket')))

  const button = Number(await recognizeNum(prepareText(img, region('button')), '4568'))
  const pattern = await recognizeNum(prepareText(img, region('pattern')), 'NMHDXSC')
  const badge = recognizeBadge(img, region('badge'))
  const accuracy = parseFloat(
    await recognizeNum(prepareText(img, region('accuracy')), '0123456789.%')
  )

  return {
    title: jacketIndex === -1 ? undefined : albumArtTitles[jacketIndex],
    songId: jacketIndex === -1 ? undefined : albumArtSongIds[jacketIndex],
    button: [4, 5, 6, 8].includes(button) ? (button as ResultInfo['button']) : undefined,
    pattern: PATTERNS.find((p) => pattern.includes(p)),
    accuracy: Number.isNaN(accuracy) ? undefined : accuracy,
    maxCombo: badge !== undefined,
    perfectPlay: badge === 'PERFECT_PLAY'
  }
}
