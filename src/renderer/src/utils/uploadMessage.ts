import { UploadScoreRequest, UploadScoreResult } from '../../../types/api'

export function uploadStatus(result: UploadScoreResult): 'updated' | 'kept' | 'failed' {
  if (!result.success) return 'failed'
  return result.update === false ? 'kept' : 'updated'
}

// 서버 응답(기록 등록 API 문서의 errorCode 기준)을 사용자가 읽을 수 있는 문장으로 바꾼다
export function describeUploadResult(
  result: UploadScoreResult,
  req: Pick<UploadScoreRequest, 'button' | 'pattern'>
): string {
  if (result.success) {
    return result.update === false
      ? '더 좋은 기록이 이미 있어서 갱신되지 않았습니다'
      : '업로드했습니다. 기록이 갱신되었습니다'
  }

  const { status, errorCode } = result
  const detail = typeof result.message === 'string' ? result.message : ''

  // 요청을 보내기 전에 막힌 경우 (계정 없음, 네트워크 오류 등)
  if (status === undefined) return detail || '업로드하지 못했습니다'

  if (errorCode === 201) return 'V-Archive에서 곡을 찾지 못했습니다. 곡 이름을 확인하세요'
  if (errorCode === 202) return '같은 제목의 곡이 여러 개라 곡을 특정할 수 없습니다'
  if (errorCode === 211) {
    return `이 곡에는 ${req.button}B ${req.pattern} 패턴이 등록되어 있지 않습니다. 버튼 수와 패턴을 확인하세요`
  }
  if (errorCode === 900) return `입력값이 올바르지 않습니다 (${detail})`
  if (status === 401 || status === 403) {
    return '인증에 실패했습니다. 설정에서 USER_NO와 API_TOKEN을 확인하세요'
  }
  if (status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도하세요'
  if (errorCode === 999 || status >= 500) {
    return 'V-Archive 서버에 오류가 있습니다. 잠시 후 다시 시도하세요'
  }

  return `업로드 실패: ${detail || '알 수 없는 오류'} (HTTP ${status}, 코드 ${errorCode ?? '-'})`
}
