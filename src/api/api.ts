import { fetch } from '@tauri-apps/plugin-http';

export const fetchSongData = async () => {
  const response = await fetch('https://v-archive.net/db/songs.json', {
    method: 'GET',
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export const fetchBoards = async () => {
  const response = await fetch('https://v-archive.net/db/boards.json', {
    method: 'GET',
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export const fetchTiers = async () => {
  const response = await fetch('https://v-archive.net/db/tiers.json', {
    method: 'GET',
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};