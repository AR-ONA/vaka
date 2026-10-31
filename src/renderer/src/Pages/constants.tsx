import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PiArrowClockwise } from 'react-icons/pi'
import { BestRecord, ConstantEntry, ConstantGroup } from '../../../types/api'
import { useDataStore } from '../store/useDataStore'
import SongDetail from '../components/SongDetail'
import { buildSongIndex, findSong } from '../utils/songMatch'
import { useListFade } from '../hooks/useListFade'
import PageLoading from '../components/PageLoading'
import { PATTERN_BADGE_COLORS, PATTERN_COLORS } from '../utils/pattern'

const BUTTONS = [4, 5, 6, 8] as const

const TIP_WIDTH = 256 // w-64
const TIP_MARGIN = 8

interface Tip {
  entry: ConstantEntry
  record?: BestRecord // 내 기록
  constant: string
  left: number
  top: number
  above: boolean // 타일 위에 띄울지 (위 공간이 모자라면 아래)
}

// 이미 받은 자켓은 페이지를 다시 열어도 다시 받지 않는다 (곡 번호 -> data URL)
const jacketCache = new Map<number, string>()

const decodedJackets = new Map<number, HTMLImageElement>() // 참조를 쥐고 있어야 디코드 결과가 유지된다

// 내 기록 (곡 번호-패턴 -> 기록). 닉네임이 없거나 못 받으면 비어 있다
type MyRecords = Map<string, BestRecord>
const RECORDS_TTL = 60_000
const recordsCache = new Map<number, { at: number; records: MyRecords }>()

const recordKey = (songId: number, pattern: string): string => `${songId}-${pattern}`

async function loadMyRecords(button: number, force: boolean): Promise<MyRecords> {
  const cached = recordsCache.get(button)
  if (!force && cached && Date.now() - cached.at < RECORDS_TTL) return cached.records
  try {
    const result = await window.api.loadRecords(button)
    if (!result.success) return new Map()
    const records: MyRecords = new Map(
      (result.records ?? []).map((r) => [recordKey(r.title, r.pattern), r])
    )
    recordsCache.set(button, { at: Date.now(), records })
    return records
  } catch (e) {
    console.error('내 기록 조회 실패:', e)
    return new Map()
  }
}

// 타일 모서리의 점 색. 성과표의 정확도 색과 같다
function clearDot(r: BestRecord): { color: string; label: string } {
  if (r.score >= 100) return { color: 'bg-red-400', label: 'PERFECT PLAY' }
  if (r.maxCombo) return { color: 'bg-emerald-400', label: 'MAX COMBO' }
  return { color: 'bg-sky-400', label: 'CLEAR' }
}

// 아직 없는 자켓을 받고, 이미지를 미리 디코드해 둔다
// 목록을 그린 뒤에 디코드하면 타일이 하나씩 차례로 나타나기 때문이다
async function fetchJackets(ids: number[]): Promise<void> {
  const missing = ids.filter((id) => !jacketCache.has(id))
  if (missing.length > 0) {
    try {
      const urls = await window.api.getJackets(missing)
      for (const [id, url] of Object.entries(urls)) jacketCache.set(Number(id), url)
    } catch (e) {
      console.error('자켓 조회 실패:', e)
    }
  }

  await Promise.all(
    ids
      .filter((id) => jacketCache.has(id) && !decodedJackets.has(id))
      .map(async (id) => {
        const img = new Image()
        img.src = jacketCache.get(id)!
        await img.decode().catch(() => undefined)
        decodedJackets.set(id, img)
      })
  )
}

// 시트의 곡을 곡 DB와 연결해 곡 번호를 찾는다
function songIdsOf(groups: ConstantGroup[], index: ReturnType<typeof buildSongIndex>): number[] {
  const ids = new Set<number>()
  for (const group of groups) {
    for (const entry of group.entries) {
      const id = findSong(index, entry.name, entry.category)?.title
      if (id !== undefined) ids.add(id)
    }
  }
  return [...ids]
}

