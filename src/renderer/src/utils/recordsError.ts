import { BestResult } from '../../../types/api'

// 서버 오류를 사용자가 읽을 수 있는 문장으로 바꾼다 (유저 기록 조회 API V2 문서 기준)
export function describeRecordsError(result: BestResult): string {
  if (result.errorCode === 101) return '유저를 찾을 수 없습니다. 설정에서 닉네임을 확인하세요'
  if (result.status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도하세요'
  if (result.status !== undefined && result.status >= 500) {
    return 'V-Archive 서버에 오류가 있습니다. 잠시 후 다시 시도하세요'
  }
  return result.message ?? '기록을 불러오지 못했습니다'
}
