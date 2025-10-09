import { createWorker, Worker, RecognizeResult } from 'tesseract.js'

let globalWorker: Worker | null = null
export let recognizeNum: ((imagePathOrURL: string | File | Blob) => Promise<string>) | null = null
export let terminateNumOCR: (() => Promise<void>) | null = null

export async function initNumOCR(): Promise<void> {
  if (globalWorker) return

  globalWorker = await createWorker('eng')

  recognizeNum = async (imagePathOrURL: string | File | Blob): Promise<string> => {
    const {
      data: { text }
    }: RecognizeResult = await globalWorker!.recognize(imagePathOrURL)
    return text.trim()
  }

  terminateNumOCR = async () => {
    if (globalWorker) {
      await globalWorker.terminate()
      globalWorker = null
      recognizeNum = null
      terminateNumOCR = null
    }
  }

  console.log('Tesseract has been initialized!')
}

export async function testNumOCR(): Promise<void> {
  const imagePath = 'C:\\Users\\heebb\\Downloads\\992138.png'
  try {
    const startTime = performance.now()
    const recognizedText = await recognizeNum!(imagePath)
    if (recognizedText.trim().length === 0) {
      console.log('No number!!')
    } else {
      console.log(`Result: "${recognizedText}"`)
    }
    const endTime = performance.now()
    const duration = (endTime - startTime).toFixed(2)
    console.log(`Duration: ${duration} ms`)
  } catch (error) {
    console.error('Error!!!!: ', error)
  }
}
