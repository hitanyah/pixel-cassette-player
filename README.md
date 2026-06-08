# 📻 復古像素風卡帶隨身聽 (Retro Pixel Cassette Player)

這是一個 100% 復古像素風（Retro Pixel Art）的互動式卡帶隨身聽網頁應用程式。使用者可以在卡帶架上挑选卡帶放入隨身聽，模擬真實卡帶的机械操作（播放、暫停、快轉音效、倒帶與物理翻面），並支援自訂卡帶樣式與匯入 Spotify 歌單曲目。

---

## 🎨 專案亮點與特色

### 1. 擬真隨身聽操作與物理反饋
* **機械按鍵**：`PLAY`、`PAUSE`、`STOP`、`FF` (快轉)、`REW` (倒帶)、`EJECT` 按鍵皆具備 3D 按壓效果，並附有合成器產生的金屬敲擊與磁帶艙切換音效。
* **雙軸磁帶圈厚度模擬**：卡帶視窗內部的磁帶厚度會隨著播放進度動態變化（例如 Side A 播放時，左軸磁帶漸漸變少，右軸漸漸變多）。
* **3D 卡帶翻面動畫**：當 Side A 播完時，隨身聽會自動「彈起」並停止播放。使用者點擊「翻面 (FLIP)」後，卡帶會彈出並在空中進行 **3D 旋轉翻面** 後裝回，換至 Side B 播放。

### 2. 即時像素 LCD 與 Canvas 波形頻譜
* **跑馬燈螢幕**：LCD 螢幕會以跑馬燈動態滾動顯示目前的歌名與歌手。
* **音訊頻譜圖**：整合 Web Audio API，以 HTML5 Canvas 繪製 blocky 柱狀頻譜。
* **無訊號 / 跨域自動模擬**：如果歌曲因瀏覽器跨域限制 (CORS) 無法讀取波形，系統會自動切換為「動態波形模擬演算法」，確保像素波形永遠活潑地隨著節奏起舞。

### 3. 卡帶工作室 (自訂與 Spotify 匯入)
* **手動新增模式（無需帳戶）**：不需連接 Spotify，直接自選機身外殼顏色、貼紙、條紋背景與手寫字色，輸入名稱後一鍵新增，並能立刻在首頁卡帶架上拿取播放（預設搭載免授權 Lofi 音樂）。
* **Spotify 匯入模式**：支援安全、免 Server 端 Secret 暴露的 **Spotify PKCE OAuth 驗證連線**。輸入公開歌單 ID/網址，即可自動獲取卡帶音訊 (30 秒試聽)。
* **即時卡帶預覽**：調整配色與樣式時，右側會顯示 100% 同步的卡帶 3D 預覽。
* **本地同步儲存**：卡帶庫自動同步保存於瀏覽器的 `localStorage` 中。

---

## 🚀 快速開始

本專案使用 **React + TypeScript + Vite** 建置，請依序執行以下步驟在本機啟動：

### 1. 安裝與啟動
```bash
# 1. 進入專案資料夾
cd pixel-cassette-player

# 2. 安裝相依套件
npm install

# 3. 啟動本地開發伺服器
npm run dev
```

啟動後，使用瀏覽器打開：`http://localhost:5173` 或 `http://127.0.0.1:5173`。

---

## 🔑 Spotify API 設定指引 (自訂歌單功能)

若您要使用「Spotify 歌單匯入」功能，需要準備一個 Spotify Developer Client ID：

1. 前往 [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) 並登入您的 Spotify 帳號。
2. 點擊 **Create app**，填寫應用程式名稱。
3. 在 **Redirect URIs** 欄位填入（注意：**尾端不可加斜線**）：
   * `http://localhost:5173`
   * `http://127.0.0.1:5173` （建議同時填寫以防 IP 訪問）
4. 儲存後複製該 App 的 **Client ID**。
5. 前往網頁的 **TAPE STUDIO (卡帶工作室)**，將 Client ID 貼入 STEP 1 欄位並點擊 **CONNECT**，即可完成登入授權！

---

## 📁 檔案結構說明

```text
pixel-cassette-player/
├── public/                 # 靜態資源
├── src/
│   ├── components/
│   │   ├── Cassette/
│   │   │   └── CassetteTape.tsx      # 卡帶外觀與齒輪/磁帶厚度動畫組件
│   │   ├── CassetteRack/
│   │   │   └── CassetteRack.tsx      # 木質卡帶架組件
│   │   ├── Walkman/
│   │   │   ├── DisplayScreen.tsx     # LCD 與 Canvas 頻譜視覺化組件
│   │   │   └── Walkman.tsx           # 隨身聽主機與控制按鍵組件
│   │   └── Settings/
│   │       └── SettingsPage.tsx      # 自訂卡帶配色與 Spotify 串接後台
│   ├── hooks/
│   │   └── useAudioPlayer.ts         # 基於 Web Audio API 封裝的播放引擎
│   ├── services/
│   │   ├── mockData.ts               # 卡帶自訂選項定義與免版權 Lofi 音訊
│   │   └── spotify.ts                # Spotify PKCE 授權流程與 API 抓取
│   ├── App.tsx                       # 頁面路由器與全域狀態管理
│   ├── index.css                     # 核心 CSS 設計系統 (像素邊框、CRT Scanlines)
│   └── main.tsx                      # 專案進入點
├── tsconfig.json
└── vite.config.ts
```
