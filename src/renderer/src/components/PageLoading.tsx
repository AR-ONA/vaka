import { Zoomies } from 'ldrs/react'
import 'ldrs/react/Zoomies.css'
import React, { useEffect, useState } from 'react'

const FADE_MS = 400
const SHOW_DELAY_MS = 150

interface PageLoadingProps {
  show: boolean
}

// 페이지 안에서 데이터를 기다릴 때 쓰는 로딩 표시 (앱 시작 로딩 화면과 같은 Zoomies)
// 부모(relative) 위에 덮이고, show가 꺼지면 서서히 사라진 뒤 DOM에서 빠진다
const PageLoading: React.FC<PageLoadingProps> = ({ show }) => {
  const [mounted, setMounted] = useState(show)

  useEffect(() => {
    // 켤 때는 잠깐 기다린다. 캐시처럼 금방 끝나는 로딩에서 화면이 깜빡이지 않게
    const timer = setTimeout(() => setMounted(show), show ? SHOW_DELAY_MS : FADE_MS)
    return () => clearTimeout(timer)
  }, [show])

  if (!mounted) return null
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-(--color-background) transition-opacity ease-in-out ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <Zoomies size="80" stroke="4" bgOpacity="0.1" speed="1.4" color="white" />
    </div>
  )
}

export default PageLoading
