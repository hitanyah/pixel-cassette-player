import { useState, useEffect, useRef } from 'react';
import { Cassette, Track } from '../services/mockData';
import { getTrackAtTime as calculateTrackAtTime } from '../utils/audioHelpers';

export interface UseAudioPlayerReturn {
  isPlaying: boolean;

  sideTime: number; // current position in seconds on this side
  sideDuration: number; // total duration of this side in seconds
  activeTrack: Track | null;
  activeTrackIndex: number; // index of track on the current side
  trackPosition: number; // position in seconds inside the active track
  volume: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
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

  const [sideTime, setSideTime] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [hasFinishedSide, setHasFinishedSide] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const progressIntervalRef = useRef<number | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);

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
  const getTrackAtTime = (time: number) => calculateTrackAtTime(time, sideTracks, sideDuration);

  const { track: activeTrack, index: activeTrackIndex, offset: trackPosition } = getTrackAtTime(sideTime);

  // Initialize Audio Element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.autoplay = false;
    audioRef.current = audio;

    // Handle track ended
    audio.onended = () => {
      setSideTime((prev) => {
        const { index } = getTrackAtTime(prev);
        if (index < sideTracks.length - 1) {
          let accumulated = 0;
          for (let i = 0; i <= index; i++) {
            accumulated += sideTracks[i].duration;
          }
          if (audioRef.current) audioRef.current.currentTime = 0;
          return accumulated;
        } else {
          setIsPlaying(false);
          setHasFinishedSide(true);
          return sideDuration;
        }
      });
    };

    return () => {
      audio.pause();
      audioRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      gainNodeRef.current = null;
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

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      gainNodeRef.current = gainNode;
    } catch (e) {
      console.warn("Failed to initialize AudioContext, visualizer might not work: ", e);
    }
  };

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
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

    // If the track changed, load new source
    if (currentTrackIdRef.current !== track.id) {
      if (track.isSpotifyPreview) {
        audioRef.current.crossOrigin = 'anonymous';
      } else {
        audioRef.current.removeAttribute('crossorigin');
      }
      audioRef.current.src = track.url;
      audioRef.current.load();
      currentTrackIdRef.current = track.id;
    }

    // Adjust current track time (if difference is significant to avoid stuttering)
    if (Math.abs(audioRef.current.currentTime - offset) > 1.2) {
      audioRef.current.currentTime = offset;
    }

    // Play if active
    if (isPlaying) {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioRef.current.play().catch((err) => {
        console.warn("Audio autoplay blocked or failed:", err);
      });
    }
  }, [sideTime, isPlaying]);

  // Sync play state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
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
    currentTrackIdRef.current = null;
  }, [cassette, currentSide]);

  // Track progress interval while playing normally
  useEffect(() => {
    if (isPlaying) {
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
  }, [isPlaying, sideTracks, sideDuration]);

  // Action methods
  const play = () => {
    if (isDeckEmpty) return;
    initAudioContext();
    if (audioContextRef.current) audioContextRef.current.resume();
    setIsPlaying(true);
  };

  const pause = () => {
    setIsPlaying(false);
  };

  const stop = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const applyJump = (newSideTime: number) => {
    setSideTime(newSideTime);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const nextTrack = () => {
    if (isDeckEmpty) return;
    const { index } = getTrackAtTime(sideTime);
    if (index < sideTracks.length - 1) {
      let accumulated = 0;
      for (let i = 0; i <= index; i++) {
        accumulated += sideTracks[i].duration;
      }
      applyJump(accumulated);
      if (!isPlaying) play();
    } else {
      setSideTime(sideDuration);
      setIsPlaying(false);
      setHasFinishedSide(true);
    }
  };

  const previousTrack = () => {
    if (isDeckEmpty) return;
    const { index, offset } = getTrackAtTime(sideTime);
    if (offset > 3) {
      let accumulated = 0;
      for (let i = 0; i < index; i++) {
        accumulated += sideTracks[i].duration;
      }
      applyJump(accumulated);
      if (!isPlaying) play();
    } else if (index > 0) {
      let accumulated = 0;
      for (let i = 0; i < index - 1; i++) {
        accumulated += sideTracks[i].duration;
      }
      applyJump(accumulated);
      if (!isPlaying) play();
    } else {
      applyJump(0);
      if (!isPlaying) play();
    }
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
    analyser: analyserRef.current,
    isDeckEmpty,
    triggerFlip,
    hasFinishedSide
  };
}
