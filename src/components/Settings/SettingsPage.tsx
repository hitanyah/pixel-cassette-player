import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, ShieldAlert, Key, Plus, ExternalLink } from 'lucide-react';
import { 
  Cassette, 
  CASSETTE_SHELL_COLORS, 
  CASSETTE_STICKER_COLORS, 
  CASSETTE_STICKER_PATTERNS, 
  CASSETTE_TEXT_COLORS 
} from '../../services/mockData';
import { redirectToSpotifyAuth, fetchSpotifyPlaylist, getStoredToken, getRedirectUri, shortenUrl } from '../../services/spotify';
import { CassetteTape } from '../Cassette/CassetteTape';

interface SettingsPageProps {
  onBack: () => void;
  cassettes: Cassette[];
  onAddCassette: (cassette: Cassette) => void;
  onDeleteCassette: (id: string) => void;
  onClearAllCassettes: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onBack,
  cassettes,
  onAddCassette,
  onDeleteCassette,
  onClearAllCassettes
}) => {
  // Spotify Integration States
  const [clientId, setClientId] = useState(() => localStorage.getItem('spotify_client_id') || '');
  const [isConnected, setIsConnected] = useState(false);
  const [importMode, setImportMode] = useState<'spotify' | 'manual'>('manual');

  // New Cassette Form States
  const [playlistInput, setPlaylistInput] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [shellColor, setShellColor] = useState(CASSETTE_SHELL_COLORS[0].value);
  const [stickerColor, setStickerColor] = useState(CASSETTE_STICKER_COLORS[0].value);
  const [stickerPattern, setStickerPattern] = useState(CASSETTE_STICKER_PATTERNS[0].value as any);
  const [labelTextColor, setLabelTextColor] = useState(CASSETTE_TEXT_COLORS[0].value);

  // Loading/Error states
  const [isLoading, setIsLoading] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check Spotify login on mount
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      setIsConnected(true);
    }
  }, []);

  // Handle Spotify Connect
  const handleSpotifyConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) {
      setErrorMsg('請輸入 Spotify Client ID！');
      return;
    }
    
    localStorage.setItem('spotify_client_id', clientId.trim());
    setErrorMsg(null);

    // Redirect URI must match what user registers in Spotify Dashboard
    const redirectUri = getRedirectUri();
    try {
      await redirectToSpotifyAuth(clientId.trim(), redirectUri);
    } catch (e) {
      setErrorMsg('跳轉至 Spotify 授權失敗。請檢查您的 Client ID。');
    }
  };

  const handleSpotifyDisconnect = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expires_at');
    localStorage.removeItem('spotify_refresh_token');
    setIsConnected(false);
    setSuccessMsg('已中斷與 Spotify 的連線。');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Import Playlist as Cassette
  const handleImportPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (importMode === 'spotify') {
      if (!playlistInput.trim()) {
        setErrorMsg('請提供 Spotify 歌單連結或 ID！');
        return;
      }

      const token = getStoredToken();
      if (!token) {
        setErrorMsg('Spotify Token 已過期或未連線，請先在上方登入。');
        return;
      }

      setIsLoading(true);

      try {
        const playlistData = await fetchSpotifyPlaylist(playlistInput, token);
        
        const newCassette: Cassette = {
          ...playlistData,
          title: customTitle.trim() || playlistData.title,
          artist: customArtist.trim() || playlistData.artist,
          shellColor,
          stickerColor,
          stickerPattern,
          labelTextColor
        };

        onAddCassette(newCassette);
        setSuccessMsg(`卡帶「${newCassette.title}」已成功新增至卡帶架！`);
        setPlaylistInput('');
        setCustomTitle('');
        setCustomArtist('');
        
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err: any) {
        if (err.message === 'UNAUTHORIZED') {
          setErrorMsg('Spotify 授權失效，請重新中斷並點擊 Connect 登入。');
          handleSpotifyDisconnect();
        } else {
          setErrorMsg(err.message || '抓取歌單時發生錯誤。請確認歌單是否設為「公開」或連結是否正確。');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Manual Mode
      if (!customTitle.trim()) {
        setErrorMsg('請填寫卡帶名稱！');
        return;
      }

      const newCassette: Cassette = {
        id: `custom-${Date.now()}`,
        title: customTitle.trim().toUpperCase(),
        artist: customArtist.trim() || 'Custom Creator',
        shellColor,
        stickerColor,
        stickerPattern,
        labelTextColor,
        tracks: [
          {
            id: `custom-track-1-${Date.now()}`,
            title: 'Custom Electronic Chill',
            artist: 'Lofi Chiptune',
            duration: 372,
            url: 'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3'
          },
          {
            id: `custom-track-2-${Date.now()}`,
            title: 'Retro Wave Ride',
            artist: 'Lofi Chiptune',
            duration: 302,
            url: 'https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3'
          },
          {
            id: `custom-track-3-${Date.now()}`,
            title: 'Arcade Pixel Beat',
            artist: 'Lofi Chiptune',
            duration: 344,
            url: 'https://cdn.freesound.org/previews/320/320654_5260872-lq.mp3'
          }
        ]
      };

      onAddCassette(newCassette);
      setSuccessMsg(`卡帶「${newCassette.title}」已成功手動建立！`);
      setCustomTitle('');
      setCustomArtist('');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Mock Cassette (For preview updating)
  const previewCassette: Cassette = {
    id: 'preview',
    title: customTitle.trim() || 'MY AWESOME PLAYLIST',
    artist: customArtist.trim() || 'CREATOR NAME',
    shellColor,
    stickerColor,
    stickerPattern,
    labelTextColor,
    tracks: []
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px 10px' }}>
      {/* Header back bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          className="pixel-btn" 
          onClick={onBack}
          style={{ backgroundColor: '#2d2d33' }}
        >
          <ArrowLeft size={14} />
          返回主機 (BACK)
        </button>
        <h2 className="font-pixel" style={{ fontSize: '14px', color: '#ffdf00', margin: 0, textShadow: '2px 2px 0 #000' }}>
          TAPE STUDIO // 卡帶設定後台
        </h2>
      </div>

      {/* Grid container */}
      <div className="settings-grid">
        
        {/* Left Column: Spotify OAuth & Creation Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Spotify Auth Panel */}
          <div className="pixel-box-outset" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="font-pixel" style={{ fontSize: '11px', color: '#00f3ff', borderBottom: '2px solid #000', paddingBottom: '6px' }}>
              STEP 1: SPOTIFY 帳戶連線
            </div>
            
            {isConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#39ff14', fontSize: '12px', fontWeight: 'bold' }}>
                  <div className="led green on" />
                  Spotify 已成功連線授權
                </div>
                <button 
                  className="pixel-btn" 
                  onClick={handleSpotifyDisconnect}
                  style={{ width: '100%', backgroundColor: '#ff3b30' }}
                >
                  中斷連線 (DISCONNECT)
                </button>
              </div>
            ) : (
              <form onSubmit={handleSpotifyConnect} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '11px', lineHeight: '1.4', opacity: 0.8 }}>
                  抓取個人歌單需要自訂 Spotify Client ID，請至 
                  <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#00f3ff', textDecoration: 'underline', marginLeft: '4px' }}>
                    Spotify Dev Dashboard <ExternalLink size={10} style={{ display: 'inline' }} />
                  </a> 申請，並將 <strong>{getRedirectUri()}</strong> 加進 Redirect URIs。
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="font-pixel" style={{ fontSize: '8px', color: '#a0a0ab' }}>CLIENT ID:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="text" 
                      placeholder="貼上您的 Spotify Client ID"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="pixel-box-inset font-retro"
                      style={{ 
                        flex: 1, 
                        padding: '8px 12px', 
                        color: '#fff', 
                        backgroundColor: '#000',
                        border: '3px solid #000',
                        fontSize: '12px'
                      }}
                    />
                    <button type="submit" className="pixel-btn" style={{ backgroundColor: '#00f3ff', color: '#000' }}>
                      <Key size={14} />
                      CONNECT
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Import/Create Cassette Form */}
          <div className="pixel-box-outset" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="font-pixel" style={{ fontSize: '11px', color: '#ff007f', borderBottom: '2px solid #000', paddingBottom: '6px' }}>
              STEP 2: 製作我的卡帶
            </div>

            {/* Mode selection tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`pixel-btn ${importMode === 'manual' ? 'active' : ''}`}
                onClick={() => { setImportMode('manual'); setErrorMsg(null); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '9px',
                  backgroundColor: importMode === 'manual' ? '#ffd300' : '#4a4e59',
                  color: importMode === 'manual' ? '#000' : '#fff',
                  boxShadow: importMode === 'manual' 
                    ? 'inset 2px 2px 0 0 #000, inset -2px -2px 0 0 #ffffff, 0 0 0 2px #000' 
                    : undefined
                }}
              >
                手動建立 (MANUAL)
              </button>
              <button
                type="button"
                className={`pixel-btn ${importMode === 'spotify' ? 'active' : ''}`}
                onClick={() => { setImportMode('spotify'); setErrorMsg(null); }}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '9px',
                  backgroundColor: importMode === 'spotify' ? '#1db954' : '#4a4e59',
                  color: importMode === 'spotify' ? '#fff' : '#fff',
                  boxShadow: importMode === 'spotify' 
                    ? 'inset 2px 2px 0 0 #000, inset -2px -2px 0 0 #5eff5e, 0 0 0 2px #000' 
                    : undefined
                }}
              >
                SPOTIFY 匯入
              </button>
            </div>

            <form onSubmit={handleImportPlaylist} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Playlist Link (Only for Spotify Import Mode) */}
              {importMode === 'spotify' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="font-pixel" style={{ fontSize: '8px', color: '#a0a0ab' }}>SPOTIFY 歌單網址或 ID:</label>
                  <input 
                    type="text" 
                    placeholder="https://open.spotify.com/playlist/..."
                    value={playlistInput}
                    onChange={(e) => setPlaylistInput(e.target.value)}
                    disabled={!isConnected || isLoading}
                    className="pixel-box-inset font-retro"
                    style={{ 
                      padding: '8px 12px', 
                      color: '#fff', 
                      backgroundColor: '#000',
                      border: '3px solid #000',
                      fontSize: '12px',
                      opacity: !isConnected ? 0.5 : 1
                    }}
                  />
                </div>
              )}

              {/* Custom Metadata (Required for manual, Optional for Spotify) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="font-pixel" style={{ fontSize: '8px', color: '#a0a0ab' }}>
                    卡帶歌單名稱 {importMode === 'manual' ? '(必填)' : '(選填)'}:
                  </label>
                  <input 
                    type="text" 
                    placeholder={importMode === 'manual' ? '例如: 我的夏天歌單' : '預設為歌單名稱'}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    disabled={isLoading}
                    className="pixel-box-inset font-retro"
                    style={{ 
                      padding: '8px 12px', 
                      color: '#fff', 
                      backgroundColor: '#000',
                      border: '3px solid #000',
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="font-pixel" style={{ fontSize: '8px', color: '#a0a0ab' }}>手寫製作者 (選填):</label>
                  <input 
                    type="text" 
                    placeholder={importMode === 'manual' ? '例如: DJ PIXEL' : '預設為歌單建立者'}
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    disabled={isLoading}
                    className="pixel-box-inset font-retro"
                    style={{ 
                      padding: '8px 12px', 
                      color: '#fff', 
                      backgroundColor: '#000',
                      border: '3px solid #000',
                      fontSize: '12px'
                    }}
                  />
                </div>
              </div>

              {/* Casings style selectors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="font-pixel" style={{ fontSize: '8px', color: '#a0a0ab' }}>卡帶外殼配色 (SHELL COLOR):</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {CASSETTE_SHELL_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setShellColor(c.value)}
                      title={c.name}
                      style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: c.value,
                        border: shellColor === c.value ? '3px solid #ffdf00' : '2px solid #000',
                        boxShadow: shellColor === c.value ? '0 0 6px #ffdf00' : 'none',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Sticker Style Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Sticker Color */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="font-pixel" style={{ fontSize: '8px', color: '#a0a0ab' }}>貼紙底色 (STICKER):</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {CASSETTE_STICKER_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setStickerColor(c.value)}
                        title={c.name}
                        style={{
                          width: '22px',
                          height: '22px',
                          backgroundColor: c.value,
                          border: stickerColor === c.value ? '3px solid #000' : '1px solid #777',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Handwriting Color */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="font-pixel" style={{ fontSize: '8px', color: '#a0a0ab' }}>文字筆跡 (TEXT):</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {CASSETTE_TEXT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setLabelTextColor(c.value)}
                        title={c.name}
                        style={{
                          width: '22px',
                          height: '22px',
                          backgroundColor: c.value,
                          border: labelTextColor === c.value ? '3px solid #000' : '1px solid #777',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticker Pattern */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="font-pixel" style={{ fontSize: '8px', color: '#a0a0ab' }}>貼紙背景條紋樣式:</label>
                <select
                  value={stickerPattern}
                  onChange={(e) => setStickerPattern(e.target.value as any)}
                  className="pixel-box-inset font-retro"
                  style={{
                    padding: '6px 12px',
                    color: '#fff',
                    backgroundColor: '#000',
                    border: '3px solid #000',
                    fontSize: '12px'
                  }}
                >
                  {CASSETTE_STICKER_PATTERNS.map((p) => (
                    <option key={p.value} value={p.value}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Notifications */}
              {errorMsg && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#ff3b30', fontSize: '11px', fontWeight: 'bold' }}>
                  <ShieldAlert size={14} />
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#39ff14', fontSize: '11px', fontWeight: 'bold' }}>
                  <Plus size={14} />
                  {successMsg}
                </div>
              )}

              {/* Add Button */}
              <button 
                type="submit" 
                className="pixel-btn" 
                disabled={(importMode === 'spotify' && !isConnected) || isLoading}
                style={{ 
                  width: '100%', 
                  backgroundColor: ((importMode === 'spotify' && !isConnected) || isLoading) ? '#555' : '#39ff14',
                  color: ((importMode === 'spotify' && !isConnected) || isLoading) ? '#888' : '#000',
                  marginTop: '10px'
                }}
              >
                <Save size={16} />
                {isLoading ? '載入中 (LOADING...)' : importMode === 'spotify' ? '從 SPOTIFY 匯入卡帶' : '新增自訂卡帶 (ADD CASSETTE)'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Live Preview & Added Cassettes List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Real-time Cassette Preview */}
          <div className="pixel-box-outset" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minHeight: '230px', justifyContent: 'center' }}>
            <div className="font-pixel" style={{ fontSize: '11px', color: '#ffd300', alignSelf: 'flex-start', borderBottom: '2px solid #000', width: '100%', paddingBottom: '6px' }}>
              LIVE PREVIEW // 卡帶外觀預覽
            </div>
            
            <div style={{ padding: '10px 0' }}>
              <CassetteTape
                cassette={previewCassette}
                side="A"
                size="normal"
              />
            </div>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>
              調整左方配色選項，即時呈現您的卡帶外型！
            </span>
          </div>

          {/* User Added Cassettes Rack List */}
          <div className="pixel-box-outset" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '2px solid #000', 
                paddingBottom: '6px' 
              }}
            >
              <div className="font-pixel" style={{ fontSize: '11px', color: '#a0a0ab' }}>
                MY COLLECTION // 我新增的卡帶
              </div>
              {cassettes.filter(c => !c.id.startsWith('default-')).length > 0 && (
                <button
                  type="button"
                  className="pixel-btn"
                  onClick={onClearAllCassettes}
                  style={{
                    backgroundColor: '#ff3b30',
                    color: '#fff',
                    padding: '2px 8px',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    boxShadow: 'inset -2px -2px 0 0 #000, inset 2px 2px 0 0 #ff8888, 0 0 0 2px #000'
                  }}
                >
                  一鍵清空 (CLEAR ALL)
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {cassettes.filter(c => !c.id.startsWith('default-')).length === 0 ? (
                <div className="font-pixel" style={{ fontSize: '8px', color: '#a0a0ab', textAlign: 'center', padding: '16px 0' }}>
                  目前尚無自訂卡帶 (預設內建卡帶不顯示於此)
                </div>
              ) : (
                cassettes
                  .filter(c => !c.id.startsWith('default-'))
                  .map((tape) => (
                    <div 
                      key={tape.id}
                      className="pixel-box-inset"
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '6px 12px',
                        backgroundColor: '#1b1c1e',
                        borderWidth: '2px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '75%' }}>
                        <span className="font-retro" style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>
                          {tape.title}
                        </span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>
                          {tape.tracks.length} 首歌 // {tape.artist}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="pixel-btn" 
                          onClick={async () => {
                            if (sharingId) return;
                            setSharingId(tape.id);
                            
                            const str = JSON.stringify(tape);
                            const encoded = btoa(unescape(encodeURIComponent(str)));
                            
                            // Include client ID in the URL to make it seamless for friends
                            let clientParam = '';
                            if (tape.isSpotifyPlaylist) {
                              const clientId = localStorage.getItem('spotify_client_id');
                              if (clientId) {
                                clientParam = `&client_id=${encodeURIComponent(clientId)}`;
                              }
                            }
                            
                            const shareUrl = `${window.location.origin}${window.location.pathname}?tape=${encodeURIComponent(encoded)}${clientParam}`;
                            
                            let finalUrl = shareUrl;
                            let isShortened = false;
                            
                            try {
                              const shortUrl = await shortenUrl(shareUrl);
                              finalUrl = shortUrl;
                              isShortened = true;
                            } catch (e) {
                              console.warn('URL shortening failed, falling back to long URL:', e);
                            }
                            
                            navigator.clipboard.writeText(finalUrl).then(() => {
                              if (isShortened) {
                                alert(`「${tape.title}」的分享短網址已複製！快去貼給朋友吧！\n\n短網址：${finalUrl}`);
                              } else {
                                alert(`「${tape.title}」的分享連結已複製！\n\n(注意：短網址服務暫時不可用，已複製原長網址)`);
                              }
                            }).catch(err => {
                              console.error('Failed to copy', err);
                              prompt('請手動複製此連結：', finalUrl);
                            });
                            
                            setSharingId(null);
                          }}
                          style={{ 
                            backgroundColor: sharingId === tape.id ? '#777' : '#00f3ff', 
                            color: '#000',
                            padding: '6px 8px',
                            boxShadow: 'inset -2px -2px 0 0 #000, inset 2px 2px 0 0 #fff, 0 0 0 2px #000',
                            cursor: sharingId === tape.id ? 'wait' : 'pointer',
                            opacity: sharingId === tape.id ? 0.7 : 1
                          }}
                          title={sharingId === tape.id ? "Shortening..." : "Share Cassette"}
                          disabled={sharingId !== null}
                        >
                          {sharingId === tape.id ? (
                            <span style={{ fontSize: '8px', fontWeight: 'bold' }}>...</span>
                          ) : (
                            <ExternalLink size={12} />
                          )}
                        </button>
                        <button 
                          className="pixel-btn" 
                          onClick={() => onDeleteCassette(tape.id)}
                          style={{ 
                            backgroundColor: '#ff3b30', 
                            padding: '6px 8px',
                            boxShadow: 'inset -2px -2px 0 0 #000, inset 2px 2px 0 0 #ff8888, 0 0 0 2px #000'
                          }}
                          title="Delete Cassette"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
