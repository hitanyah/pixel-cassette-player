import React from 'react';
import { Cassette } from '../../services/mockData';

interface CassetteTapeProps {
  cassette: Cassette;
  side?: 'A' | 'B';
  isPlaying?: boolean;
  isFF?: boolean;
  isREW?: boolean;
  progress?: number; // 0 to 1 (representing sideTime / sideDuration)
  onClick?: () => void;
  size?: 'normal' | 'small' | 'rack';
}

export const CassetteTape: React.FC<CassetteTapeProps> = ({
  cassette,
  side = 'A',
  isPlaying = false,
  isFF = false,
  isREW = false,
  progress = 0,
  onClick,
  size = 'normal'
}) => {
  const { title, artist, shellColor, stickerColor, stickerPattern, labelTextColor } = cassette;

  // Calculate rotation speed class
  let reelAnimClass = '';
  if (isPlaying) {
    if (isFF) reelAnimClass = 'spin-clockwise';
    else if (isREW) reelAnimClass = 'spin-counter-clockwise';
    else reelAnimClass = 'spin-clockwise';
  }

  // Define dynamic spinning speeds (via inline styles)
  const reelSpinSpeed = isFF || isREW ? '0.2s' : '2s';

  // Calculate tape winding thickness
  const baseTapeRadius = 14; // minimum tape radius when empty
  const maxTapeRadius = 24;  // maximum tape radius when full
  
  // On Side A, tape moves from Left to Right (so left spools decreases, right increases)
  // On Side B, it does the same from its timeline start (left decreases, right increases)
  const leftTapeRadius = baseTapeRadius + (1 - progress) * (maxTapeRadius - baseTapeRadius);
  const rightTapeRadius = baseTapeRadius + progress * (maxTapeRadius - baseTapeRadius);

  // Sticker patterns mapping
  const getPatternStyle = (): React.CSSProperties => {
    switch (stickerPattern) {
      case 'stripes':
        return {
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0, 0, 0, 0.06) 8px, rgba(0, 0, 0, 0.06) 16px)`
        };
      case 'grid':
        return {
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.07) 1px, transparent 1px)`,
          backgroundSize: '10px 10px'
        };
      case 'waves':
        return {
          backgroundImage: `radial-gradient(circle at 100% 150%, transparent 24%, rgba(0,0,0,0.06) 24%, rgba(0,0,0,0.06) 28%, transparent 28%, transparent),
                            radial-gradient(circle at 0% 150%, transparent 24%, rgba(0,0,0,0.06) 24%, rgba(0,0,0,0.06) 28%, transparent 28%, transparent)`,
          backgroundSize: '20px 20px'
        };
      case 'solid':
      default:
        return {};
    }
  };

  // Dimensional sizes
  const sizes = {
    normal: { width: '260px', height: '166px', labelFont: '10px', titleFont: '12px' },
    small: { width: '200px', height: '128px', labelFont: '8px', titleFont: '10px' },
    rack: { width: '100%', height: '56px', labelFont: '8px', titleFont: '11px' }
  };

  const currentSize = sizes[size];

  if (size === 'rack') {
    // A simplified rack view (shows spine of the cassette tape)
    return (
      <div 
        onClick={onClick}
        className="pixel-box-flat"
        style={{
          backgroundColor: shellColor,
          color: '#000',
          cursor: 'pointer',
          padding: '6px 12px',
          height: currentSize.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: '3px',
          borderColor: '#000',
          userSelect: 'none',
          boxShadow: 'inset -3px -3px 0 0 rgba(0,0,0,0.2), inset 3px 3px 0 0 rgba(255,255,255,0.2)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '80%' }}>
          <span className="font-pixel" style={{ fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>
            {title}
          </span>
          <span style={{ fontSize: '10px', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {artist}
          </span>
        </div>
        <div 
          className="font-pixel"
          style={{ 
            fontSize: '10px', 
            backgroundColor: stickerColor, 
            padding: '2px 6px',
            border: '2px solid #000',
            fontWeight: 'bold'
          }}
        >
          {cassette.isSpotifyPlaylist ? 'SPOT' : 'TAPE'}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="pixel-cassette"
      style={{
        width: currentSize.width,
        height: currentSize.height,
        backgroundColor: shellColor,
        border: '4px solid #000',
        borderRadius: '0px',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'inset -6px -6px 0 0 rgba(0,0,0,0.25), inset 6px 6px 0 0 rgba(255,255,255,0.15)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 10px',
        userSelect: 'none'
      }}
    >
      {/* Corner Screws (Retro details) */}
      <div style={{ position: 'absolute', top: '4px', left: '4px', width: '4px', height: '4px', background: '#222', border: '1px solid #777' }}></div>
      <div style={{ position: 'absolute', top: '4px', right: '4px', width: '4px', height: '4px', background: '#222', border: '1px solid #777' }}></div>
      <div style={{ position: 'absolute', bottom: '4px', left: '4px', width: '4px', height: '4px', background: '#222', border: '1px solid #777' }}></div>
      <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '4px', height: '4px', background: '#222', border: '1px solid #777' }}></div>

      {/* Label Sticker */}
      <div
        className="sticker-label"
        style={{
          width: '100%',
          height: '75%',
          backgroundColor: stickerColor,
          border: '3px solid #000',
          position: 'relative',
          padding: '4px 8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          ...getPatternStyle()
        }}
      >
        {/* Tape Label Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '2px', pointerEvents: 'none' }}>
          <div className="font-pixel" style={{ fontSize: '8px', color: '#000', fontWeight: 'bold' }}>
            A B S - 9 0
          </div>
          <div 
            className="font-pixel" 
            style={{ 
              fontSize: '12px', 
              color: labelTextColor, 
              fontWeight: '900', 
              backgroundColor: '#fff', 
              padding: '0px 4px', 
              border: '2px solid #000',
              marginTop: '-3px'
            }}
          >
            SIDE {side}
          </div>
        </div>

        {/* Written Title (Handwriting Simulation) */}
        <div 
          className="font-retro"
          style={{ 
            color: labelTextColor, 
            fontSize: currentSize.titleFont, 
            fontStyle: 'italic',
            fontWeight: 'bold',
            marginTop: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            borderBottom: '1px dashed rgba(0,0,0,0.3)',
            lineHeight: '1.2'
          }}
        >
          {title}
        </div>
        <div 
          className="font-retro"
          style={{ 
            color: labelTextColor, 
            fontSize: currentSize.labelFont,
            opacity: 0.9,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '4px',
            lineHeight: '1'
          }}
        >
          BY: {artist}
        </div>

        {/* Tape Reels Cutout (The Center window where we see the tape spools) */}
        <div
          className="tape-window-casing"
          style={{
            position: 'absolute',
            bottom: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '42px',
            backgroundColor: '#000',
            border: '3px solid #000',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 8px',
            zIndex: 2
          }}
        >
          {/* Left Reel & Tape Winding */}
          <div style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Magnetic Tape on Left Reel */}
            <div 
              style={{
                position: 'absolute',
                width: `${leftTapeRadius * 2}px`,
                height: `${leftTapeRadius * 2}px`,
                backgroundColor: '#3b2519', // Brown magnetic tape color
                borderRadius: '50%',
                transition: 'width 0.2s ease, height 0.2s ease',
                opacity: 0.9
              }}
            />
            {/* Reel Spool (Visual cogwheel) */}
            <svg
              className={reelAnimClass}
              style={{ 
                width: '24px', 
                height: '24px', 
                zIndex: 3,
                animationDuration: reelSpinSpeed
              }}
              viewBox="0 0 24 24"
            >
              {/* White plastic spool center */}
              <circle cx="12" cy="12" r="8" fill="#fff" stroke="#000" strokeWidth="2" />
              {/* Teeth holes */}
              <path d="M12,4 L12,8 M12,16 L12,20 M4,12 L8,12 M16,12 L20,12 M6.3,6.3 L9.2,9.2 M14.8,14.8 L17.7,17.7 M17.7,6.3 L14.8,9.2 M9.2,14.8 L6.3,17.7" stroke="#000" strokeWidth="2.5" />
              <circle cx="12" cy="12" r="3.5" fill="#000" />
            </svg>
          </div>

          {/* Center visual tape window */}
          <div style={{ width: '32px', height: '12px', border: '1px solid #222', backgroundColor: 'rgba(59,37,25,0.35)', position: 'relative', overflow: 'hidden' }}>
            {/* Tape running across */}
            <div style={{ position: 'absolute', top: '4px', left: 0, right: 0, height: '4px', backgroundColor: '#3b2519' }} />
          </div>

          {/* Right Reel & Tape Winding */}
          <div style={{ position: 'relative', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Magnetic Tape on Right Reel */}
            <div 
              style={{
                position: 'absolute',
                width: `${rightTapeRadius * 2}px`,
                height: `${rightTapeRadius * 2}px`,
                backgroundColor: '#3b2519',
                borderRadius: '50%',
                transition: 'width 0.2s ease, height 0.2s ease',
                opacity: 0.9
              }}
            />
            {/* Reel Spool (Visual cogwheel) */}
            <svg
              className={reelAnimClass}
              style={{ 
                width: '24px', 
                height: '24px', 
                zIndex: 3,
                animationDuration: reelSpinSpeed
              }}
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="8" fill="#fff" stroke="#000" strokeWidth="2" />
              <path d="M12,4 L12,8 M12,16 L12,20 M4,12 L8,12 M16,12 L20,12 M6.3,6.3 L9.2,9.2 M14.8,14.8 L17.7,17.7 M17.7,6.3 L14.8,9.2 M9.2,14.8 L6.3,17.7" stroke="#000" strokeWidth="2.5" />
              <circle cx="12" cy="12" r="3.5" fill="#000" />
            </svg>
          </div>
        </div>
      </div>

      {/* Cassette bottom shape (notched trapezoid) */}
      <div
        className="cassette-notch-casing"
        style={{
          width: '150px',
          height: '20px',
          backgroundColor: shellColor,
          border: '4px solid #000',
          borderBottom: 'none',
          position: 'relative',
          zIndex: 1,
          alignSelf: 'center',
          boxShadow: 'inset -2px 0 0 0 rgba(0,0,0,0.25), inset 2px 0 0 0 rgba(255,255,255,0.1)'
        }}
      >
        {/* Trapezoid left and right angles (simulated via pixel steps) */}
        <div style={{ position: 'absolute', top: '-4px', left: '-8px', width: '8px', height: '20px', backgroundColor: shellColor, borderLeft: '4px solid #000', borderTop: '4px solid #000' }}></div>
        <div style={{ position: 'absolute', top: '-4px', right: '-8px', width: '8px', height: '20px', backgroundColor: shellColor, borderRight: '4px solid #000', borderTop: '4px solid #000' }}></div>

        {/* Small holes at the bottom */}
        <div style={{ position: 'absolute', left: '24px', top: '4px', width: '8px', height: '8px', backgroundColor: '#000', border: '1px solid #777' }}></div>
        <div style={{ position: 'absolute', right: '24px', top: '4px', width: '8px', height: '8px', backgroundColor: '#000', border: '1px solid #777' }}></div>
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '4px', width: '12px', height: '8px', backgroundColor: '#000', border: '1px solid #777' }}></div>
      </div>
    </div>
  );
};
