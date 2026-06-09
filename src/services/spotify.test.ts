import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  generateRandomString, 
  getRedirectUri, 
  fetchSpotifyPlaylist,
  getStoredToken,
  transferSpotifyPlayback,
  shortenUrl,
  compressString,
  decompressString,
  isLocalOrPrivateUrl
} from './spotify';

describe('Spotify Utility Helpers', () => {
  describe('generateRandomString', () => {
    it('應生成指定長度的隨機字串', () => {
      const len = 128;
      const str = generateRandomString(len);
      expect(str).toHaveLength(len);
      expect(typeof str).toBe('string');
    });

    it('每次生成應具有隨機性且包含字母與數字', () => {
      const str1 = generateRandomString(16);
      const str2 = generateRandomString(16);
      expect(str1).not.toBe(str2);
      expect(str1).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('getRedirectUri', () => {
    beforeEach(() => {
      vi.stubGlobal('location', {
        origin: 'http://localhost:5173',
        pathname: '/pixel-cassette-player/'
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('應正確拼接目前的 origin 與 pathname', () => {
      const uri = getRedirectUri();
      expect(uri).toBe('http://localhost:5173/pixel-cassette-player/');
    });

    it('若路徑不以斜線結尾，應自動補上斜線', () => {
      vi.stubGlobal('location', {
        origin: 'http://localhost:5173',
        pathname: '/pixel-cassette-player'
      });
      const uri = getRedirectUri();
      expect(uri).toBe('http://localhost:5173/pixel-cassette-player/');
    });
  });

  describe('getStoredToken', () => {
    const mockStorage: Record<string, string> = {};

    beforeEach(() => {
      vi.stubGlobal('localStorage', {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, val: string) => { mockStorage[key] = val; },
        removeItem: (key: string) => { delete mockStorage[key]; }
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      // Clear mock state
      for (const k in mockStorage) {
        delete mockStorage[k];
      }
    });

    it('當 token 存在且未過期時應回傳 token', () => {
      localStorage.setItem('spotify_access_token', 'mock-token-123');
      localStorage.setItem('spotify_token_expires_at', (Date.now() + 60000).toString()); // 1分鐘後過期

      const token = getStoredToken();
      expect(token).toBe('mock-token-123');
    });

    it('當 token 存在但已過期時應回傳 null 並清除 localStorage', () => {
      localStorage.setItem('spotify_access_token', 'mock-expired-token');
      localStorage.setItem('spotify_token_expires_at', (Date.now() - 1000).toString()); // 1秒前過期

      const token = getStoredToken();
      expect(token).toBeNull();
      expect(localStorage.getItem('spotify_access_token')).toBeNull();
    });

    it('當 localStorage 為空時應回傳 null', () => {
      const token = getStoredToken();
      expect(token).toBeNull();
    });
  });
});

describe('fetchSpotifyPlaylist API 映射測試', () => {
  const mockToken = 'mock-access-token';
  let fetchSpy = vi.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('應正確解析與抓取 Spotify 單曲 (Track) 並轉換為卡帶格式', async () => {
    const mockTrackResponse = {
      id: '4PTG3Z6ehGkBF3zI7YSpNs',
      name: 'Never Gonna Give You Up',
      artists: [{ name: 'Rick Astley' }],
      duration_ms: 213000,
      preview_url: 'https://p.scdn.co/files/mock-preview.mp3'
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockTrackResponse
    } as Response);

    const result = await fetchSpotifyPlaylist(
      'https://open.spotify.com/track/4PTG3Z6ehGkBF3zI7YSpNs?si=xxxx',
      mockToken
    );

    // 驗證 API 呼叫點
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/tracks/4PTG3Z6ehGkBF3zI7YSpNs',
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` }
      })
    );

    // 驗證結構映射
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].title).toBe('Never Gonna Give You Up');
    expect(result.tracks[0].artist).toBe('Rick Astley');
    expect(result.tracks[0].duration).toBe(213); // 213000ms -> 213s
    expect(result.tracks[0].url).toBe('https://p.scdn.co/files/mock-preview.mp3');
    expect(result.isSpotifyPlaylist).toBe(true);
    expect(result.spotifyUri).toBe('spotify:track:4PTG3Z6ehGkBF3zI7YSpNs');
  });

  it('應正確解析與抓取 Spotify 歌單 (Playlist) 並轉換為卡帶格式', async () => {
    const mockPlaylistResponse = {
      id: '37i9dQZF1DX889olxQjjYH',
      name: 'Vaporwave Classics',
      owner: { display_name: 'Spotify User' },
      tracks: {
        items: [
          {
            track: {
              id: 'song-1-id',
              name: 'Resonance',
              artists: [{ name: 'HOME' }],
              duration_ms: 212000,
              preview_url: null // 將使用 Fallback URL
            }
          }
        ]
      }
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPlaylistResponse
    } as Response);

    const result = await fetchSpotifyPlaylist(
      'https://open.spotify.com/playlist/37i9dQZF1DX889olxQjjYH',
      mockToken
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/playlists/37i9dQZF1DX889olxQjjYH',
      expect.any(Object)
    );

    expect(result.title).toBe('Vaporwave Classics'.toUpperCase());
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].title).toBe('Resonance');
    expect(result.tracks[0].artist).toBe('HOME');
    expect(result.tracks[0].duration).toBe(212);
    // 應因無 preview_url 而退回到備用 url
    expect(result.tracks[0].url).toBeDefined();
    expect(result.tracks[0].isSpotifyPreview).toBe(false); // 不是實體 preview 而是備用音檔
    expect(result.spotifyUri).toBe('spotify:playlist:37i9dQZF1DX889olxQjjYH');
  });

  it('當 API 返回非 ok 狀態時應丟出對應錯誤', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({})
    } as Response);

    await expect(
      fetchSpotifyPlaylist('https://open.spotify.com/album/invalidId123456789012', mockToken)
    ).rejects.toThrow();
  });

  describe('transferSpotifyPlayback', () => {
    it('應呼叫轉移裝置 API', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        status: 204
      } as Response);

      await transferSpotifyPlayback(mockToken, 'device-123', true);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/player',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            device_ids: ['device-123'],
            play: true
          }),
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('當 API 錯誤時應丟出 Exception', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400
      } as Response);

      await expect(
        transferSpotifyPlayback(mockToken, 'device-123', true)
      ).rejects.toThrow('Failed to transfer Spotify playback');
    });
  });

  describe('shortenUrl（已停用）', () => {
    it('應立即 reject，短網址功能已移除', async () => {
      // shortenUrl 已停用（is.gd 主動拒絕含 Base64 的 URL），
      // 呼叫後應立即回傳 reject，不應嘗試 JSONP 請求
      await expect(shortenUrl('https://example.com/any-url')).rejects.toThrow('短網址服務已停用');
    });
  });

  describe('compressString / decompressString 壓縮解壓縮', () => {
    it('壓縮再解壓後應還原原始字串', async () => {
      const original = JSON.stringify({
        id: 'test-123',
        title: 'TEST TAPE',
        artist: 'Pixel Artist',
        shellColor: '#ff007f',
        stickerColor: '#ecebe4',
        stickerPattern: 'stripes',
        labelTextColor: '#000000',
        tracks: [
          { id: 't1', title: 'Track 1', artist: 'Artist A', duration: 210, url: 'https://example.com/track1.mp3' },
          { id: 't2', title: 'Track 2', artist: 'Artist B', duration: 180, url: 'https://example.com/track2.mp3' },
        ]
      });

      const compressed = await compressString(original);
      expect(typeof compressed).toBe('string');
      expect(compressed.length).toBeGreaterThan(0);
      // 壓縮後長度應小於原始字串（gzip 壓縮比應 > 0%）
      expect(compressed.length).toBeLessThan(original.length);

      const restored = await decompressString(compressed);
      expect(restored).toBe(original);
    });

    it('壓縮後的字串能正確進行 URL encodeURIComponent 並還原', async () => {
      const original = '{"title":"CYBER MIX","artist":"Neon User","tracks":[]}';
      const compressed = await compressString(original);
      // Simulate URL round-trip: encode then decode
      const encoded = encodeURIComponent(`v2.${compressed}`);
      const decoded = decodeURIComponent(encoded);
      expect(decoded.startsWith('v2.')).toBe(true);
      const gzipPart = decoded.slice(3);
      const restored = await decompressString(gzipPart);
      expect(restored).toBe(original);
    });

    it('對損壞的 base64 字串解壓應丟出異常', async () => {
      await expect(decompressString('not-valid-base64!!!')).rejects.toThrow();
    });
  });

  describe('isLocalOrPrivateUrl 本機/私有 IP 偵測', () => {
    it('localhost 應被識別為本機位址', () => {
      expect(isLocalOrPrivateUrl('http://localhost:5173/')).toBe(true);
    });

    it('127.0.0.1 應被識別為本機位址', () => {
      expect(isLocalOrPrivateUrl('http://127.0.0.1:3000/app')).toBe(true);
    });

    it('192.168.x.x 應被識別為私有位址', () => {
      expect(isLocalOrPrivateUrl('http://192.168.1.100:8080/')).toBe(true);
    });

    it('10.x.x.x 應被識別為私有位址', () => {
      expect(isLocalOrPrivateUrl('http://10.0.0.1/')).toBe(true);
    });

    it('172.16.x.x 應被識別為私有位址', () => {
      expect(isLocalOrPrivateUrl('http://172.16.254.1/')).toBe(true);
    });

    it('172.32.x.x 不應被識別為私有位址', () => {
      expect(isLocalOrPrivateUrl('http://172.32.0.1/')).toBe(false);
    });

    it('公開域名 (GitHub Pages) 不應被識別為本機位址', () => {
      expect(isLocalOrPrivateUrl('https://user.github.io/pixel-cassette-player/')).toBe(false);
    });

    it('公開網域 example.com 不應被識別為本機位址', () => {
      expect(isLocalOrPrivateUrl('https://example.com/app')).toBe(false);
    });
  });
});
