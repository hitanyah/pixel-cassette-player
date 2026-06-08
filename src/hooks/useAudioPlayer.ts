import { useState, useEffect, useRef } from 'react';
import { Cassette, Track } from '../services/mockData';

export interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isFF: boolean;
  isREW: boolean;
  sideTime: number; // current position in seconds on this side
  sideDuration: number; // total duration of this side in seconds
  activeTrack: Track | null;
  activeTrackIndex: number; // index of track on the current side
  trackPosition: number; // position in seconds inside the active track
  volume: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  startFF: () => void;
  stopFF: () => void;
  startREW: () => void;
  stopREW: () => void;
  setVolume: (vol: number) => void;
  analyser: AnalyserNode | null;
  isDeckEmpty: boolean;
  triggerFlip: () => void;
  hasFinishedSide: boolean;
}

export function useAudioPlayer(
  cassette: Cassette | null,
  currentSide: 'A' | 'B'
): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFF, setIsFF] = useState(false);
  const [isREW, setIsREW] = useState(false);
  const [sideTime, setSideTime] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [hasFinishedSide, setHasFinishedSide] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rewIntervalRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Split tracks based on Side A or B
  const getSideTracks = (): Track[] => {
    if (!cassette) return [];
    const half = Math.ceil(cassette.tracks.length / 2);
    return currentSide === 'A' 
      ? cassette.tracks.slice(0, half) 
      : cassette.tracks.slice(half);
  };

  const sideTracks = getSideTracks();
  const sideDuration = sideTracks.reduce((acc, t) => acc + t.duration, 0);

  const isDeckEmpty = cassette === null;

  // Find track and offset at a given side time
  const getTrackAtTime = (time: number): { track: Track | null; index: number; offset: number } => {
    let accumulated = 0;
    for (let i = 0; i < sideTracks.length; i++) {
      const t = sideTracks[i];
      if (time >= accumulated && time < accumulated + t.duration) {
        return { track: t, index: i, offset: time - accumulated };
      }
      accumulated += t.duration;
    }
    // If we reached the end
    if (sideTracks.length > 0 && time >= sideDuration) {
      return { 
        track: sideTracks[sideTracks.length - 1], 
        index: sideTracks.length - 1, 
        offset: sideTracks[sideTracks.length - 1].duration 
      };
    }
    return { track: null, index: -1, offset: 0 };
  };

  const { track: activeTrack, index: activeTrackIndex, offset: trackPosition } = getTrackAtTime(sideTime);

  // Initialize Audio Element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.autoplay = false;
    audioRef.current = audio;

    // Handle track ended
    audio.onended = () => {
      // If we are playing and there's more time left on the side, move forward
      if (isPlaying && !isREW && !isFF) {
        setSideTime((prev) => {
          const nextTime = prev + 0.5; // push slightly forward to transition
          if (nextTime >= sideDuration) {
            setIsPlaying(false);
            setHasFinishedSide(true);
            return sideDuration;
          }
          return nextTime;
        });
      }
    };

    return () => {
      audio.pause();
      audioRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Setup Web Audio API Context (lazy load on user interaction)
  const initAudioContext = () => {
    if (audioContextRef.current || !audioRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // Small size for blocky pixel spectrum

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (e) {
      console.warn("Failed to initialize AudioContext, visualizer might not work: ", e);
    }
  };

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Sync sideTime changes to the audio element source
  useEffect(() => {
    if (!audioRef.current || sideTracks.length === 0) return;

    const { track, offset } = getTrackAtTime(sideTime);
    if (!track) {
      audioRef.current.pause();
      return;
    }

    const currentSrc = audioRef.current.src;
    // If the track URL changed, load new source
    if (currentSrc !== track.url) {
      if (track.isSpotifyPreview) {
        audioRef.current.crossOrigin = 'anonymous';
      } else {
        audioRef.current.removeAttribute('crossorigin');
      }
      audioRef.current.src = track.url;
      audioRef.current.load();
    }

    // Adjust current track time (if difference is significant to avoid stuttering)
    if (Math.abs(audioRef.current.currentTime - offset) > 1.2) {
      audioRef.current.currentTime = offset;
    }

    // Play if active
    if (isPlaying && !isREW) {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioRef.current.play().catch((err) => {
        console.warn("Audio autoplay blocked or failed:", err);
      });
    }
  }, [sideTime, isPlaying, isREW]);

  // Sync play state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying && !isREW && !isFF) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Reset sideTime on cassette or side change
  useEffect(() => {
    stop();
    setSideTime(0);
    setHasFinishedSide(false);
  }, [cassette, currentSide]);

  // Track progress interval while playing normally
  useEffect(() => {
    if (isPlaying && !isFF && !isREW) {
      progressIntervalRef.current = window.setInterval(() => {
        if (audioRef.current) {
          const { index } = getTrackAtTime(sideTime);
          let accumulated = 0;
          for (let i = 0; i < index; i++) {
            accumulated += sideTracks[i].duration;
          }
          const curTime = accumulated + audioRef.current.currentTime;
          
          if (curTime >= sideDuration) {
            setSideTime(sideDuration);
            setIsPlaying(false);
            setHasFinishedSide(true);
          } else {
            setSideTime(curTime);
          }
        }
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
  }, [isPlaying, isFF, isREW, sideTracks, sideDuration]);

  // Handle Fast Forward (FF)
  // We use HTML5 playbackRate = 4.0 for a funny high-pitched sped-up sound!
  useEffect(() => {
    if (!audioRef.current) return;

    if (isFF) {
      initAudioContext();
      if (audioContextRef.current) audioContextRef.current.resume();
      
      // Speed up play
      audioRef.current.playbackRate = 4.0;
      audioRef.current.play().catch(() => {});

      // Custom fast update interval
      progressIntervalRef.current = window.setInterval(() => {
        setSideTime((prev) => {
          const next = prev + 0.8; // Fast forward step
          if (next >= sideDuration) {
            stopFF();
            setIsPlaying(false);
            setHasFinishedSide(true);
            return sideDuration;
          }
          return next;
        });
      }, 100);
    } else {
      audioRef.current.playbackRate = 1.0;
      if (progressIntervalRef.current && !isPlaying) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current && !isPlaying) clearInterval(progressIntervalRef.current);
    };
  }, [isFF]);

  // Handle Rewind (REW)
  // HTML5 audio doesn't support negative playbackRate, so we mute, play a simulated ticking, and decrement time.
  useEffect(() => {
    if (!audioRef.current) return;

    if (isREW) {
      audioRef.current.pause();
      // Tick backward
      rewIntervalRef.current = window.setInterval(() => {
        setSideTime((prev) => {
          const next = prev - 1.2; // Rewind step
          if (next <= 0) {
            stopREW();
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (rewIntervalRef.current) {
        clearInterval(rewIntervalRef.current);
        rewIntervalRef.current = null;
      }
    }

    return () => {
      if (rewIntervalRef.current) clearInterval(rewIntervalRef.current);
    };
  }, [isREW]);

  // Action methods
  const play = () => {
    if (isDeckEmpty) return;
    initAudioContext();
    if (audioContextRef.current) audioContextRef.current.resume();
    setIsPlaying(true);
    setIsFF(false);
    setIsREW(false);
  };

  const pause = () => {
    setIsPlaying(false);
  };

  const stop = () => {
    setIsPlaying(false);
    setIsFF(false);
    setIsREW(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const startFF = () => {
    if (isDeckEmpty) return;
    setIsFF(true);
    setIsREW(false);
  };

  const stopFF = () => {
    setIsFF(false);
  };

  const startREW = () => {
    if (isDeckEmpty) return;
    setIsREW(true);
    setIsFF(false);
  };

  const stopREW = () => {
    setIsREW(false);
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
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
    analyser: analyserRef.current,
    isDeckEmpty,
    triggerFlip,
    hasFinishedSide
  };
}
