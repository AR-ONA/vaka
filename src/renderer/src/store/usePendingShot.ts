import { create } from 'zustand'

export interface Shot {
  name: string
  bytes: Uint8Array
}

// 폴더 감시로 들어온 스크린샷. 업로드 화면이 가져가서 인식한다
interface PendingShotState {
  shot: Shot | null
  setShot: (shot: Shot | null) => void
}

export const usePendingShot = create<PendingShotState>((set) => ({
  shot: null,
  setShot: (shot) => set({ shot })
}))
