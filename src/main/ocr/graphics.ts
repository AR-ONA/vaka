import { createCanvas, loadImage } from 'canvas'

// Color
export interface Color {
  r: number
  g: number
  b: number
}

// 40x40 Color[] 변환
export async function getColorsFromLogo(imagePath: string): Promise<Color[]> {
  const img = await loadImage(imagePath)
  const canvas = createCanvas(40, 40)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, 40, 40)

  const colors: Color[] = []
  const imgData = ctx.getImageData(0, 0, 40, 40).data

  const tempColors: Color[] = []
  for (let i = 0; i < imgData.length; i += 4) {
    tempColors.push({ r: imgData[i], g: imgData[i + 1], b: imgData[i + 2] })
  }

  for (let x = 0; x < 40; x++) {
    for (let y = 0; y < 40; y++) {
      const indexInRowMajor = y * 40 + x
      colors.push(tempColors[indexInRowMajor])
    }
  }
  return colors
}

// Color[] >> HEX
export function getHexStringFromColors(colors: Color[]): string {
  return colors
    .map(
      (c) =>
        c.r.toString(16).padStart(2, '0') +
        c.g.toString(16).padStart(2, '0') +
        c.b.toString(16).padStart(2, '0')
    )
    .join('')
}

// HEX >> Color[]
export function getColorsFromHexString(hex: string): Color[] {
  const colors: Color[] = []
  for (let i = 0; i < hex.length; i += 6) {
    colors.push({
      r: parseInt(hex.substr(i, 2), 16),
      g: parseInt(hex.substr(i + 2, 2), 16),
      b: parseInt(hex.substr(i + 4, 2), 16)
    })
  }
  return colors
}

// Color >> 밝기(0~255)
export function getBright(c: Color): number {
  return Math.max(0, Math.min(255, Math.floor(((c.r + c.g + c.b) / 3) * 2)))
}

// Color[] >> Gray Vector (16x16)
export function getGrayVector16by16(colors: Color[]): number[] {
  const vec: number[] = []
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const srcX = Math.floor((x * 40) / 16)
      const srcY = Math.floor((y * 40) / 16)
      const c = colors[srcY * 40 + srcX]
      vec.push(Math.floor((c.r + c.g + c.b) / 3))
    }
  }
  return vec
}

// 코사인 유사도
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  if (dot === 0 || normA === 0 || normB === 0) return 0
  return dot / Math.sqrt(normA * normB)
}

// 평균 컬러 Hash
export function getAverageHashFromLogoColor(colors: Color[]): number[] {
  const brightness = colors.map((c) => (c.r + c.g + c.b) / 3 / 255)
  const avg = brightness.reduce((a, b) => a + b, 0) / brightness.length
  return brightness.map((b) => (b > avg ? 1 : 0))
}

// ./graphics.ts의 diffLogoColors 함수 (유사도를 반환하도록 수정)
export function diffLogoColors(a: Color[], b: Color[]): number {
  let simSum = 0
  let num2 = 0

  for (let i = 0; i < a.length; i++) {
    const x = Math.floor(i / 40)
    const y = i % 40
    if (x + y >= 11) {
      num2++
      simSum += colorSimilarity(a[i], b[i])
    }
  }
  return simSum / num2
}

export function diffHash(hashA: number[], hashB: number[]): number {
  let diff = 0
  for (let i = 0; i < hashA.length; i++) if (hashA[i] !== hashB[i]) diff++
  return 1 - diff / hashA.length
}

// 색상 유사도
export function colorSimilarity(a: Color, b: Color): number {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  const dist = Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(255 * 255 * 3) // 0~1
  return 1 - dist
}
