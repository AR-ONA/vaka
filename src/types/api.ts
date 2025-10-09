import { SongData } from './song'

export interface Api {
  loadData: () => Promise<{
    songs: SongData
    boards: unknown
    tiers: unknown
  }>
  initFontData: () => Promise<void>
}
