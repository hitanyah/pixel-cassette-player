import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Volume2, Sparkles, SkipForward, SkipBack } from 'lucide-react';
import { Cassette } from '../../services/mockData';
import { UseAudioPlayerReturn } from '../../hooks/useAudioPlayer';
import { DisplayScreen } from './DisplayScreen';
import { CassetteTape } from '../Cassette/CassetteTape';

const clickSound = typeof Audio !== 'undefined' ? new Audio('/pixel-cassette-player/sounds/click.mp3') : null;
const ejectSound = typeof Audio !== 'undefined' ? new Audio('/pixel-cassette-player/sounds/eject.mp3') : null;
const insertSound = typeof Audio !== 'undefined' ? new Audio('/pixel-cassette-player/sounds/insert.mp3') : null;

// Preload audio files
if (clickSound) clickSound.load();
if (ejectSound) ejectSound.load();
if (insertSound) insertSound.load();

interface WalkmanProps {
  cassette: Cassette | null;
  audioEngine: UseAudioPlayerReturn;
  currentSide: 'A' | 'B';
  onFlipSide: () => void;
  onEject: () => void;
  isLidOpen: boolean;
  setLidOpen: (open: boolean) => void;
  crtFilterOn: boolean;
  setCrtFilterOn: (on: boolean) => void;
}

