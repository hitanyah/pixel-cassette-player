import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  generateRandomString, 
  getRedirectUri, 
  fetchSpotifyPlaylist,
  getStoredToken,
  transferSpotifyPlayback,
  shortenUrl
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

  describe('shortenUrl JSONP', () => {
    it('應正確藉由 JSONP 取得短網址', async () => {
      const longUrl = 'https://example.com/very-long-url';
      const mockShortUrl = 'https://is.gd/mockShort';

      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        const scriptNode = node as HTMLScriptElement;
        const urlObj = new URL(scriptNode.src);
        const callbackName = urlObj.searchParams.get('callback');
        
        if (callbackName && (window as any)[callbackName]) {
          setTimeout(() => {
            (window as any)[callbackName]({ shorturl: mockShortUrl });
          }, 10);
        }
        return node;
      });

      const res = await shortenUrl(longUrl);
      expect(res).toBe(mockShortUrl);
      
      appendChildSpy.mockRestore();
    });

    it('當 is.gd API 回傳錯誤訊息時應丟出異常', async () => {
      const longUrl = 'https://example.com/invalid';
      const mockError = 'Error: URL is invalid';

      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        const scriptNode = node as HTMLScriptElement;
        const urlObj = new URL(scriptNode.src);
        const callbackName = urlObj.searchParams.get('callback');
        
        if (callbackName && (window as any)[callbackName]) {
          setTimeout(() => {
            (window as any)[callbackName]({ errormessage: mockError });
          }, 10);
        }
        return node;
      });

      await expect(shortenUrl(longUrl)).rejects.toThrow(mockError);
      
      appendChildSpy.mockRestore();
    });
  });
});
