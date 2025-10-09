import { createCanvas, loadImage } from 'canvas'

// 40x40 Image >> Uint8Array (RGB, Col-Major)
export async function getColorsFromLogo(imagePath: string): Promise<Uint8Array> {
  const img = await loadImage(imagePath)
  const canvas = createCanvas(40, 40)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, 40, 40)

  const imgData = ctx.getImageData(0, 0, 40, 40).data
  const colors = new Uint8Array(40 * 40 * 3)
  const width = 40,
    height = 40

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const rowMajorIdx = (y * width + x) * 4
      const colMajorIdx = (x * height + y) * 3

      colors[colMajorIdx] = imgData[rowMajorIdx] // R
      colors[colMajorIdx + 1] = imgData[rowMajorIdx + 1] // G
      colors[colMajorIdx + 2] = imgData[rowMajorIdx + 2] // B
    }
  }
  return colors
}

// HEX >> Uint8Array
export function getColorsFromHexString(hex: string): Uint8Array {
  if (hex.length % 6 !== 0) throw new Error('Hex length must be multiple of 6')
  const len = hex.length / 2
  const arr = new Uint8Array(len)
  for (let i = 0; i < len / 3; i++) {
    arr[i * 3] = parseInt(hex.substring(i * 6, i * 6 + 2), 16)
    arr[i * 3 + 1] = parseInt(hex.substring(i * 6 + 2, i * 6 + 4), 16)
    arr[i * 3 + 2] = parseInt(hex.substring(i * 6 + 4, i * 6 + 6), 16)
  }
  return arr
}

// Gray Vector 16x16 (Fixed 40x40 RGB Input)
export function getGrayVector16by16(colors: Uint8Array): number[] {
  const vec: number[] = []
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const srcX = Math.floor((x * 40) / 16)
      const srcY = Math.floor((y * 40) / 16)
      const idx = (srcY * 40 + srcX) * 3
      const r = colors[idx],
        g = colors[idx + 1],
        b = colors[idx + 2]
      vec.push(Math.floor((r + g + b) / 3))
    }
  }
  return vec
}

// 평균 Hash
export function getAverageHashFromLogoColor(colors: Uint8Array): number[] {
  const len = colors.length / 3
  const brightness: number[] = []
  let sum = 0
  for (let i = 0; i < len; i++) {
    const b = (colors[i * 3] + colors[i * 3 + 1] + colors[i * 3 + 2]) / 3 / 255
    brightness.push(b)
    sum += b
  }
  const avg = sum / len
  return brightness.map((b) => (b > avg ? 1 : 0))
}

// 색상 유사도 (0~1)
export function colorSimilarity(aIdx: number, bIdx: number, a: Uint8Array, b: Uint8Array): number {
  const dr = a[aIdx] - b[bIdx]
  const dg = a[aIdx + 1] - b[bIdx + 1]
  const db = a[aIdx + 2] - b[bIdx + 2]
  const dist = Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(255 * 255 * 3)
  return 1 - dist
}

export function diffLogoColors(a: Uint8Array, b: Uint8Array): number {
  const len = a.length / 3
  let simSum = 0
  for (let i = 0; i < len; i++) {
    simSum += colorSimilarity(i * 3, i * 3, a, b)
  }
  return simSum / len
}

export function diffHash(hashA: number[] | Uint8Array, hashB: number[] | Uint8Array): number {
  let diff = 0
  for (let i = 0; i < hashA.length; i++) if (hashA[i] !== hashB[i]) diff++
  return 1 - diff / hashA.length
}

// 코사인 유사도
export function cosineSimilarity(vecA: number[] | Uint8Array, vecB: number[] | Uint8Array): number {
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
