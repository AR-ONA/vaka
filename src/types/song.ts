export interface SongData {
  data: Song[]
}

export interface Song {
  title: string
  name: string
  composer: string
  dlcCode: string
  dlc: string
  patterns: Patterns
}

export interface Patterns {
  '4B'?: PatternModes
  '5B'?: PatternModes
  '6B'?: PatternModes
  '8B'?: PatternModes
}

export interface PatternModes {
  HD?: Pattern
  NM?: Pattern
  SC?: Pattern
  MX?: Pattern
}

export interface Pattern {
  level: number
  floor?: number
  rating?: number
}
