import { createCanvas, Image, loadImage } from 'canvas'

export type Region = [x: number, y: number, width: number, height: number]

// 이미지(의 일부 영역) 40x40 >> Uint8Array (RGB, Col-Major)
export function getColorsFromImage(img: Image, region?: Region): Uint8Array {
  const [sx, sy, sw, sh] = region ?? [0, 0, img.width, img.height]
  const canvas = createCanvas(40, 40)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 40, 40)

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

export async function getColorsFromLogo(imagePath: string): Promise<Uint8Array> {
  return getColorsFromImage(await loadImage(imagePath))
}

export function normalizeColors(colors: Uint8Array): Float32Array {
  let mean = 0
  for (let i = 0; i < colors.length; i++) mean += colors[i]
  mean /= colors.length

  const out = new Float32Array(colors.length)
  let norm = 0
  for (let i = 0; i < colors.length; i++) {
    out[i] = colors[i] - mean
    norm += out[i] * out[i]
  }
  norm = Math.sqrt(norm) || 1
  for (let i = 0; i < out.length; i++) out[i] /= norm
  return out
}

export function correlation(a: Float32Array, b: Float32Array): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}
