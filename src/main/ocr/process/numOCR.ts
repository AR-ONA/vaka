import { createWorker, PSM, Worker } from 'tesseract.js'

let worker: Worker | null = null

export async function initNumOCR(): Promise<void> {
  if (worker) return

  worker = await createWorker('eng')

  console.log('Tesseract has been initialized!')
}

const DIGITS = '0123456789'

// 한 줄짜리 텍스트를 whitelist에 있는 글자로만 읽는다 (worker 하나를 공유하므로 순차 호출)
export async function recognizeNum(
  image: string | Buffer,
  whitelist: string = DIGITS
): Promise<string> {
  if (!worker) throw new Error('NumOCR is not initialized')

  await worker.setParameters({
    tessedit_char_whitelist: whitelist,
    tessedit_pageseg_mode: PSM.SINGLE_LINE
  })
  const {
    data: { text }
  } = await worker.recognize(image)
  return text.trim()
}

export async function terminateNumOCR(): Promise<void> {
  await worker?.terminate()
  worker = null
}

export async function testNumOCR(imagePath: string): Promise<void> {
  const startTime = performance.now()
  const text = await recognizeNum(imagePath)
  const duration = (performance.now() - startTime).toFixed(2)

  console.log(text ? `Result: "${text}"` : 'No number!!')
  console.log(`Duration: ${duration} ms`)
}
