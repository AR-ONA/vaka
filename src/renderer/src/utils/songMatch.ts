import { Song } from '../../../types/song'

const MAX_TYPO_DISTANCE = 2 // 시트 오타를 봐줄 글자 수 차이
const COLLABORATION = 'COLLABORATION'

// 대소문자, 공백, 기호, 전각/반각 차이를 무시한다
const normalize = (text: string): string =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]/gu, '')

// 시트는 곡명 뒤의 "(feat. …)"를 빼고 적는 경우가 많다
const stripFeat = (name: string): string => name.replace(/\s*\(feat\.[^)]*\)\s*$/i, '')

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return row[b.length]
}

export interface SongIndex {
  byName: Map<string, Song[]>
  keys: string[]
  dlcs: Set<string>
}

export function buildSongIndex(songs: Song[]): SongIndex {
  const byName = new Map<string, Song[]>()
  const dlcs = new Set<string>()
  for (const song of songs) {
    for (const key of new Set([normalize(song.name), normalize(stripFeat(song.name))])) {
      byName.set(key, [...(byName.get(key) ?? []), song])
    }
    dlcs.add(normalize(song.dlc))
  }
  return { byName, keys: [...byName.keys()], dlcs }
}

// 곡명이 같은 곡이 여럿이면 카테고리(팩)로 고른다. 못 고르면 undefined
function pickByCategory(candidates: Song[], category: string, index: SongIndex): Song | undefined {
  if (candidates.length === 1) return candidates[0]

  const key = normalize(category)
  const exact = candidates.filter((s) => normalize(s.dlc) === key)
  if (exact.length === 1) return exact[0]

  // "TECHNIKA"처럼 팩 이름의 앞부분만 적은 경우
  const prefix = candidates.filter((s) => key !== '' && normalize(s.dlc).startsWith(key))
  if (prefix.length === 1) return prefix[0]

  // 팩 이름이 아닌 콜라보 작품명(ONGEKI, EZ2ON 등)이면 COLLABORATION 팩으로 본다
  if (!index.dlcs.has(key)) {
    const collab = candidates.filter((s) => s.dlc === COLLABORATION)
    if (collab.length === 1) return collab[0]
  }
  return undefined
}

// 시트의 곡명과 카테고리로 곡 DB의 곡을 찾는다. 오타는 가장 가까운 곡이 하나일 때만 봐준다
export function findSong(index: SongIndex, name: string, category: string): Song | undefined {
  // 이름 그대로 먼저, 안 되면 "(feat. …)"를 뗀 이름으로 찾는다
  const key = normalize(stripFeat(name))
  for (const exactKey of new Set([normalize(name), key])) {
    const candidates = index.byName.get(exactKey)
    const song = candidates && pickByCategory(candidates, category, index)
    if (song) return song
  }

  let best: string | undefined
  let bestDistance = MAX_TYPO_DISTANCE + 1
  let tied = false
  for (const candidate of index.keys) {
    if (Math.abs(candidate.length - key.length) > MAX_TYPO_DISTANCE) continue
    const distance = editDistance(key, candidate)
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
      tied = false
    } else if (distance === bestDistance) tied = true
  }
  if (best === undefined || tied || key.length < 3) return undefined
  return pickByCategory(index.byName.get(best)!, category, index)
}
