import { useState, useEffect, useRef } from 'react';
import { Cassette, Track } from '../services/mockData';
import {
  startSpotifyPlayback,
  setSpotifyVolume
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
  token: string | null
): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFF, setIsFF] = useState(false);
  const [isREW, setIsREW] = useState(false);
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

  const isDeckEmpty = cassette === null || !token;

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
             // The user skipped past the end of the current side!
             // We should stop playback and set hasFinishedSide = true
             playerRef.current?.pause();
             setIsPlaying(false);
             setHasFinishedSide(true);
             setSideTime(sideDuration); // max out the visual progress
             return; // Stop updating state for the wrong side
          }

          // If valid, calculate sideTime relative to the current side
          let accumulated = 0;
          const startIndex = isSideA ? 0 : half;
          for (let i = startIndex; i < absoluteIdx; i++) {
            accumulated += cassette?.tracks[i]?.duration ?? 0;
          }
          
          setActiveTrackIndex(Math.max(0, absoluteIdx - startIndex));
          setSideTime(accumulated + positionSec);
          setHasFinishedSide(false);
        }

        // Detect end of playlist context
        if (state.paused && state.position === 0 && !state.track_window.current_track) {
          setHasFinishedSide(true);
          setIsPlaying(false);
        }
      });

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error('[Spotify SDK] Init error:', message);
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('[Spotify SDK] Auth error:', message);
      });

      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('[Spotify SDK] Account error (Premium required):', message);
        alert('Spotify Web Playback 需要 Premium 帳號。請確認您已訂閱 Spotify Premium！');
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
    if (isPlaying && !isFF && !isREW) {
      progressIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - lastKnownTimestampRef.current) / 1000;
        const estimated = lastKnownPositionRef.current + elapsed;
        setTrackPosition(estimated);
        setSideTime(prev => {
          const next = prev + 0.2;
          if (next >= sideDuration && sideDuration > 0) {
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
  }, [isPlaying, isFF, isREW, sideDuration]);

  // When a new Spotify cassette is loaded and SDK is ready, start playing
  useEffect(() => {
    if (!cassette?.isSpotifyPlaylist || !cassette.spotifyPlaylistId || !token || !sdkReady || !deviceIdRef.current) return;

    setHasFinishedSide(false);
    setSideTime(0);
    setTrackPosition(0);

    const contextUri = `spotify:playlist:${cassette.spotifyPlaylistId}`;
    // Offset by side: Side B starts at the halfway point of the playlist
    const half = Math.ceil(cassette.tracks.length / 2);
    const startOffset = currentSide === 'B' ? half : 0;

    startSpotifyPlayback(token, deviceIdRef.current, contextUri, startOffset)
      .then(() => {
        console.log('[Spotify SDK] Playback started for', contextUri);
      })
      .catch(err => {
        console.error('[Spotify SDK] Failed to start playback:', err);
      });
  }, [cassette?.id, currentSide, sdkReady]);

  // Fast Forward / Rewind: Spotify uses skip next/previous track triggers directly on button press

  // Sync volume changes to the SDK
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
    if (token && sdkReady) {
      setSpotifyVolume(token, volume).catch(() => {});
    }
  }, [volume, sdkReady]);

  // Reset on cassette/side change
  useEffect(() => {
    setSideTime(0);
    setHasFinishedSide(false);
    setIsPlaying(false);
    setIsFF(false);
    setIsREW(false);
  }, [cassette?.id, currentSide]);

  // Action methods
  const play = () => {
    if (isDeckEmpty || !playerRef.current) return;
    if (!sdkReady) {
      alert('Spotify 播放器尚未就緒，請稍候再試！');
      return;
    }
    setIsFF(false);
    setIsREW(false);
    playerRef.current.resume().then(() => setIsPlaying(true));
  };

  const pause = () => {
    if (!playerRef.current) return;
    playerRef.current.pause().then(() => setIsPlaying(false));
  };

  const stop = () => {
    setIsPlaying(false);
    setIsFF(false);
    setIsREW(false);
    if (playerRef.current) {
      playerRef.current.pause();
    }
  };

  const startFF = () => {
    if (isDeckEmpty || !playerRef.current) return;
    playerRef.current.nextTrack().then(() => {
      console.log('[Spotify SDK] Skipped to next track');
    }).catch((err: any) => {
      console.error('[Spotify SDK] Failed to skip to next track:', err);
    });
  };

  const stopFF = () => {};

  const startREW = () => {
    if (isDeckEmpty || !playerRef.current) return;
    playerRef.current.previousTrack().then(() => {
      console.log('[Spotify SDK] Skipped to previous track');
    }).catch((err: any) => {
      console.error('[Spotify SDK] Failed to skip to previous track:', err);
    });
  };

  const stopREW = () => {};

  const setVolume = (vol: number) => {
    setVolumeState(Math.max(0, Math.min(1, vol)));
  };

  const triggerFlip = () => {
    setHasFinishedSide(false);
  };

  return {
    isPlaying,
    isFF,
    isREW,
    sideTime,
    sideDuration,
    activeTrack,
    activeTrackIndex,
    trackPosition,
    volume,
    play,
    pause,
    stop,
    startFF,
    stopFF,
    startREW,
    stopREW,
    setVolume,
    analyser: null,   // SDK uses its own audio pipeline, no Web Audio API access
    isDeckEmpty,
    triggerFlip,
    hasFinishedSide
  };
}
