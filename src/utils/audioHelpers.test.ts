import { describe, it, expect } from 'vitest';
import { getTrackAtTime } from './audioHelpers';
import { Track } from '../services/mockData';

const mockTracks: Track[] = [
  { id: 'track-1', title: 'Song One', artist: 'Artist A', duration: 30, url: 'url-1' },
  { id: 'track-2', title: 'Song Two', artist: 'Artist B', duration: 45, url: 'url-2' },
  { id: 'track-3', title: 'Song Three', artist: 'Artist C', duration: 60, url: 'url-3' },
];

const totalDuration = 135; // 30 + 45 + 60

describe('getTrackAtTime 核心音軌時間計算', () => {
  it('播放剛開始 (0秒) 時應為第一首歌的起點', () => {
    const result = getTrackAtTime(0, mockTracks, totalDuration);
    expect(result.track).not.toBeNull();
    expect(result.track?.id).toBe('track-1');
    expect(result.index).toBe(0);
    expect(result.offset).toBe(0);
  });

  it('播放第一首歌中間時應正確定位並回傳偏移秒數', () => {
    const result = getTrackAtTime(15, mockTracks, totalDuration);
    expect(result.track?.id).toBe('track-1');
    expect(result.index).toBe(0);
    expect(result.offset).toBe(15);
  });

  it('播放第一首歌快結束 (29秒) 時仍應為第一首歌', () => {
    const result = getTrackAtTime(29, mockTracks, totalDuration);
    expect(result.track?.id).toBe('track-1');
    expect(result.index).toBe(0);
    expect(result.offset).toBe(29);
  });

  it('播放時間剛好切換 (30秒) 時應正確過渡到第二首歌', () => {
    const result = getTrackAtTime(30, mockTracks, totalDuration);
    expect(result.track?.id).toBe('track-2');
    expect(result.index).toBe(1);
    expect(result.offset).toBe(0);
  });

  it('播放第二首歌中間 (50秒) 時應正確定位', () => {
    const result = getTrackAtTime(50, mockTracks, totalDuration);
    expect(result.track?.id).toBe('track-2');
    expect(result.index).toBe(1);
    expect(result.offset).toBe(20); // 50 - 30
  });

  it('播放時間切換到第三首歌 (75秒) 時應正確過渡到第三首歌', () => {
    const result = getTrackAtTime(75, mockTracks, totalDuration);
    expect(result.track?.id).toBe('track-3');
    expect(result.index).toBe(2);
    expect(result.offset).toBe(0); // 75 - (30 + 45)
  });

  it('播放時間超出或等於總長度時，應返回最後一首歌曲的結束點', () => {
    const resultExceed = getTrackAtTime(150, mockTracks, totalDuration);
    expect(resultExceed.track?.id).toBe('track-3');
    expect(resultExceed.index).toBe(2);
    expect(resultExceed.offset).toBe(60); // 第三首歌的長度

    const resultEqual = getTrackAtTime(totalDuration, mockTracks, totalDuration);
    expect(resultEqual.track?.id).toBe('track-3');
    expect(resultEqual.index).toBe(2);
    expect(resultEqual.offset).toBe(60);
  });

  it('防禦性測試：若曲目清單為空，應回傳 null 音軌且 index 為 -1', () => {
    const result = getTrackAtTime(10, [], 0);
    expect(result.track).toBeNull();
    expect(result.index).toBe(-1);
    expect(result.offset).toBe(0);
  });
});
