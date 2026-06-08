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
  { name: '馬克筆紅 (Marker Red)', value: '#c72c2c' }
];

// Pre-defined full-length cassette tapes
export const DEFAULT_CASSETTES: Cassette[] = [
  {
    id: 'default-vaporwave',
    title: 'VAPORWAVE DREAM // 蒸氣夢境',
    artist: 'Vapor Wave Club',
    shellColor: '#ff007f', // Neon Pink
    stickerColor: '#ecebe4',
    stickerPattern: 'stripes',
    labelTextColor: '#1a2b7c',
    tracks: [
      {
        id: 'vw-1',
        title: 'SoundHelix Synth wave Vol. 1',
        artist: 'Helix Club',
        duration: 372,
        url: 'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3'
      },
      {
        id: 'vw-2',
        title: 'Liquid Electronic Dreams',
        artist: 'Helix Club',
        duration: 423,
        url: 'https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3'
      },
      {
        id: 'vw-3',
        title: 'Cyber Sunset Boulevard',
        artist: 'Helix Club',
        duration: 302,
        url: 'https://cdn.freesound.org/previews/320/320654_5260872-lq.mp3'
      },
      {
        id: 'vw-4',
        title: 'Retro Digital Ocean Drive',
        artist: 'Helix Club',
        duration: 344,
        url: 'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3'
      }
    ]
  },
  {
    id: 'default-lofi',
    title: 'LO-FI CHILL BEATS // 像素自習室',
    artist: 'Lofi Chiller',
    shellColor: '#4b4b4e', // Retro Gray
    stickerColor: '#ff5e36', // Sunset Orange
    stickerPattern: 'grid',
    labelTextColor: '#1d1d1f',
    tracks: [
      {
        id: 'lf-1',
        title: 'Rainy Cafe Afternoon',
        artist: 'Sound Helix',
        duration: 344,
        url: 'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3'
      },
      {
        id: 'lf-2',
        title: 'Late Night Coding',
        artist: 'Sound Helix',
        duration: 302,
        url: 'https://cdn.freesound.org/previews/320/320654_5260872-lq.mp3'
      },
      {
        id: 'lf-3',
        title: 'Retro Arcade Coffee',
        artist: 'Sound Helix',
        duration: 401,
        url: 'https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3'
      }
    ]
  },
  {
    id: 'default-arcade',
    title: '8-BIT ARCADE CLASSICS // 像素冒險',
    artist: 'Chiptune Hero',
    shellColor: '#1a1a1c', // Matte Black
    stickerColor: '#76e5b1', // Mint Green
    stickerPattern: 'waves',
    labelTextColor: '#c72c2c',
    tracks: [
      {
        id: 'ac-1',
        title: '8-Bit Synth Adventure',
        artist: 'Sound Helix',
        duration: 401,
        url: 'https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3'
      },
      {
        id: 'ac-2',
        title: 'Stage 2 Boss Fight',
        artist: 'Sound Helix',
        duration: 360,
        url: 'https://cdn.freesound.org/previews/320/320654_5260872-lq.mp3'
      },
      {
        id: 'ac-3',
        title: 'Victory Lap Theme',
        artist: 'Sound Helix',
        duration: 372,
        url: 'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3'
      }
    ]
  }
];
