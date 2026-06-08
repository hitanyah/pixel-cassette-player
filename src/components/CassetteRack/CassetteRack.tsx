import React from 'react';
import { Cassette } from '../../services/mockData';
import { CassetteTape } from '../Cassette/CassetteTape';

interface CassetteRackProps {
  cassettes: Cassette[];
  onSelectCassette: (cassette: Cassette) => void;
  activeCassetteId: string | undefined;
}

export const CassetteRack: React.FC<CassetteRackProps> = ({
  cassettes,
  onSelectCassette,
  activeCassetteId
}) => {
  return (
    <div 
      className="pixel-box-outset"
      style={{
        backgroundColor: '#7c5c43', // Wooden shelf color
        boxShadow: `
          inset -4px -4px 0 0 #4a3424,
          inset 4px 4px 0 0 #a67f62,
          0 8px 0 0 rgba(0,0,0,0.3)
        `,
        borderWidth: '4px',
        padding: '16px',
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Shelf Header */}
      <div 
        style={{ 
          borderBottom: '3px solid #4a3424', 
          paddingBottom: '6px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span 
          className="font-pixel" 
          style={{ 
            fontSize: '11px', 
            color: '#ffdf00', // gold lettering
            textShadow: '2px 2px 0 #000'
          }}
        >
          CASSETTE RACK // 卡帶架
        </span>
        <span 
          className="font-pixel"
          style={{ 
            fontSize: '8px', 
            backgroundColor: '#4a3424', 
            color: '#fff', 
            padding: '2px 6px' 
          }}
        >
          {cassettes.length} TAPE(S)
        </span>
      </div>

      {/* Cassette Slot Container (Shelf slots) */}
      <div 
        className="rack-scroll-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '300px',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '12px' // Give room for the translateX(8px)
        }}
      >
        {cassettes.length === 0 ? (
          <div 
            className="font-pixel" 
            style={{ 
              fontSize: '8px', 
              color: '#a67f62', 
              textAlign: 'center', 
              padding: '24px 0',
              lineHeight: '1.6'
            }}
          >
            卡帶架是空的<br/>請點擊「新增卡帶」<br/>匯入 Spotify 歌單！
          </div>
        ) : (
          cassettes.map((tape) => {
            const isActive = activeCassetteId === tape.id;
            return (
              <div 
                key={tape.id}
                style={{
                  position: 'relative',
                  transform: isActive ? 'translateX(8px)' : 'none',
                  transition: 'transform 0.2s ease',
                  border: isActive ? '2px solid #ffdf00' : 'none',
                  padding: isActive ? '2px' : '0',
                  boxShadow: isActive ? '0 0 8px #ffdf00' : 'none'
                }}
              >
                <CassetteTape
                  cassette={tape}
                  size="rack"
                  onClick={() => onSelectCassette(tape)}
                />
                
                {/* Active spine label indicator */}
                {isActive && (
                  <div 
                    className="font-pixel"
                    style={{
                      position: 'absolute',
                      right: '24px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '7px',
                      backgroundColor: '#ffdf00',
                      color: '#000',
                      padding: '2px 4px',
                      fontWeight: 'bold',
                      pointerEvents: 'none',
                      boxShadow: '2px 2px 0px rgba(0,0,0,0.5)'
                    }}
                  >
                    IN DECK
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Shelf visual bottom detail */}
      <div 
        style={{ 
          height: '6px', 
          backgroundColor: '#4a3424', 
          margin: '0 -16px -16px -16px',
          boxShadow: 'inset 0 2px 2px rgba(0,0,0,0.5)'
        }} 
      />
    </div>
  );
};
