import { create } from 'zustand'
import { SongData } from 'src/types/song'

interface DataState {
  songs: SongData
  boards: unknown
  tiers: unknown
  setData: (data: { songs: SongData; boards: unknown; tiers: unknown }) => void
}

export const useDataStore = create<DataState>((set) => ({
  songs: { data: [] },
  boards: {},
  tiers: {},
  setData: (data) => set(data)
}))
