export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  url: string;      // Audio file URL (MP3 preview or full mp3)
  isSpotifyPreview?: boolean;
}

export interface Cassette {
  id: string;
  title: string;
  artist: string;
  tracks: Track[];
  shellColor: string;      // CSS color for cassette shell
  stickerColor: string;    // CSS color for label sticker
  stickerPattern: 'solid' | 'stripes' | 'grid' | 'waves'; // Visual sticker pattern
  labelTextColor: string;  // CSS color for font
  isSpotifyPlaylist?: boolean;
  spotifyPlaylistId?: string;
  spotifyUri?: string; // Full URI e.g. spotify:album:xxx
}

// Visual options for user to customize cassettes
export const CASSETTE_SHELL_COLORS = [
  { name: '復古灰 (Retro Gray)', value: '#4b4b4e' },
  { name: '霓虹粉 (Neon Pink)', value: '#ff007f' },
  { name: '電子藍 (Cyber Blue)', value: '#00f3ff' },
  { name: '像素綠 (Matrix Green)', value: '#39ff14' },
  { name: '暗夜黑 (Matte Black)', value: '#1a1a1c' },
  { name: '香蕉黃 (Retro Yellow)', value: '#ffd300' }
];

export const CASSETTE_STICKER_COLORS = [
  { name: '復古白 (Off-White)', value: '#ecebe4' },
  { name: '落日橘 (Sunset Orange)', value: '#ff5e36' },
  { name: '薄荷綠 (Mint Green)', value: '#76e5b1' },
  { name: '深邃藍 (Deep Blue)', value: '#1a3c40' },
  { name: '夢幻紫 (Vapor Violet)', value: '#b55fe6' }
];

export const CASSETTE_STICKER_PATTERNS = [
  { name: '經典素色 (Solid)', value: 'solid' },
  { name: '復古條紋 (Retro Stripes)', value: 'stripes' },
  { name: '像素網格 (Grid)', value: 'grid' },
  { name: '電音聲波 (Waves)', value: 'waves' }
];

export const CASSETTE_TEXT_COLORS = [
  { name: '鉛筆黑 (Pencil Black)', value: '#1d1d1f' },
  { name: '原子筆藍 (Ink Blue)', value: '#1a2b7c' },
  { name: '馬克筆紅 (Marker Red)', value: '#c72c2c' },
  { name: '立可白 (Correction Fluid White)', value: '#f4f4f5' }
];

// Pre-defined full-length cassette tapes
export const DEFAULT_CASSETTES: Cassette[] = [
  {
    id: 'default-8bit',
    title: '8-BIT ADVENTURE // 勇者鬥惡龍',
    artist: 'Retro Gamer',
    shellColor: '#39ff14', // Matrix Green
    stickerColor: '#ecebe4',
    stickerPattern: 'grid',
    labelTextColor: '#1a2b7c',
    tracks: [
      {
        id: '8bit-1',
        title: 'Insert Coin',
        artist: 'Retro Gamer',
        duration: 19,
        url: import.meta.env.BASE_URL + 'audio/8bit-1.mp3'
      },
      {
        id: '8bit-2',
        title: 'Level 1: Green Hill',
        artist: 'Retro Gamer',
        duration: 36,
        url: import.meta.env.BASE_URL + 'audio/8bit-2.mp3'
      },
      {
        id: '8bit-3',
        title: 'Boss Battle',
        artist: 'Retro Gamer',
        duration: 196,
        url: import.meta.env.BASE_URL + 'audio/8bit-3.mp3'
      },
      {
        id: '8bit-4',
        title: 'Stage Clear',
        artist: 'Retro Gamer',
        duration: 23,
        url: import.meta.env.BASE_URL + 'audio/8bit-4.mp3'
      }
    ]
  }
];
