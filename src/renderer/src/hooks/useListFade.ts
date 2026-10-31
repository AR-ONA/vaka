import { useCallback, useRef, useState } from 'react'

const FADE_MS = 200

// 탭을 바꿀 때 목록을 "서서히 사라짐 → 교체 → 서서히 나타남"으로 바꾸기 위한 상태
// 큰 목록의 투명도를 바꾸는 동안 다른 작업이 겹치면 끊겨 보이므로, 교체는 완전히 사라진 뒤에 한다
export function useListFade(): {
  hidden: boolean
  listRef: React.RefObject<HTMLDivElement | null>
  className: string
  fadeOut: () => () => Promise<void> // 반환값: 사라지는 시간이 끝날 때까지 기다리는 함수
  fadeIn: () => void
} {
  const [hidden, setHidden] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const fadeOut = useCallback(() => {
    const startedAt = Date.now()
    setHidden(true)
    return () =>
      new Promise<void>((resolve) =>
        setTimeout(resolve, Math.max(0, FADE_MS - (Date.now() - startedAt)))
      )
  }, [])

  // 새 목록이 그려진 다음 프레임에 나타나게 한다
  const fadeIn = useCallback(() => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        listRef.current?.scrollTo(0, 0)
        setHidden(false)
      })
    )
  }, [])

  const className = `transition-opacity duration-200 ease-in-out will-change-[opacity] ${
    hidden ? 'opacity-0' : 'opacity-100'
  }`

  return { hidden, listRef, className, fadeOut, fadeIn }
}
