import { BestRecord } from '../../../types/api'

// Highest Record의 한 줄: 조건을 만족하는 기록 중 층이 가장 높은 것
export const HIGHEST_CONDITIONS: { label: string; test: (r: BestRecord) => boolean }[] = [
  { label: 'Max Combo', test: (r) => r.maxCombo },
  { label: 'Perfect', test: (r) => r.score >= 100 },
  { label: 'Over 99.9%', test: (r) => r.score >= 99.9 },
  { label: 'Over 99.5%', test: (r) => r.score >= 99.5 },
  { label: 'Over 99%', test: (r) => r.score >= 99 },
  { label: 'Over 97%', test: (r) => r.score >= 97 },
  { label: 'Clear', test: () => true }
]

export function findHighest(
  records: BestRecord[],
  test: (r: BestRecord) => boolean
): BestRecord | undefined {
  let best: BestRecord | undefined
  for (const r of records) {
    if (r.floor === null || r.floorName === null || !test(r)) continue
    if (!best || r.floor > (best.floor ?? 0)) best = r
  }
  return best
}

// "14.1" -> 큰 별 14개 + 작은 별 1개
export function parseFloorName(floorName: string): { whole: number; fraction: number } {
  const [whole, fraction] = floorName.split('.')
  return { whole: Number(whole) || 0, fraction: Number(fraction) || 0 }
}
