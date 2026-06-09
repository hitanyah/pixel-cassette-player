import { Cassette, Track } from './mockData';

interface SpotifyArtist {
  name: string;
}

interface SpotifyTrackItem {
  id?: string;
  name: string;
  artists?: SpotifyArtist[];
  duration_ms: number;
  preview_url: string | null;
}


// Fallback audio tracks for Spotify songs without preview_urls
// Using Freesound CDN (CORS-enabled, verified working)
const FALLBACK_PREVIEW_URLS = [
  'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3',
  'https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3',
  'https://cdn.freesound.org/previews/320/320654_5260872-lq.mp3',
  'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3',
  'https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3',
  'https://cdn.freesound.org/previews/320/320654_5260872-lq.mp3'
];

// Helper to determine the redirect URI
export function getRedirectUri(): string {
  const url = window.location.origin + window.location.pathname;
  return url.endsWith('/') ? url : `${url}/`;
}

// PKCE Helpers
export function generateRandomString(length: number): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Redirect to Spotify Auth
export async function redirectToSpotifyAuth(clientId: string, redirectUri: string) {
  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem('spotify_code_verifier', verifier);
  localStorage.setItem('spotify_client_id', clientId);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: 'playlist-read-private playlist-read-collaborative streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state'
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Exchange authorization code for Access Token
export async function exchangeCodeForToken(
  clientId: string,
  code: string,
  redirectUri: string
): Promise<string> {
  const codeVerifier = localStorage.getItem('spotify_code_verifier') || '';
  
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error_description || 'Failed to exchange token');
  }

  const data = await response.json();
  
  // Store token and expiration
  const expireTime = Date.now() + data.expires_in * 1000;
  localStorage.setItem('spotify_access_token', data.access_token);
  localStorage.setItem('spotify_token_expires_at', expireTime.toString());
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh_token', data.refresh_token);
  }

  return data.access_token;
}

// Get valid token from localStorage (auto-refreshes or checks expiry)
export function getStoredToken(): string | null {
  const token = localStorage.getItem('spotify_access_token');
  const expiresAt = localStorage.getItem('spotify_token_expires_at');
  
  if (!token || !expiresAt) return null;

  if (Date.now() > parseInt(expiresAt)) {
    // Token expired! (Clear for re-auth)
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expires_at');
    return null;
  }

  return token;
}

// ─── Spotify Web Playback API Controls ────────────────────────────────────────

/** Transfer playback to a specific device */
export async function transferSpotifyPlayback(
  token: string,
  deviceId: string,
  play: boolean = false
): Promise<void> {
  const response = await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      device_ids: [deviceId],
      play: play
    })
  });

  if (!response.ok) {
    throw new Error('Failed to transfer Spotify playback');
  }
}

/** Start or resume playback on a specific device */
export async function startSpotifyPlayback(
  token: string,
  deviceId: string,
  contextUri: string,   // e.g. 'spotify:playlist:XXXXXX'
  offsetIndex: number = 0
): Promise<void> {
  const body: any = {
    position_ms: 0
  };

  if (contextUri.startsWith('spotify:track:')) {
    body.uris = [contextUri];
  } else {
    body.context_uri = contextUri;
    body.offset = { position: offsetIndex };
  }

  const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('Failed to start Spotify playback');
  }
}