export const Walkman: React.FC<WalkmanProps> = ({
  cassette,
  audioEngine,
  currentSide,
  onFlipSide,
  onEject,
  isLidOpen,
  setLidOpen,
  crtFilterOn,
  setCrtFilterOn
}) => {
  const {
    isPlaying,
    sideTime,
    sideDuration,
    activeTrack,
    volume,
    play,
    pause,
    stop,
    setVolume,
    analyser,
    isDeckEmpty,
    hasFinishedSide,
    isSpotifyDisconnected = false
  } = audioEngine;

  const [isFlipping, setIsFlipping] = useState(false);
  const [isPausePressed, setIsPausePressed] = useState(false);

  // Play click audio indicator
  const playClickSound = () => {
    if (clickSound) {
      clickSound.currentTime = 0;
      clickSound.play().catch(e => console.log('Click sound play block:', e));
    }
  };

  // Play insert sound when cassette goes from null to active or changes
  const prevCassetteRef = useRef<string | null>(null);
  useEffect(() => {
    if (cassette && prevCassetteRef.current !== cassette.id) {
      if (insertSound) {
        insertSound.currentTime = 0;
        insertSound.play().catch(e => console.log('Insert sound play block:', e));
      }
    }
    prevCassetteRef.current = cassette ? cassette.id : null;
  }, [cassette]);

  const handlePlay = () => {
    playClickSound();
    setIsPausePressed(false);
    if (isLidOpen) {
      // Close door automatically if user clicks play with cassette inside
      if (cassette) {
        setLidOpen(false);
        setTimeout(() => play(), 400);
      }
    } else {
      play();
    }
  };

  const handlePause = () => {
    playClickSound();
    if (isPausePressed) {
      setIsPausePressed(false);
      play();
    } else {
      setIsPausePressed(true);
      pause();
    }
  };

  const handleStop = () => {
    playClickSound();
    setIsPausePressed(false);
    stop();
  };

  const handlePrev = () => {
    playClickSound();
    audioEngine.previousTrack();
  };

  const handleNext = () => {
    playClickSound();
    audioEngine.nextTrack();
  };



  const handleEject = () => {
    stop();
    if (isLidOpen) {
      if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play().catch(e => console.log('Click sound play block:', e));
      }
      setLidOpen(false);
    } else {
      if (ejectSound) {
        ejectSound.currentTime = 0;
        ejectSound.play().catch(e => console.log('Eject sound play block:', e));
      }
      setLidOpen(true);
      if (cassette) {
        // Eject cassette
        setTimeout(() => onEject(), 200);
      }
    }
  };

  const handleFlip = () => {
    if (!cassette || isFlipping) return;
    playClickSound();
    stop();
    setIsFlipping(true);
    
    // Simulate 3D flipping animation time
    setTimeout(() => {
      onFlipSide();
      setIsFlipping(false);
    }, 800);
  };

  // Tape completion percentage for winding thickness
  const progress = sideDuration > 0 ? sideTime / sideDuration : 0;

  return (
    <div 
      className="pixel-box-outset walkman-casing"
      style={{
        width: '100%',
        maxWidth: '360px',
        backgroundColor: '#383c48', // Classic Walkman Metallic Blue-Gray
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        borderWidth: '4px',
        userSelect: 'none',
        boxShadow: `
          inset -4px -4px 0 0 #1e2027,
          inset 4px 4px 0 0 #60677a,
          inset -8px -8px 0 0 #2b2e37,
          inset 8px 8px 0 0 #4c5262,
          0 12px 0 0 rgba(0,0,0,0.3)
        `
      }}
    >
      {/* Top Walkman Logo & LED Lights */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #1e2027', paddingBottom: '8px' }}>
        <div>
          <span 
            className="font-pixel" 
            style={{ 
              fontSize: '14px', 
              color: '#dcdde1', 
              fontWeight: '900', 
              letterSpacing: '1px',
              textShadow: '2px 2px 0 #1e2027'
            }}
          >
            SOUND-PIXEL
          </span>
          <div style={{ fontSize: '8px', fontFamily: 'var(--font-pixel)', color: '#00f3ff', marginTop: '2px' }}>
            AUTO REVERSE SYSTEM
          </div>
        </div>

        {/* LED Block */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontSize: '7px', fontFamily: 'var(--font-pixel)', color: '#a0a0ab' }}>PLAY</span>
            <div className={`led green ${isPlaying ? 'on' : ''}`} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '7px', fontFamily: 'var(--font-pixel)', color: '#888', marginBottom: '4px' }}>BATT</span>
            <div className={`led red`} />
          </div>
        </div>
      </div>

      {/* Retro LCD Screen */}
      <DisplayScreen
        activeTrack={activeTrack}
        sideTime={sideTime}
        isPlaying={isPlaying}
        analyser={analyser}
        currentSide={currentSide}
        isSpotifyStream={!!cassette?.isSpotifyPlaylist}
        hasFinishedSide={hasFinishedSide}
        isSpotifyDisconnected={isSpotifyDisconnected}
      />

      {/* Cassette Tape Deck Compartment */}
      <div
        className="pixel-box-inset"
        style={{
          height: '210px',
          width: '100%',
          backgroundColor: '#151619',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0',
          overflow: 'hidden'
        }}
      >
        {/* Under-deck mechanism (visible when lid is open or transparent window shows it) */}
        <div 
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isLidOpen && !cassette ? 1 : 0.35,
            zIndex: 1,
            pointerEvents: 'none'
          }}
        >
          {/* Spindle Pins */}
          <div style={{ position: 'absolute', left: '110px', width: '20px', height: '20px', background: '#333', border: '3px solid #000', borderRadius: '50%' }}>
            <div style={{ width: '6px', height: '6px', background: '#aaa', borderRadius: '50%', margin: '4px' }}></div>
          </div>
          <div style={{ position: 'absolute', right: '110px', width: '20px', height: '20px', background: '#333', border: '3px solid #000', borderRadius: '50%' }}>
            <div style={{ width: '6px', height: '6px', background: '#aaa', borderRadius: '50%', margin: '4px' }}></div>
          </div>
          {/* Tape Head details */}
          <div style={{ position: 'absolute', bottom: '10px', width: '40px', height: '18px', background: '#555', border: '3px solid #000' }}></div>
          <div style={{ position: 'absolute', bottom: '10px', left: '90px', width: '10px', height: '10px', background: '#888', border: '2px solid #000', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '10px', right: '90px', width: '10px', height: '10px', background: '#888', border: '2px solid #000', borderRadius: '50%' }}></div>
        </div>

        {/* Cassette inside deck */}
        {cassette && (
          <div 
            className={`cassette-container ${isFlipping ? 'flipping' : ''} ${isLidOpen ? 'tilted' : ''}`}
            style={{
              zIndex: 3,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.4s ease-out',
            }}
          >
            <CassetteTape
              cassette={cassette}
              side={currentSide}
              isPlaying={isPlaying}
              progress={progress}
              size="normal"
            />
          </div>
        )}

        {/* Eject / Insert Prompt when empty */}
        {!cassette && isLidOpen && (
          <div 
            className="font-pixel"
            style={{ 
              zIndex: 3, 
              color: '#a0a0ab', 
              fontSize: '10px', 
              textAlign: 'center',
              animation: 'pulse 1.5s infinite',
              padding: '20px'
            }}
          >
            磁帶艙已開啟<br/>請點擊下方卡帶放入
          </div>
        )}

        {/* Walkman Compartment Lid (Cassette Door) */}
        <div
          onClick={() => {
            if (!isPlaying) setLidOpen(!isLidOpen);
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: '4px solid #111',
            backgroundColor: isLidOpen ? 'rgba(0,0,0,0.0)' : 'rgba(30,35,45,0.45)',
            boxShadow: isLidOpen 
              ? 'none' 
              : 'inset -8px -8px 0 0 rgba(0,0,0,0.4), inset 8px 8px 0 0 rgba(255,255,255,0.05)',
            zIndex: 4,
            cursor: isPlaying ? 'not-allowed' : 'pointer',
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.3s',
            transformOrigin: 'bottom center',
            transform: isLidOpen ? 'perspective(600px) rotateX(-24deg) translateY(-8px)' : 'perspective(600px) rotateX(0deg)',
            pointerEvents: isLidOpen ? 'none' : 'auto' // let clicks pass through to cassette/prompt when open
          }}
        >
          {/* Glass window highlight */}
          {!isLidOpen && (
            <div 
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 50%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.3) 100%)',
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Cassette View Portal (The cut out hole in actual Walkman door) */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '146px',
              height: '66px',
              border: '3px solid #1e2027',
              backgroundColor: 'rgba(0,0,0,0.15)',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.5)',
              display: isLidOpen ? 'none' : 'block'
            }}
          />

          {/* Lid text */}
          <div 
            className="font-pixel"
            style={{ 
              position: 'absolute', 
              bottom: '12px', 
              left: '16px', 
              fontSize: '8px', 
              color: '#dcdde1',
              textShadow: '1px 1px 0 #000',
              opacity: isLidOpen ? 0 : 0.7
            }}
          >
            GLASS WINDOW // STEREO
          </div>
        </div>
      </div>

      {/* Volume & CRT Toggle Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        {/* Volume Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <Volume2 size={16} color="#dcdde1" />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: '8px', fontFamily: 'var(--font-pixel)', color: '#a0a0ab', marginBottom: '2px' }}>
              VOLUME ({Math.round(volume * 10)})
            </span>
            <input 
              type="range" 
              className="retro-slider"
              min="0" 
              max="1" 
              step="0.1" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* CRT Filter Switch */}
        <button 
          className={`pixel-btn ${crtFilterOn ? 'active' : ''}`}
          onClick={() => setCrtFilterOn(!crtFilterOn)}
          style={{ 
            padding: '6px 10px', 
            fontSize: '8px', 
            marginLeft: '16px',
            backgroundColor: crtFilterOn ? '#448844' : '#4a4e59',
            boxShadow: crtFilterOn 
              ? 'inset 2px 2px 0 0 #000, inset -2px -2px 0 0 #88ff88, 0 0 0 2px #000' 
              : undefined
          }}
          title="Toggle CRT Screen Scanlines"
        >
          <Sparkles size={10} />
          CRT FILTER
        </button>
      </div>

      {/* Mechanical Buttons (Play, Pause, Stop, FF, REW, Eject) */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          backgroundColor: '#23252d',
          padding: '12px 8px 6px 8px',
          border: '3px solid #1e2027',
          boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.6)',
          height: '80px',
          marginTop: '4px'
        }}
      >
        <button 
          title="Play"
          className={`walkman-btn ${isPlaying ? 'pressed' : ''}`}
          onClick={handlePlay}
          disabled={isDeckEmpty}
        >
          <Play size={12} fill="#000" />
          <span style={{ fontSize: '7px', fontFamily: 'var(--font-pixel)', color: '#000', marginTop: '4px', fontWeight: 'bold' }}>PLAY</span>
        </button>

        <button 
          title="Pause"
          className={`walkman-btn ${isPausePressed && !hasFinishedSide && !isDeckEmpty ? 'pressed' : ''}`}
          onClick={handlePause}
          disabled={isDeckEmpty}
        >
          <Pause size={12} fill="#000" />
          <span style={{ fontSize: '7px', fontFamily: 'var(--font-pixel)', color: '#000', marginTop: '4px', fontWeight: 'bold' }}>PAUSE</span>
        </button>

        {/* PREV Button */}
        <button 
          className="walkman-btn"
          disabled={isDeckEmpty}
          onClick={handlePrev}
          title="Previous Track"
        >
          <SkipBack size={12} fill="#000" />
          <span style={{ fontSize: '7px', fontFamily: 'var(--font-pixel)', color: '#000', marginTop: '4px', fontWeight: 'bold' }}>PREV</span>
        </button>
        
        {/* NEXT Button */}
        <button 
          className="walkman-btn"
          disabled={isDeckEmpty}
          onClick={handleNext}
          title="Next Track"
        >
          <SkipForward size={12} fill="#000" />
          <span style={{ fontSize: '7px', fontFamily: 'var(--font-pixel)', color: '#000', marginTop: '4px', fontWeight: 'bold' }}>NEXT</span>
        </button>

        <button 
          title="Stop"
          className={`walkman-btn ${!isPlaying && sideTime === 0 ? 'pressed' : ''}`}
          onClick={handleStop}
          disabled={isDeckEmpty}
        >
          <Square size={12} fill="#000" />
          <span style={{ fontSize: '7px', fontFamily: 'var(--font-pixel)', color: '#000', marginTop: '4px', fontWeight: 'bold' }}>STOP</span>
        </button>

        <button 
          title="Eject / Open Deck"
          className={`walkman-btn ${isLidOpen ? 'pressed' : ''}`}
          onClick={handleEject}
        >
          <RotateCcw size={12} />
          <span style={{ fontSize: '7px', fontFamily: 'var(--font-pixel)', color: '#000', marginTop: '4px', fontWeight: 'bold' }}>EJECT</span>
        </button>
      </div>

      {/* Manual Flip Side & Status Triggers */}
      {cassette && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {hasFinishedSide && (
            <div 
              className="font-pixel"
              style={{
                backgroundColor: 'rgba(255,59,48,0.15)',
                color: '#ff3b30',
                fontSize: '9px',
                textAlign: 'center',
                padding: '6px',
                border: '2px solid #ff3b30',
                animation: 'pulse 1s infinite'
              }}
            >
              * 咔噠 * 磁帶播放結束！請點擊下方按鈕翻面。
            </div>
          )}
          <button
            className={`pixel-btn ${isFlipping ? 'active' : ''}`}
            onClick={handleFlip}
            disabled={isFlipping}
            style={{
              width: '100%',
              backgroundColor: '#ffd300',
              color: '#000',
              fontWeight: 'bold',
              boxShadow: 'inset -3px -3px 0 0 #000, inset 3px 3px 0 0 #fff, 0 0 0 3px #000'
            }}
          >
            翻轉卡帶 (FLIP TAPE TO SIDE {currentSide === 'A' ? 'B' : 'A'})
          </button>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        
        /* 3D Cassette Tilt in Open Lid */
        .cassette-container.tilted {
          transform: perspective(600px) rotateX(-16deg) translateY(-8px) translateZ(12px);
        }

        /* 3D Cassette Flip Animation */
        .cassette-container.flipping {
          animation: flip-tape-animation 0.8s cubic-bezier(0.455, 0.03, 0.515, 0.955) forwards;
        }

        @keyframes flip-tape-animation {
          0% {
            transform: scale(1) rotateY(0deg) translateZ(0);
          }
          50% {
            transform: scale(1.15) rotateY(90deg) translateY(-20px) translateZ(50px);
          }
          100% {
            transform: scale(1) rotateY(180deg) translateZ(0);
          }
        }
      `}</style>
    </div>
  );
};