const ConstantsPage: React.FC = () => {
  const [button, setButton] = useState<(typeof BUTTONS)[number]>(4)
  const [groups, setGroups] = useState<ConstantGroup[]>([])
  const [loading, setLoading] = useState(true) // 첫 화면에 빈 상태가 먼저 보이지 않게
  const [error, setError] = useState('')
  const [fetchedAt, setFetchedAt] = useState<number>()
  const [stale, setStale] = useState(false)
  const [mine, setMine] = useState<MyRecords>(new Map())
  const [onlyTodo, setOnlyTodo] = useState(false) // 내 기록이 없는 곡만
  const [jackets, setJackets] = useState<Record<number, string>>(() =>
    Object.fromEntries(jacketCache)
  )
  const [tip, setTip] = useState<Tip | null>(null)
  const [selected, setSelected] = useState<{
    name: string
    pattern: ConstantEntry['pattern']
    songId: number
  }>()
  const songs = useDataStore((state) => state.songs)
  const index = useMemo(() => buildSongIndex(songs), [songs])
  const requestId = useRef(0)
  const { listRef, className: listFadeClass, fadeOut, fadeIn } = useListFade()
  const indexRef = useRef(index)
  indexRef.current = index

  // force: 캐시를 무시하고 시트를 다시 받는다
  // 새 목록과 자켓이 준비될 때까지 이전 목록을 그대로 두어, 탭을 바꿀 때 화면이 깜빡이지 않게 한다
  const load = useCallback(
    async (force = false): Promise<void> => {
      const id = ++requestId.current
      const waitFadeOut = force ? undefined : fadeOut()
      setLoading(true)
      setError('')
      try {
        const [result, myRecords] = await Promise.all([
          window.api.loadConstants(button, force),
          loadMyRecords(button, force)
        ])
        if (id !== requestId.current) return // 그 사이 다른 탭을 눌렀다
        if (result.success) {
          const next = result.groups ?? []
          await fetchJackets(songIdsOf(next, indexRef.current))
          await waitFadeOut?.()
          if (id !== requestId.current) return
          setJackets(Object.fromEntries(jacketCache)) // 목록과 같은 렌더에 반영해 글자 → 이미지로 바뀌는 깜빡임을 막는다
          setGroups(next)
          setMine(myRecords)
          setFetchedAt(result.fetchedAt)
          setStale(result.stale ?? false)
        } else {
          await waitFadeOut?.()
          if (id !== requestId.current) return
          setGroups([])
          setFetchedAt(undefined)
          setError(result.message ?? '상수표를 불러오지 못했습니다')
        }
      } catch (e) {
        await waitFadeOut?.()
        if (id !== requestId.current) return
        console.error('상수표 조회 실패:', e)
        setGroups([])
        setFetchedAt(undefined)
        setError(`상수표를 불러오지 못했습니다 (${e instanceof Error ? e.message : String(e)})`)
      } finally {
        if (id === requestId.current) {
          setLoading(false)
          if (!force) fadeIn()
        }
      }
    },
    [button, fadeOut, fadeIn]
  )

  useEffect(() => {
    load()
  }, [load])

  // 시트의 곡을 곡 DB와 연결해 곡 번호를 붙인다
  const resolved = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        entries: group.entries.map((entry) => ({
          ...entry,
          songId: findSong(index, entry.name, entry.category)?.title
        }))
      })),
    [groups, index]
  )

  const visible = useMemo(() => {
    if (!onlyTodo || mine.size === 0) return resolved
    return resolved
      .map((group) => ({
        ...group,
        entries: group.entries.filter(
          (e) => e.songId === undefined || !mine.has(recordKey(e.songId, e.pattern))
        )
      }))
      .filter((group) => group.entries.length > 0)
  }, [resolved, onlyTodo, mine])

  // 곡 DB가 늦게 들어온 경우 등, 목록을 받을 때 못 받은 자켓을 채운다
  useEffect(() => {
    let cancelled = false
    fetchJackets(songIdsOf(groups, index)).then(() => {
      if (!cancelled) setJackets(Object.fromEntries(jacketCache))
    })
    return () => {
      cancelled = true
    }
  }, [groups, index])

  const showTip = (
    target: HTMLElement,
    entry: ConstantEntry & { songId?: number },
    constant: string
  ): void => {
    const rect = target.getBoundingClientRect()
    const above = rect.top > 160
    setTip({
      entry,
      record:
        entry.songId === undefined ? undefined : mine.get(recordKey(entry.songId, entry.pattern)),
      constant,
      above,
      left: Math.min(
        Math.max(rect.left + rect.width / 2 - TIP_WIDTH / 2, TIP_MARGIN),
        window.innerWidth - TIP_WIDTH - TIP_MARGIN
      ),
      top: above ? rect.top - TIP_MARGIN : rect.bottom + TIP_MARGIN
    })
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6 pb-2">
      <div className="flex items-center gap-2">
        {BUTTONS.map((b) => (
          <button
            key={b}
            onClick={() => setButton(b)}
            className={`rounded-lg px-4 py-1.5 text-base transition-colors ${
              b === button
                ? 'bg-(--ev-c-gray-3)'
                : 'bg-(--color-background-soft) opacity-70 hover:opacity-100'
            }`}
          >
            {b}B
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setOnlyTodo((v) => !v)}
          disabled={mine.size === 0}
          title={
            mine.size === 0
              ? '설정에서 닉네임을 저장하면 내 기록과 비교할 수 있습니다'
              : '내 기록이 없는 곡만 보기'
          }
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-40 ${
            onlyTodo ? 'bg-(--ev-c-gray-3)' : 'bg-(--color-background-soft) hover:brightness-125'
          }`}
        >
          안 한 곡만
        </button>
        {fetchedAt && (
          <span className="shrink-0 text-sm opacity-50">
            {stale ? '새로 받지 못해 저장된 표를 보여 줍니다 · ' : ''}
            {new Date(fetchedAt).toLocaleString('ko-KR', {
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}{' '}
            기준
          </span>
        )}
        <button
          onClick={() => load(true)}
          disabled={loading}
          title="새로고침"
          className="rounded p-2 transition-colors hover:bg-(--ev-c-gray-3) disabled:opacity-40"
        >
          <PiArrowClockwise className={`size-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {error ? (
          <p className="text-base opacity-70">{error}</p>
        ) : groups.length === 0 ? (
          loading ? null : (
            <p className="text-base opacity-70">{button}B 상수표가 비어 있습니다</p>
          )
        ) : (
          <div
            ref={listRef}
            className={`-mb-3 min-h-0 flex-1 overflow-auto pr-3 ${listFadeClass}`}
            onScroll={() => setTip(null)}
          >
            {visible.map((group) => (
              <section key={group.constant} className="mb-5">
                <h3 className="sticky top-0 z-20 flex items-baseline gap-3 bg-(--color-background) py-2 text-lg font-semibold">
                  <span>{group.constant}</span>
                  <span className="text-sm font-normal opacity-50">{group.entries.length}곡</span>
                </h3>
                <div className="grid grid-cols-[repeat(auto-fill,5rem)] gap-2">
                  {group.entries.map((entry, i) => {
                    const url = entry.songId === undefined ? undefined : jackets[entry.songId]
                    const record =
                      entry.songId === undefined
                        ? undefined
                        : mine.get(recordKey(entry.songId, entry.pattern))
                    return (
                      <div
                        key={`${entry.name}-${entry.pattern}-${i}`}
                        onMouseEnter={(e) => showTip(e.currentTarget, entry, group.constant)}
                        onMouseLeave={() => setTip(null)}
                        onClick={() => {
                          if (entry.songId === undefined) return
                          setTip(null)
                          setSelected({
                            name: entry.name,
                            pattern: entry.pattern,
                            songId: entry.songId
                          })
                        }}
                        className={`group w-20 ${entry.songId === undefined ? '' : 'cursor-pointer'}`}
                      >
                        <div className="relative size-20 overflow-hidden rounded-lg bg-(--color-background-soft) ring-1 ring-white/5 transition-transform group-hover:scale-110">
                          {url ? (
                            <img
                              src={url}
                              alt={entry.name}
                              draggable={false}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-lg opacity-50">
                              {[...entry.name][0]}
                            </div>
                          )}
                          {record && (
                            <span
                              className={`absolute right-1 bottom-1 size-3 rounded-full ring-2 ring-black/60 ${clearDot(record).color}`}
                            />
                          )}
                          <span
                            className={`absolute top-0 left-0 rounded-br-md px-1.5 py-0.5 text-[10px] leading-none font-bold ${PATTERN_BADGE_COLORS[entry.pattern]}`}
                          >
                            {entry.pattern}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-center text-[10px] leading-tight break-all opacity-70">
                          {entry.name}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
        <PageLoading show={loading && groups.length === 0} />
      </div>

      <p className="shrink-0 text-center text-xs opacity-50">
        출처: 디제이맥스 리스펙트 V 마이너 갤러리 유저 참여 난이도표
      </p>

      {selected && (
        <SongDetail
          button={button}
          songId={selected.songId}
          name={selected.name}
          pattern={selected.pattern}
          jacketUrl={jackets[selected.songId]}
          onClose={() => setSelected(undefined)}
        />
      )}

      {tip && (
        <div
          className="pointer-events-none fixed z-50 w-64 rounded-lg border border-(--ev-c-gray-3) bg-(--ev-c-black-mute) p-3 text-sm shadow-lg"
          style={{
            left: tip.left,
            top: tip.top,
            transform: tip.above ? 'translateY(-100%)' : undefined
          }}
        >
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="break-words text-base font-semibold">{tip.entry.name}</span>
            {tip.entry.category && <span className="text-xs opacity-60">{tip.entry.category}</span>}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${PATTERN_COLORS[tip.entry.pattern]}`}
            >
              {tip.entry.pattern}
            </span>
            <span>Lv.{tip.entry.level}</span>
            <span className="opacity-60">· 상수 {tip.constant}</span>
          </div>
          {mine.size > 0 && (
            <p className="mt-2 flex items-center gap-2">
              <span className="opacity-60">내 기록</span>
              {tip.record ? (
                <>
                  <span className="font-semibold">{tip.record.score.toFixed(2)}%</span>
                  <span className="text-xs opacity-70">{clearDot(tip.record).label}</span>
                </>
              ) : (
                <span className="opacity-50">없음</span>
              )}
            </p>
          )}
          {(tip.entry.marks || tip.entry.note) && (
            <p className="mt-1 opacity-70">{`${tip.entry.marks} ${tip.entry.note}`.trim()}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default ConstantsPage
