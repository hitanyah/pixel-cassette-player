import { useState, useEffect, useRef } from 'react';
import { Cassette, Track } from '../services/mockData';
import {
  startSpotifyPlayback
} from '../services/spotify';
import { UseAudioPlayerReturn } from './useAudioPlayer';

// Declare the global Spotify SDK types (loaded from the CDN script)
declare global {
  namespace Spotify {
    interface Player {
      new (options: any): Player;
      addListener(event: string, callback: any): void;
      connect(): Promise<boolean>;
      disconnect(): void;
      resume(): Promise<void>;
      pause(): Promise<void>;
      seek(position_ms: number): Promise<void>;
      setVolume(volume: number): Promise<void>;
      getCurrentState(): Promise<any>;
      nextTrack(): Promise<void>;
      previousTrack(): Promise<void>;
    }
  }
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

// State from Spotify player_state_changed event
interface SpotifyPlayerState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      id: string;
      name: string;
      duration_ms: number;
      artists: Array<{ name: string }>;
      album: { name: string };
    };
  };
  context?: {
    uri?: string;
  };
}

export function useSpotifyPlayer(
  cassette: Cassette | null,
  currentSide: 'A' | 'B',
  token: string | null,
  onAuthError?: () => void,
  showAlert?: (msg: string, title?: string) => void,
  showConfirm?: (msg: string, title?: string) => Promise<boolean>
): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [hasFinishedSide, setHasFinishedSide] = useState(false);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [trackPosition, setTrackPosition] = useState(0);
  const [sideTime, setSideTime] = useState(0);
  const [sdkReady, setSdkReady] = useState(false);

  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const currentStateRef = useRef<SpotifyPlayerState | null>(null);
  const lastKnownPositionRef = useRef(0);
  const lastKnownTimestampRef = useRef(Date.now());
  // Ref to guard against player_state_changed resetting the finished state (race condition)
  const sideFinishedRef = useRef(false);

  const isDeckEmpty = cassette === null;
  const isSpotifyDisconnected = cassette !== null && !token;

  // Compute sideTracks: first half on A, second half on B
  const sideTracks: Track[] = (() => {
    if (!cassette) return [];
    const half = Math.ceil(cassette.tracks.length / 2);
    return currentSide === 'A'
      ? cassette.tracks.slice(0, half)
      : cassette.tracks.slice(half);
  })();

  const sideDuration = sideTracks.reduce((acc, t) => acc + t.duration, 0);

  // Initialize SDK Player once
  useEffect(() => {
    if (!token) return;

    const initPlayer = () => {
      const player = new window.Spotify.Player({
        name: 'Retro Cassette Player 🎵',
        getOAuthToken: (cb: any) => { cb(token); },
        volume: volume
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('[Spotify SDK] Player ready, device_id:', device_id);
        deviceIdRef.current = device_id;
        setSdkReady(true);
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.warn('[Spotify SDK] Player not ready, device_id:', device_id);
        setSdkReady(false);
      });

      player.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
        if (!state) return;
        currentStateRef.current = state;

        // ★ 若這一面已播完並停止，忽略後續 SDK 狀態更新，防止自動跳下一首重置狀態
        if (sideFinishedRef.current) {
          if (!state.paused) {
            playerRef.current?.pause();
          }
          return;
        }
        
        const spotifyTrack = state.track_window.current_track;
        const positionSec = state.position / 1000;
        lastKnownPositionRef.current = positionSec;
        lastKnownTimestampRef.current = Date.now();

        setIsPlaying(!state.paused);
        setTrackPosition(positionSec);

        // Map the Spotify track to our internal Track type
        if (spotifyTrack) {
          const mappedTrack: Track = {
            id: spotifyTrack.id,
            title: spotifyTrack.name,
            artist: spotifyTrack.artists.map(a => a.name).join(', '),
            duration: Math.round(spotifyTrack.duration_ms / 1000),
            url: '',  // SDK manages audio directly
            isSpotifyPreview: true
          };
          setActiveTrack(mappedTrack);

          // Find this track's absolute index in the cassette
          const absoluteIdx = cassette?.tracks.findIndex(t => t.id === spotifyTrack.id || t.title === spotifyTrack.name) ?? -1;
          
          // Determine if this track belongs to the current side
          const half = Math.ceil((cassette?.tracks.length || 0) / 2);
          const isSideA = currentSide === 'A';
          const validForCurrentSide = isSideA ? (absoluteIdx < half) : (absoluteIdx >= half);

          if (absoluteIdx !== -1 && !validForCurrentSide) {
             // Spotify jumped to the other side's track → stop and mark side as finished
             sideFinishedRef.current = true;
             playerRef.current?.pause();
             setIsPlaying(false);
             setHasFinishedSide(true);
             setSideTime(sideDuration); // max out the visual progress
             return;
          }

          // If valid, calculate sideTime relative to the current side
          let accumulated = 0;
          const startIndex = isSideA ? 0 : half;
          for (let i = startIndex; i < absoluteIdx; i++) {
            accumulated += cassette?.tracks[i]?.duration ?? 0;
          }
          
          setActiveTrackIndex(Math.max(0, absoluteIdx - startIndex));
          setSideTime(accumulated + positionSec);
          // Only reset hasFinishedSide if we're genuinely resuming (not already finished)
          if (!sideFinishedRef.current) {
            setHasFinishedSide(false);
          }
        }

        // Detect end of playlist context
        if (state.paused && state.position === 0 && !state.track_window.current_track) {
          sideFinishedRef.current = true;
          setHasFinishedSide(true);
          setIsPlaying(false);
        }
      });

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('[Spotify SDK] Init error:', message);
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('[Spotify SDK] Auth error:', message);
        onAuthError?.();
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('[Spotify SDK] Account error (Premium required):', message);
        if (showAlert) {
          showAlert('Spotify Web Playback 需要 Premium 帳號。請確認您已訂閱 Spotify Premium！', '⚠️ PREMIUM REQUIRED');
        } else {
          alert('Spotify Web Playback 需要 Premium 帳號。請確認您已訂閱 Spotify Premium！');
        }
      });

      player.connect();
      playerRef.current = player;
    };

    // If SDK is already loaded, init immediately
    if (window.Spotify) {
      initPlayer();
    } else {
      // Otherwise wait for the SDK to call our callback
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
        deviceIdRef.current = null;
        setSdkReady(false);
      }
    };
  }, [token]);  // Re-init only when token changes

  // Smooth progress interpolation while playing
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - lastKnownTimestampRef.current) / 1000;
        const estimated = lastKnownPositionRef.current + elapsed;
        setTrackPosition(estimated);
        setSideTime(prev => {
          const next = prev + 0.2;
          if (next >= sideDuration && sideDuration > 0) {
            // ★ 關鍵修正：除了更新 UI 狀態外，還要真正暫停 Spotify SDK，
            //   防止 SDK 自動跳到下一首並觸發 player_state_changed 重置狀態
            sideFinishedRef.current = true;
            playerRef.current?.pause();
            setHasFinishedSide(true);
            setIsPlaying(false);
            return sideDuration;
          }
          return next;
        });
      }, 200);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, sideDuration]);

  // When a new Spotify cassette is loaded and SDK is ready, start playing
  useEffect(() => {
    if (!cassette?.isSpotifyPlaylist || !cassette.spotifyPlaylistId || !token || !sdkReady || !deviceIdRef.current) return;

    setHasFinishedSide(false);
    setSideTime(0);
    setTrackPosition(0);

    const contextUri = cassette.spotifyUri || `spotify:playlist:${cassette.spotifyPlaylistId}`;
    // Offset by side: Side B starts at the halfway point of the playlist
    const half = Math.ceil(cassette.tracks.length / 2);
    const startOffset = currentSide === 'B' ? half : 0;

    startSpotifyPlayback(token, deviceIdRef.current, contextUri, startOffset)
      .then(() => {
        console.log('[Spotify SDK] Playback started for', contextUri);
      })
      .catch(err => {
        console.error('[Spotify SDK] Failed to start playback:', err);
        if (err.message === 'UNAUTHORIZED') {
          onAuthError?.();
        }
      });
  }, [cassette?.id, currentSide, sdkReady]);

  // Sync volume changes to the SDK
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  // Reset on cassette/side change
  useEffect(() => {
    sideFinishedRef.current = false;  // 換卡帶或換面時，重置完成狀態守衛
    setSideTime(0);
    setHasFinishedSide(false);
    setIsPlaying(false);
  }, [cassette?.id, currentSide]);

  // Action methods
  const play = () => {
    if (!token) {
      if (showConfirm) {
        showConfirm('Spotify 連線已過期或未登入。是否現在前往「卡帶工作室」重新連接？', '🔌 RECONNECT SPOTIFY')
          .then(ok => {
            if (ok) onAuthError?.();
          });
      } else {
        if (window.confirm('Spotify 連線已過期或未登入。是否現在前往「卡帶工作室」重新連接？')) {
          onAuthError?.();
        }
      }
      return;
    }
    if (isDeckEmpty || !playerRef.current || !deviceIdRef.current) return;
    if (!sdkReady) {
      if (showAlert) {
        showAlert('Spotify 播放器尚未就緒，請稍候再試！', '⏳ PLEASE WAIT');
      } else {
        alert('Spotify 播放器尚未就緒，請稍候再試！');
      }
      return;
    }

    // 若該面已播放完畢，點選播放則從該面的第一首歌重新播放
    if (sideFinishedRef.current || hasFinishedSide || (sideDuration > 0 && sideTime >= sideDuration)) {
      sideFinishedRef.current = false;
      setHasFinishedSide(false);
      setSideTime(0);
      setTrackPosition(0);

      const contextUri = cassette.spotifyUri || `spotify:playlist:${cassette.spotifyPlaylistId}`;
      const half = Math.ceil(cassette.tracks.length / 2);
      const startOffset = currentSide === 'B' ? half : 0;

      startSpotifyPlayback(token, deviceIdRef.current, contextUri, startOffset)
        .then(() => {
          console.log('[Spotify SDK] Re-started playback for side', currentSide);
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('[Spotify SDK] Failed to restart playback:', err);
        });
      return;
    }

    sideFinishedRef.current = false;
    playerRef.current.resume().then(() => setIsPlaying(true));
  };

  const pause = () => {
    if (!playerRef.current) return;
    sideFinishedRef.current = false;
    playerRef.current.pause().then(() => setIsPlaying(false));
  };

  const stop = () => {
    sideFinishedRef.current = false;
    setIsPlaying(false);
    if (playerRef.current) {
      playerRef.current.pause();
    }
  };

  const nextTrack = () => {
    if (isDeckEmpty || !playerRef.current) return;
    sideFinishedRef.current = false;
    playerRef.current.nextTrack().then(() => {
      console.log('[Spotify SDK] Skipped to next track');
    }).catch((err: any) => {
      console.error('[Spotify SDK] Failed to skip to next track:', err);
    });
  };

  const previousTrack = () => {
    if (isDeckEmpty || !playerRef.current) return;
    sideFinishedRef.current = false;
    playerRef.current.previousTrack().then(() => {
      console.log('[Spotify SDK] Skipped to previous track');
    }).catch((err: any) => {
      console.error('[Spotify SDK] Failed to skip to previous track:', err);
    });
  };

  const setVolume = (vol: number) => {
    setVolumeState(Math.max(0, Math.min(1, vol)));
  };

  const triggerFlip = () => {
    setHasFinishedSide(false);
  };

  return {
    isPlaying,
    sideTime,
    sideDuration,
    activeTrack,
    activeTrackIndex,
    trackPosition,
    volume,
    play,
    pause,
    stop,
    nextTrack,
    previousTrack,
    setVolume,
    analyser: null,   // SDK uses its own audio pipeline, no Web Audio API access
    isDeckEmpty,
    triggerFlip,
    hasFinishedSide,
    isSpotifyDisconnected
  };
}
