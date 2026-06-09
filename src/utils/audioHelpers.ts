import { Track } from '../services/mockData';

/**
 * 根據目前卡帶面的播放時間，找出對應的音軌、索引以及在該音軌內的偏移秒數。
 * 
 * @param time 目前卡帶面的播放秒數
 * @param sideTracks 目前卡帶面的所有音軌
 * @param sideDuration 目前卡帶面的總播放時間
 */
export function getTrackAtTime(
  time: number,
  sideTracks: Track[],
  sideDuration: number
): { track: Track | null; index: number; offset: number } {
  let accumulated = 0;
  for (let i = 0; i < sideTracks.length; i++) {
    const t = sideTracks[i];
    if (time >= accumulated && time < accumulated + t.duration) {
      return { track: t, index: i, offset: time - accumulated };
    }
    accumulated += t.duration;
  }
  // 如果播放時間已經達到或超出目前卡帶面的總長度
  if (sideTracks.length > 0 && time >= sideDuration) {
    return { 
      track: sideTracks[sideTracks.length - 1], 
      index: sideTracks.length - 1, 
      offset: sideTracks[sideTracks.length - 1].duration 
    };
  }
  return { track: null, index: -1, offset: 0 };
}
