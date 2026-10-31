export type Pattern = 'NM' | 'HD' | 'MX' | 'SC'

// 어두운 배경에 맞춰 옅은 배경 + 같은 계열 글씨로 통일한다
// 자켓 같은 이미지 위에 얹을 때는 배경이 비치지 않도록 진한 색을 쓴다
export const PATTERN_BADGE_COLORS: Record<Pattern, string> = {
  NM: 'bg-amber-500 text-black',
  HD: 'bg-orange-500 text-white',
  MX: 'bg-red-500 text-white',
  SC: 'bg-purple-500 text-white'
}

export const PATTERN_COLORS: Record<Pattern, string> = {
  NM: 'bg-amber-400/15 text-amber-300',
  HD: 'bg-orange-400/15 text-orange-300',
  MX: 'bg-red-400/15 text-red-300',
  SC: 'bg-purple-400/15 text-purple-300'
}
