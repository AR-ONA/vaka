import { create } from 'zustand'
import { Song } from 'src/types/song'

interface DataState {
  songs: Song[]
  boards: unknown
  tiers: unknown
  setData: (data: { songs: Song[]; boards: unknown; tiers: unknown }) => void
}

export const useDataStore = create<DataState>((set) => ({
  songs: [],
  boards: {},
  tiers: {},
  setData: (data) => set(data)
}))
