import React from 'react';
import { createPortal } from 'react-dom';

interface PixelModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  onConfirm: () => void;
  onCancel?: () => void;
}

export const PixelModal: React.FC<PixelModalProps> = ({
  isOpen,
  title,
  message,
  type,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  // Split multi-line messages to support nice line breaks
  const lines = message.split('\n');

  return createPortal(
    <div 
      className="pixel-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 10, 5, 0.75)', // CRT green-tinted dark overlay
        backdropFilter: 'blur(3px)',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // Prevent top clipping of content when it overflows
        overflowY: 'auto', // Allow scroll if modal height exceeds screen height
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="pixel-box-outset pixel-modal-box"
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#32353d', // Walkman metallic grey
          borderWidth: '4px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          margin: 'auto', // Centering trick with scroll support
          boxShadow: `
            inset -4px -4px 0 0 #1e2027,
            inset 4px 4px 0 0 #6c7283,
            0 16px 32px rgba(0,0,0,0.6)
          `,
          animation: 'scaleUp 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {/* Modal Title Bar */}
        <div 
          className="pixel-box-inset pixel-modal-titlebar"
          style={{
            backgroundColor: '#1e2027',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'inset 2px 2px 0 0 #000, inset -2px -2px 0 0 #555, 0 0 0 2px #000'
          }}
        >
          <span style={{ fontSize: '14px', color: '#ffec27', animation: 'pulse 1s infinite' }}>
            {type === 'alert' ? '⚠️' : '💬'}
          </span>
          <span 
            className="font-pixel" 
            style={{ 
              fontSize: '11px', 
              color: '#fff', 
              letterSpacing: '1px',
              textShadow: '1px 1px 0 #000',
              fontWeight: 'bold'
            }}
          >
            {title}
          </span>
        </div>

        {/* Modal Content */}
        <div 
          className="pixel-box-inset pixel-modal-content"
          style={{
            backgroundColor: '#1c1c1f',
            padding: '16px',
            color: '#dcdde1',
            fontFamily: 'var(--font-retro)',
            fontSize: '14px',
            lineHeight: '1.6',
            minHeight: '60px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            border: '2px solid #000',
            boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {lines.map((line, index) => (
            <p key={index} style={{ margin: line === '' ? '8px 0' : '0', textAlign: 'center' }}>
              {line}
            </p>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="pixel-modal-btn-container" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '4px' }}>
          {type === 'confirm' && onCancel && (
            <button
              className="pixel-btn"
              onClick={onCancel}
              style={{
                backgroundColor: '#7e2553', // PICO-8 Dark Purple/Red
                color: '#fff',
                fontSize: '10px',
                padding: '10px 20px',
                boxShadow: `
                  inset -2px -2px 0 0 #000,
                  inset 2px 2px 0 0 #ff77a8,
                  inset -4px -4px 0 0 #4c1732,
                  inset 4px 4px 0 0 #a23a6d,
                  0 0 0 2px #000
                `
              }}
            >
              CANCEL
            </button>
          )}
          <button
            className="pixel-btn"
            onClick={onConfirm}
            style={{
              backgroundColor: '#008751', // PICO-8 Dark Green
              color: '#fff',
              fontSize: '10px',
              padding: '10px 24px',
              boxShadow: `
                inset -2px -2px 0 0 #000,
                inset 2px 2px 0 0 #00e436,
                inset -4px -4px 0 0 #005f39,
                inset 4px 4px 0 0 #00b069,
                0 0 0 2px #000
              `
            }}
          >
            {type === 'confirm' ? 'CONFIRM' : 'OK'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        /* Compact modal sizing for narrow viewports or landscape mobile orientation */
        @media (max-width: 480px), (max-height: 500px) {
          .pixel-modal-box {
            padding: 12px 16px !important;
            gap: 10px !important;
            border-width: 3px !important;
          }
          .pixel-modal-titlebar {
            padding: 6px 10px !important;
          }
          .pixel-modal-titlebar span {
            font-size: 10px !important;
          }
          .pixel-modal-content {
            padding: 10px 12px !important;
            font-size: 12px !important;
            min-height: 48px !important;
          }
          .pixel-modal-btn-container {
            margin-top: 0px !important;
            gap: 10px !important;
          }
          .pixel-modal-btn-container button {
            padding: 8px 16px !important;
            font-size: 9px !important;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};
