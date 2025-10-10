import { SongData } from './song'

export interface Api {
  loadData: () => Promise<{
    songs: SongData
    boards: unknown
    tiers: unknown
  }>
  initNumOCR: () => Promise<void>

  minimize: () => void
  maximize: () => void
  unmaximize: () => void
  close: () => void
  onWindowStateChange: (
    callback: (state: 'maximized' | 'minimized' | 'normal') => void
  ) => () => void
}
