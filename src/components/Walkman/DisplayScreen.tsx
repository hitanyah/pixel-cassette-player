import React, { useEffect, useRef } from 'react';
import { Track } from '../../services/mockData';

interface DisplayScreenProps {
  activeTrack: Track | null;
  sideTime: number;
  isPlaying: boolean;

  analyser: AnalyserNode | null;
  currentSide: 'A' | 'B';
  isSpotifyStream?: boolean;
  hasFinishedSide?: boolean;
}

export const DisplayScreen: React.FC<DisplayScreenProps> = ({
  activeTrack,
  sideTime,
  isPlaying,
  analyser,
  currentSide,
  isSpotifyStream = false,
  hasFinishedSide = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Time formatter: MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser ? analyser.frequencyBinCount : 16;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      // Clear canvas
      ctx.fillStyle = '#030a05'; // very dark matrix green
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Fallback or idle visualizer (mock data)
        for (let i = 0; i < bufferLength; i++) {
          if (isPlaying) {
            // Dancing mock visualizer
            const offset = Date.now() * 0.005 + i * 0.5;
            dataArray[i] = Math.max(10, Math.sin(offset) * 80 + Math.random() * 50 + 80);
          } else {
            // Flat idle line
            dataArray[i] = 4;
          }
        }
      }

      // Draw pixelated bars
      const barWidth = 6;
      const barGap = 2;
      const startX = 4;
      const blockHeight = 4; // draw as pixel blocks
      const blockGap = 1;

      // Fit as many bars as possible on the canvas
      const numBars = Math.floor((canvas.width - startX * 2) / (barWidth + barGap));

      for (let i = 0; i < numBars; i++) {
        // Map data index to array
        const dataIdx = Math.floor((i / numBars) * bufferLength);
        const value = dataArray[dataIdx]; // 0 to 255
        
        // Normalize height to canvas height
        const maxHeight = canvas.height - 4;
        const targetHeight = (value / 255) * maxHeight;
        
        // Calculate number of discrete blocks to draw
        const numBlocks = Math.floor(targetHeight / (blockHeight + blockGap));

        for (let j = 0; j < numBlocks; j++) {
          const y = canvas.height - 2 - j * (blockHeight + blockGap) - blockHeight;
          const x = startX + i * (barWidth + barGap);

          // Color shifts as it goes higher (green -> yellow -> red)
          let fillStyle = '#39ff14'; // Led Green
          if (j > 5) fillStyle = '#ffdf00'; // Yellow
          if (j > 8) fillStyle = '#ff3b30'; // Red

          ctx.fillStyle = fillStyle;
          ctx.fillRect(x, y, barWidth, blockHeight);
        }
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, analyser]);

  return (
    <div 
      className="crt-container pixel-box-inset"
      style={{
        backgroundColor: '#030a05',
        height: '80px',
        width: '100%',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden'
      }}
    >
      <div className="crt-screen" style={{ width: '100%', height: '100%', display: 'flex', gap: '8px' }}>
        {/* LCD Info Left (Time & Playback status) */}
        <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Top Line: Mode Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'var(--font-pixel)', color: '#39ff14', opacity: 0.8 }}>
            <span>SIDE {currentSide}</span>
            <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {isSpotifyStream && (
                <span style={{ color: '#1db954', fontWeight: 'bold', animation: isPlaying ? 'pulse 1.5s infinite' : 'none' }}>
                  🎧 SPOTIFY
                </span>
              )}
              {isPlaying ? '▶ PLAY' : '■ STOP'}
            </span>
          </div>

          {/* Center Line: Big Retro Digits */}
          <div 
            className="font-lcd" 
            style={{ 
              fontSize: '36px', 
              color: '#39ff14', 
              lineHeight: '1', 
              marginTop: '4px',
              textShadow: '0 0 6px rgba(57,255,20,0.5)',
              letterSpacing: '1px'
            }}
          >
            {formatTime(sideTime)}
          </div>
        </div>

        {/* Visualizer Right */}
        <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
          {/* Track metadata marquee style */}
          <div 
            style={{ 
              overflow: 'hidden', 
              whiteSpace: 'nowrap', 
              fontSize: '8px', 
              fontFamily: 'var(--font-pixel)', 
              color: '#39ff14',
              backgroundColor: 'rgba(57,255,20,0.1)',
              padding: '2px 4px',
              height: '14px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {activeTrack ? (
              <div 
                className={hasFinishedSide ? "" : "marquee"}
                style={{ 
                  animation: hasFinishedSide ? 'blink 1s step-end infinite' : 'marquee 10s linear infinite',
                  whiteSpace: 'nowrap',
                  color: hasFinishedSide ? '#ffdf00' : '#39ff14'
                }}
              >
                {hasFinishedSide ? 'END OF TAPE - PRESS FLIP (⟳) TO CONTINUE' : `${activeTrack.title} - ${activeTrack.artist}`}
              </div>
            ) : (
              <span style={{ opacity: 0.5 }}>NO TAPE INSERTED</span>
            )}
          </div>

          {/* Canvas Spectrum */}
          <canvas 
            ref={canvasRef} 
            width={140} 
            height={44} 
            style={{ 
              width: '100%', 
              height: '42px',
              display: 'block',
              border: '1px solid rgba(57,255,20,0.2)',
              marginTop: '2px'
            }} 
          />
        </div>
      </div>

      {/* Marquee Animation CSS inline */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(100%, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .marquee {
          display: inline-block;
          padding-left: 10%;
        }
      `}</style>
    </div>
  );
};
