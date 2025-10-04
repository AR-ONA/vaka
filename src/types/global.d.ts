import type { SongData } from "../api/api";

export {};

declare global {
  interface Window {
    electronAPI: {
      close: () => void;
      minimize?: () => void;
      maximize?: () => void;
      fetchSongs: () => Promise<SongData>;
      fetchTiers: () => Promise<any>; // TODO: Type 추가 (index.ts)
      fetchBoards: () => Promise<any>; // TODO: me too!
    };
  }
}