/** Pause playback */
export async function pauseSpotifyPlayback(token: string): Promise<void> {
  await fetch('https://api.spotify.com/v1/me/player/pause', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
}

/** Seek to position in milliseconds */
export async function seekSpotifyPlayback(token: string, positionMs: number): Promise<void> {
  await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${Math.round(positionMs)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
}

/** Skip to next track */
export async function nextSpotifyTrack(token: string): Promise<void> {
  await fetch('https://api.spotify.com/v1/me/player/next', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}

/** Set volume (0-100) */
export async function setSpotifyVolume(token: string, volumePercent: number): Promise<void> {
  await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.round(volumePercent * 100)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
}

// Fetch Playlist Metadata & Tracks
export async function fetchSpotifyPlaylist(
  playlistUrlOrId: string,
  token: string
): Promise<Omit<Cassette, 'shellColor' | 'stickerColor' | 'stickerPattern' | 'labelTextColor'>> {
  let id = playlistUrlOrId.trim();
  let isAlbum = false;
  let isTrack = false;

  // Detect if the URL is an album, track, or playlist, and extract the base62 ID of any length (typically 21-23 chars)
  if (id.includes('album')) {
    isAlbum = true;
  } else if (id.includes('track')) {
    isTrack = true;
  }

  // Extract ID using a robust regex that matches the 22-character Spotify ID
  // It looks for a sequence of 22 alphanumeric characters, bounded by word boundaries or URL separators
  const idMatch = id.match(/([a-zA-Z0-9]{22})/);
  if (idMatch) {
    id = idMatch[1];
  } else {
    // Fallback: strip any query parameters just in case
    id = id.split('?')[0];
  }

  const endpoint = isAlbum
    ? `https://api.spotify.com/v1/albums/${id}`
    : isTrack
      ? `https://api.spotify.com/v1/tracks/${id}`
      : `https://api.spotify.com/v1/playlists/${id}`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    const typeStr = isAlbum ? '專輯' : isTrack ? '單曲' : '歌單';
    throw new Error(`無法抓取${typeStr}。請檢查 ID 或網址是否正確，且已設定為「公開」。`);
  }

  const data = await response.json();

  if (isAlbum) {
    // Parse Album Structure
    if (!data || !data.tracks || !data.tracks.items) {
      throw new Error('無法讀取專輯曲目資訊。');
    }

    const albumArtist = data.artists ? (data.artists as SpotifyArtist[]).map((a: SpotifyArtist) => a.name).join(', ') : 'Unknown Artist';
    const tracks: Track[] = (data.tracks.items as SpotifyTrackItem[]).map((track: SpotifyTrackItem, index: number) => {
      const artistNames = track.artists ? track.artists.map((a: SpotifyArtist) => a.name).join(', ') : albumArtist;
      return {
        id: track.id || `spotify-album-${index}`,
        title: track.name,
        artist: artistNames,
        duration: Math.round(track.duration_ms / 1000),
        url: track.preview_url || FALLBACK_PREVIEW_URLS[index % FALLBACK_PREVIEW_URLS.length],
        isSpotifyPreview: true
      };
    });

    return {
      id: `spotify-album-${data.id}-${Date.now()}`,
      title: data.name.toUpperCase(),
      artist: albumArtist,
      tracks: tracks,
      isSpotifyPlaylist: true,
      spotifyPlaylistId: data.id,
      spotifyUri: `spotify:album:${data.id}`
    };
  } else if (isTrack) {
    // Parse Track (Single) Structure
    if (!data || !data.name) {
      throw new Error('無法讀取單曲資訊。');
    }

    const artistNames = data.artists ? (data.artists as SpotifyArtist[]).map((a: SpotifyArtist) => a.name).join(', ') : 'Unknown Artist';
    const track: Track = {
      id: data.id || `spotify-track-${Date.now()}`,
      title: data.name,
      artist: artistNames,
      duration: Math.round(data.duration_ms / 1000),
      url: data.preview_url || FALLBACK_PREVIEW_URLS[0],
      isSpotifyPreview: true
    };

    return {
      id: `spotify-track-${data.id}-${Date.now()}`,
      title: data.name.toUpperCase(),
      artist: artistNames,
      tracks: [track],
      isSpotifyPlaylist: true,
      spotifyPlaylistId: data.id,
      spotifyUri: `spotify:track:${data.id}`
    };
  } else {
    // Parse Playlist Structure
    console.log('[Spotify Auth] Playlist data received:', data);
    
    // Some Spotify API responses return the tracks PagingObject under 'items' instead of 'tracks'
    let tracksData = data.tracks || data.items;
    
    // If Spotify returns a simplified playlist without items but with an href, fetch the tracks explicitly
    if (tracksData && !tracksData.items && tracksData.href) {
      console.log('[Spotify Auth] Tracks items missing, fetching from href:', tracksData.href);
      const tracksResponse = await fetch(tracksData.href, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tracksResponse.ok) {
        tracksData = await tracksResponse.json();
      }
    }

    if (!data || !tracksData || !tracksData.items) {
      console.error('[Spotify Auth] Missing tracks in data:', data);
      throw new Error('無法讀取歌單曲目資訊。請確認該網址指向一個「歌單(Playlist)」，而非單曲或專輯。');
    }

    const tracks: Track[] = (tracksData.items as any[])
      .map((item: any, index: number): Track | null => {
        // Handle standard PlaylistTrackObject (where track is nested in item.track),
        // Anomalous PlaylistTrackObject (where track is nested in item.item),
        // and direct TrackObject (where item IS the track)
        const track = (item.track !== undefined && item.track !== null) ? item.track
                    : (item.item !== undefined && item.item !== null) ? item.item
                    : item;

        // DEBUG LOG: See what the RAW item actually looks like
        if (index === 0) {
          console.log('[Spotify Debug] Raw item from API:', item);
          console.log('[Spotify Debug] Extracted track object:', track);
        }
        
        if (!track || !track.name) {
          return null;
        }

        const artistNames = track.artists ? track.artists.map((a: SpotifyArtist) => a.name).join(', ') : 'Unknown Artist';
        
        // If duration_ms is missing, fallback to 30 seconds (standard preview length)
        const trackDuration = track.duration_ms ? Math.round(track.duration_ms / 1000) : 30;

        return {
          id: track.id || `spotify-${index}`,
          title: track.name,
          artist: artistNames,
          duration: trackDuration,
          url: track.preview_url || FALLBACK_PREVIEW_URLS[index % FALLBACK_PREVIEW_URLS.length],
          isSpotifyPreview: !!track.preview_url
        };
      })
      .filter((t): t is Track => t !== null);

    if (tracks.length === 0 && tracksData.items && tracksData.items.length > 0) {
      // Dump the first raw item to the screen so we can see what the Spotify API actually returned!
      const debugDump = JSON.stringify(tracksData.items[0], null, 2);
      throw new Error(`無法解析曲目！Spotify 似乎回傳了未知的格式或所有歌曲皆失效。\n偵錯資料:\n${debugDump}`);
    }

    return {
      id: `spotify-${data.id}-${Date.now()}`,
      title: data.name.toUpperCase(),
      artist: data.owner.display_name || 'Spotify User',
      tracks: tracks,
      isSpotifyPlaylist: true,
      spotifyPlaylistId: data.id,
      spotifyUri: `spotify:playlist:${data.id}`
    };
  }
}

/**
 * URL 短網址縮短（已移除）。
 * is.gd 等公共短網址服務的防垃圾過濾器會主動拒絕含有 Base64 字串的 URL，
 * 因此改用 URL-safe Base64 gzip 壓縮直接分享，網址已足夠精簡。
 * @deprecated - 保留介面供測試向下相容，實際不再呼叫
 */
export function shortenUrl(_longUrl: string): Promise<string> {
  return Promise.reject(new Error('短網址服務已停用'));
}

/**
 * 使用瀏覽器原生 CompressionStream (gzip) 壓縮字串，
 * 輸出 **URL-safe Base64**（`+`→`-`，`/`→`_`，去除 `=` 補位）。
 * URL-safe 格式不含需要編碼的特殊字元，避免網址中出現 %2B/%2F/%3D，
 * 使分享網址更短、更乾淨、不易被反垃圾過濾器攔截。
 */
export async function compressString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(data);
  writer.close();

  const compressedChunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    compressedChunks.push(value);
  }

  const totalLen = compressedChunks.reduce((acc, c) => acc + c.length, 0);
  const combined = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of compressedChunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  let binary = '';
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i]);
  }

  // URL-safe Base64：替換 +/= 為 URL 安全字元，不需 encodeURIComponent
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 將 compressString 產生的 URL-safe Base64 字串解壓回原始字串。
 * 同時相容舊版標準 Base64（含 +/= 字元）以維持向下相容性。
 * 使用瀏覽器原生 DecompressionStream (gzip)。
 */
export async function decompressString(base64: string): Promise<string> {
  // 將 URL-safe Base64 還原為標準 Base64（再補回 = 補位）
  const standardBase64 = base64
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = standardBase64 + '='.repeat((4 - standardBase64.length % 4) % 4);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();

  const decompressedChunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    decompressedChunks.push(value);
  }

  const totalLen = decompressedChunks.reduce((acc, c) => acc + c.length, 0);
  const combined = new Uint8Array(totalLen);
  let offset = 0;
  for (const chunk of decompressedChunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder();
  return decoder.decode(combined);
}

/**
 * 判斷某個 URL 是否為本機或區域網路位址。
 * 公共短網址服務（如 is.gd）不支援本機/私有 IP，
 * 偵測到時應跳過短網址轉換，直接複製精簡長網址。
 */
export function isLocalOrPrivateUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
    // 10.x.x.x
    if (/^10\./.test(hostname)) return true;
    // 172.16.x.x – 172.31.x.x
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
    // 192.168.x.x
    if (/^192\.168\./.test(hostname)) return true;
    return false;
  } catch {
    return false;
  }
}
