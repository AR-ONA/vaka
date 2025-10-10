import { useEffect, useState } from 'react'
import { useDataStore } from '../store/useDataStore'

const TRANSITION_DURATION = 500 // 500ms

interface DataLoaderState {
  isLoading: boolean // 데이터 로딩 중?
  isPageMounted: boolean // DOM에 마운트되어 있음?
}

export const useInitialDataLoader = (): DataLoaderState => {
  const { setData } = useDataStore()

  const [isLoading, setIsLoading] = useState(true)
  const [isPageMounted, setIsPageMounted] = useState(true)

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        await window.api.initNumOCR()
        const loadedData = await window.api.loadData()
        setData(loadedData)
        console.log(loadedData)
      } catch (error) {
        console.error('데이터 로드 실패:', error)
      } finally {
        setTimeout(() => setIsLoading(false), 100)
      }
    }
    loadData()
  }, [setData])

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsPageMounted(false)
      }, TRANSITION_DURATION)

      return () => clearTimeout(timer) // 클린업
    }
    return
  }, [isLoading])

  return { isLoading, isPageMounted }
}
