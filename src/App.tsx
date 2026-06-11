import { useState, useEffect, useRef } from 'react';
import { Settings, HelpCircle } from 'lucide-react';
import { Cassette, DEFAULT_CASSETTES } from './services/mockData';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer';
import { Walkman } from './components/Walkman/Walkman';
import { CassetteRack } from './components/CassetteRack/CassetteRack';
import { SettingsPage } from './components/Settings/SettingsPage';
import { exchangeCodeForToken, getRedirectUri, getStoredToken, redirectToSpotifyAuth, decompressString } from './services/spotify';
import { PixelModal } from './components/PixelModal';

function App() {
  const [page, setPage] = useState<'home' | 'settings'>('home');
  const [crtFilterOn, setCrtFilterOn] = useState(true);
  const [isLidOpen, setLidOpen] = useState(false);
  const [currentSide, setCurrentSide] = useState<'A' | 'B'>('A');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Custom Pixel Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: () => {}
  });

  const showPixelAlert = (message: string, title: string = '⚠️ SYSTEM ALERT') => {
    return new Promise<void>((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'alert',
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve();
        }
      });
    });
  };

  const showPixelConfirm = (message: string, title: string = '💬 SYSTEM CONFIRM') => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        onConfirm: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };
  
  // Custom cassettes loaded from local storage
  const [customCassettes, setCustomCassettes] = useState<Cassette[]>(() => {
    const stored = localStorage.getItem('custom_cassettes');
    return stored ? JSON.parse(stored) : [];
  });

  // Combine default and custom cassettes
  const allCassettes = [...DEFAULT_CASSETTES, ...customCassettes];

  // Currently loaded cassette
  const [activeCassette, setActiveCassette] = useState<Cassette | null>(() => {
    // Start with the first default cassette loaded by default
    return allCassettes[0] || null;
  });

  // Initialize Audio Engine Hooks
  // spotifyToken is read from localStorage and refreshed on auth
  const [spotifyToken, setSpotifyToken] = useState<string | null>(() => getStoredToken());

  const handleSpotifyAuthError = () => {
    setSpotifyToken(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expires_at');
    localStorage.removeItem('spotify_refresh_token');
    showPixelAlert('Spotify 連線已過期或授權失效。請重新連線！', '🔌 SPOTIFY AUTH ERROR')
      .then(() => {
        setPage('settings');
      });
  };

  const localAudioEngine = useAudioPlayer(
    activeCassette?.isSpotifyPlaylist ? null : activeCassette,
    currentSide
  );
  const spotifyAudioEngine = useSpotifyPlayer(
    activeCassette?.isSpotifyPlaylist ? activeCassette : null,
    currentSide,
    spotifyToken,
    handleSpotifyAuthError,
    showPixelAlert,
    showPixelConfirm
  );

  // Route to the correct audio engine based on cassette type
  const audioEngine = activeCassette?.isSpotifyPlaylist ? spotifyAudioEngine : localAudioEngine;

  // Ref guard: prevent React StrictMode from running token exchange twice
  // (Spotify auth codes are single-use; a second exchange attempt will always fail)
  const hasExchangedToken = useRef(false);

  // Handle Spotify PKCE authorization code redirect on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const storedClientId = localStorage.getItem('spotify_client_id');

    if (code && storedClientId) {
      // Guard: only run once even if StrictMode double-invokes this effect
      if (hasExchangedToken.current) {
        console.log('[Spotify Auth] Skipping duplicate exchange (StrictMode)');
        return;
      }
      hasExchangedToken.current = true;

      setIsAuthenticating(true);
      const redirectUri = getRedirectUri();

      // IMMEDIATELY clear all old token data before exchange attempt
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_token_expires_at');
      localStorage.removeItem('spotify_refresh_token');

      exchangeCodeForToken(storedClientId, code, redirectUri)
        .then((newToken) => {
          // Clear URL query parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          setSpotifyToken(newToken);
          setPage('settings');
        })
        .catch((err) => {
          console.error('[Spotify Auth] Token exchange FAILED:', err);
          // Clear URL query parameters even on failure
          window.history.replaceState({}, document.title, window.location.pathname);
          showPixelAlert('Spotify 登入驗證失敗！請確認 Client ID 或 Redirect URI 設定是否正確。', '❌ AUTH FAILED');
        })
        .finally(() => {
          setIsAuthenticating(false);
        });
    }

    // Handle incoming shared cassette
    const tapeQuery = params.get('tape');
    const clientQuery = params.get('client_id');
    
    if (clientQuery) {
      localStorage.setItem('spotify_client_id', clientQuery);
    }

    if (tapeQuery) {
      // 支援新版 v2.{gzipBase64} 格式（向下相容舊版 base64 格式）
      const parseSharedCassette = async () => {
        try {
          let decodedString: string;

          if (tapeQuery.startsWith('v2.')) {
            // 新版：gzip 壓縮格式
            const gzipBase64 = tapeQuery.slice(3).replace(/ /g, '+');
            decodedString = await decompressString(gzipBase64);
          } else {
            // 舊版：直接 Base64 格式
            const safeQuery = tapeQuery.replace(/ /g, '+');
            decodedString = decodeURIComponent(escape(atob(safeQuery)));
          }

          const importedCassette = JSON.parse(decodedString) as Cassette;
          
          // Ensure it has a valid ID and isn't completely bogus
          if (importedCassette && importedCassette.title && importedCassette.tracks) {
            // Add a prefix to ensure uniqueness
            importedCassette.id = `shared-${Date.now()}`;
            
            setCustomCassettes(prev => {
              const updated = [...prev, importedCassette];
              localStorage.setItem('custom_cassettes', JSON.stringify(updated));
              return updated;
            });
            
            setActiveCassette(importedCassette);
            
            // Clear the URL parameter so it doesn't trigger again on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
            
            if (importedCassette.isSpotifyPlaylist && clientQuery && !getStoredToken()) {
              showPixelConfirm(
                `成功收到卡帶：「${importedCassette.title}」！\n\n這張卡帶需要連接 Spotify 才能播放。\n是否立即使用分享者的連線設定進行登入？`,
                '📥 IMPORT SPOTIFY TAPE'
              ).then((ok) => {
                if (ok) redirectToSpotifyAuth(clientQuery, getRedirectUri());
              });
              return;
            } else {
              showPixelAlert(`成功收到並匯入朋友分享的卡帶：「${importedCassette.title}」！`, '📥 CASSETTE IMPORTED');
            }
          }
        } catch (err) {
          console.error('Failed to parse shared cassette:', err);
          window.history.replaceState({}, document.title, window.location.pathname);
          showPixelAlert('無法匯入卡帶，分享連結可能已損壞或過期！', '❌ IMPORT ERROR');
        }
      };

      parseSharedCassette();
    }
  }, []);

  // Sync custom cassettes to localStorage
  const handleAddCassette = (newCassette: Cassette) => {
    const updated = [...customCassettes, newCassette];
    setCustomCassettes(updated);
    localStorage.setItem('custom_cassettes', JSON.stringify(updated));
  };

  const handleDeleteCassette = (id: string) => {
    const updated = customCassettes.filter(c => c.id !== id);
    setCustomCassettes(updated);
    localStorage.setItem('custom_cassettes', JSON.stringify(updated));
    // If the active cassette is deleted, unload it
    if (activeCassette && activeCassette.id === id) {
      audioEngine.stop();
      setActiveCassette(null);
    }
  };

  const handleClearAllCassettes = () => {
    showPixelConfirm('確定要清空所有自訂與分享的卡帶嗎？此動作無法復原。', '🗑️ CLEAR ALL CASSETTES')
      .then((ok) => {
        if (ok) {
          audioEngine.stop();
          setCustomCassettes([]);
          localStorage.removeItem('custom_cassettes');
          
          // If active cassette is a custom/shared one, eject it
          if (activeCassette && !activeCassette.id.startsWith('default-')) {
            setActiveCassette(null);
          }
          showPixelAlert('所有自訂卡帶已成功清空！', '🗑️ CLEARED');
        }
      });
  };

  // Cassette interaction events
  const handleSelectCassette = (cassette: Cassette) => {
    // Check if selecting a Spotify cassette but token is expired/null
    if (cassette.isSpotifyPlaylist && !getStoredToken()) {
      showPixelConfirm(
        `「${cassette.title}」是 Spotify 卡帶，但偵測到連線已過期或未登入。\n\n是否現在前往「卡帶工作室」重新連接 Spotify？`,
        '🔌 SPOTIFY RECONNECT'
      ).then((ok) => {
        if (ok) {
          setPage('settings');
        }
      });
      return;
    }

    audioEngine.stop();
    setLidOpen(true); // Open deck

    // Load cassette, reset side to A, and close lid automatically
    setTimeout(() => {
      setActiveCassette(cassette);
      setCurrentSide('A');
      
      // Auto close lid
      setTimeout(() => {
        setLidOpen(false);
      }, 600);
    }, 300);
  };

  const handleFlipSide = () => {
    audioEngine.triggerFlip();
    setCurrentSide(prev => prev === 'A' ? 'B' : 'A');
  };

  const handleEject = () => {
    audioEngine.stop();
    setActiveCassette(null);
  };


  if (isAuthenticating) {
    return (
      <div 
        className="crt-container pixel-box-inset"
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#030a05',
          color: '#39ff14',
          gap: '20px'
        }}
      >
        <div className="crt-screen" style={{ textAlign: 'center' }}>
          <div className="font-pixel" style={{ fontSize: '16px', marginBottom: '16px', animation: 'pulse 1.2s infinite' }}>
            CONNECTING TO SPOTIFY...
          </div>
          <div className="font-retro" style={{ fontSize: '14px', opacity: 0.8 }}>
            正在與 Spotify 建立安全連線，請稍候。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={crtFilterOn ? 'crt-container' : ''} 
      style={{ 
        width: '100%', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '24px 12px'
      }}
    >
      <div className={crtFilterOn ? 'crt-screen' : ''} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {page === 'home' ? (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1 
                className="font-pixel" 
                style={{ 
                  fontSize: '20px', 
                  color: '#ffdf00', 
                  textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000',
                  letterSpacing: '1px',
                  marginBottom: '10px'
                }}
              >
                ★ POCKET WALKMAN ★
              </h1>
            </div>

            {/* Main Section */}
            <div className="main-layout">
              {/* Walkman Player */}
              <div className="main-layout-player">
                <Walkman
                  cassette={activeCassette}
                  audioEngine={audioEngine}
                  currentSide={currentSide}
                  onFlipSide={handleFlipSide}
                  onEject={handleEject}
                  isLidOpen={isLidOpen}
                  setLidOpen={setLidOpen}
                  crtFilterOn={crtFilterOn}
                  setCrtFilterOn={setCrtFilterOn}
                />
              </div>

              {/* Sidebar: Cassette Rack & Navigation */}
              <div className="main-layout-sidebar" style={{ gap: '20px' }}>
                {/* Cassette Shelf */}
                <CassetteRack
                  cassettes={allCassettes}
                  onSelectCassette={handleSelectCassette}
                  activeCassetteId={activeCassette?.id}
                />

                {/* Settings Panel Button */}
                <button
                  className="pixel-btn"
                  onClick={() => setPage('settings')}
                  style={{
                    backgroundColor: '#00f3ff',
                    color: '#000',
                    width: '100%',
                    padding: '16px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    boxShadow: 'inset -4px -4px 0 0 #000, inset 4px 4px 0 0 #fff, 0 8px 0 0 rgba(0,0,0,0.3)'
                  }}
                >
                  <Settings size={16} />
                  進入卡帶工作室 (ENTER TAPE STUDIO)
                </button>

                {/* Helper Tips Box */}
                <div 
                  className="pixel-box-inset font-retro"
                  style={{ 
                    fontSize: '12px', 
                    color: '#a0a0ab', 
                    padding: '12px',
                    lineHeight: '1.5',
                    backgroundColor: '#1b1b1f'
                  }}
                >
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#ffdf00', fontWeight: 'bold', marginBottom: '6px' }}>
                    <HelpCircle size={14} />
                    操作指南 (WALKTHROUGH)
                  </div>
                  1. 點擊卡帶架上的卡帶放入隨身聽。<br/>
                  2. 點擊 <strong>PLAY</strong> 播放，齒輪將轉動並顯示音樂波形。<br/>
                  3. 可點擊 <strong>NEXT</strong>/<strong>PREV</strong> 切換上一首與下一首。<br/>
                  4. A 面播完會自動停止，請點擊黃色按鈕進行 <strong>翻面</strong>。<br/>
                  5. 前往「卡帶工作室」可自訂卡帶配色並匯入 Spotify 歌單！
                  
                  <div style={{ marginTop: '12px', fontSize: '10px', textAlign: 'right', opacity: 0.5, color: '#a0a0ab' }}>
                    v1.0.0 | by TanyaH
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <SettingsPage
            onBack={() => setPage('home')}
            cassettes={allCassettes}
            onAddCassette={handleAddCassette}
            onDeleteCassette={handleDeleteCassette}
            onClearAllCassettes={handleClearAllCassettes}
            showAlert={showPixelAlert}
          />
        )}
      </div>
      <PixelModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    </div>
  );
}

export default App;
