import React, { useEffect, useState } from 'react'
import { VscChromeClose } from 'react-icons/vsc'
import { SongDetail as SongDetailData } from '../../../types/api'
import { PATTERN_COLORS, Pattern } from '../utils/pattern'
import PageLoading from './PageLoading'
import RadarChart from './RadarChart'

// 레이더 축. 비슷한 성격의 태그가 이웃하도록 배치했다. 목록에 없는 새 태그는 뒤에 붙인다
const TAG_ORDER = ['연타', '폭타', '롱잡', '따닥', '동치', '드르륵', '트릴', '능지/사이드']
const MAX_STRENGTH = 3

interface SongDetailProps {
  button: number
  songId: number
  name: string
  pattern: Pattern
  jacketUrl?: string
  onClose: () => void
}

const SongDetail: React.FC<SongDetailProps> = ({
  button,
  songId,
  name,
  pattern,
  jacketUrl,
  onClose
}) => {
  const [detail, setDetail] = useState<SongDetailData>()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    window.api
      .loadSongDetail(button, songId, pattern)
      .then((result) => {
        if (cancelled) return
        if (result.success) setDetail(result.detail)
        else setError(result.message ?? '상세 정보를 불러오지 못했습니다')
      })
      .catch((e) => {
        if (cancelled) return
        console.error('곡 상세 조회 실패:', e)
        setError('상세 정보를 불러오지 못했습니다')
      })
    return () => {
      cancelled = true
    }
  }, [button, songId, pattern])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const tags = detail?.tags ?? {}
  const axes = [...TAG_ORDER, ...Object.keys(tags).filter((t) => !TAG_ORDER.includes(t))]
  const hasTags = Object.values(tags).some((v) => v > 0)
  // 값이 없는 항목은 칸 자체를 만들지 않는다
  const info: [string, string][] = detail
    ? (
        [
          ['레벨', `Lv.${detail.level}`],
          ['상수', detail.floorName ?? ''],
          ['작곡', detail.composer ?? ''],
          ['팩', detail.dlcCode ?? '']
        ] as [string, string][]
      ).filter(([, value]) => value !== '')
    : []

  return (
    <div
      className="no-drag-header fixed inset-x-0 top-10 bottom-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-full w-full max-w-md flex-col gap-4 overflow-auto rounded-2xl border border-(--ev-c-gray-3) bg-(--color-background) p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          title="닫기"
          className="absolute top-3 right-3 rounded p-1 transition-colors hover:bg-(--ev-c-gray-3)"
        >
          <VscChromeClose className="size-4" />
        </button>

        <div className="flex items-center gap-4 pr-6">
          <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-(--color-background-soft)">
            {jacketUrl && <img src={jacketUrl} alt={name} className="size-full object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="break-words text-lg font-semibold">{detail?.title ?? name}</p>
            <span
              className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-semibold ${PATTERN_COLORS[pattern]}`}
            >
              {button}B {pattern}
            </span>
          </div>
        </div>

        {error ? (
          <p className="py-8 text-center text-base opacity-70">{error}</p>
        ) : !detail ? (
          <div className="relative h-64">
            <PageLoading show />
          </div>
        ) : (
          <>
            <div>
              <RadarChart
                axes={axes}
                values={axes.map((axis) => tags[axis] ?? 0)}
                max={MAX_STRENGTH}
              />
              {!hasTags && (
                <p className="mt-1 text-center text-sm opacity-60">등록된 태그가 없습니다</p>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-(--ev-c-gray-3) pt-4 text-sm">
              {info.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="opacity-50">{label}</dt>
                  <dd className="mt-0.5 truncate text-base" title={value}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="absolute right-4 bottom-1.5 text-[11px] opacity-40">출처: 행이봇</p>
          </>
        )}
      </div>
    </div>
  )
}

export default SongDetail
