# 📻 畫素口袋隨身聽 (Pocket Walkman)

這是一個 100% 復古畫素風（Retro Pixel Art）的互動式卡帶隨身聽網頁應用程式。使用者可以在卡帶架上挑選卡帶放入隨身聽，模擬真實卡帶的機械操作（播放、暫停、快轉音效、倒帶與物理翻面），並支援自訂卡帶樣式與匯入 Spotify 歌單曲目。

---

## 🎨 專案亮點與特色

### 1. 擬真隨身聽操作與物理反饋
* **機械按鍵連動**：`PLAY`、`PAUSE`、`STOP` 等按鍵完全模擬真實隨身聽物理連動（按下 STOP 會使其他按鍵彈起，暫停播放而不歸零進度）。
* **雙軸磁帶圈厚度模擬**：卡帶視窗內部的磁帶厚度會隨著播放進度動態變化（例如 Side A 播放時，左軸磁帶漸漸變少，右軸漸漸變多）。
* **無縫精準換軌**：徹底解決底層音訊時間差問題，確保多首曲目切換時精準無縫，不會提早重播或中斷。
* **3D 卡帶翻面動畫**：當一面的歌曲全數播完時，隨身聽會自動「彈起」停止播放並跳出翻面提示。點選後，卡帶會在空中進行 **3D 旋轉翻面** 後裝回。

### 2. 即時畫素 LCD 與 Canvas 波形頻譜
* **跑馬燈螢幕**：LCD 螢幕會以跑馬燈動態滾動顯示目前的歌名與歌手。
* **音訊頻譜圖**：整合 Web Audio API，以 HTML5 Canvas 繪製 blocky 柱狀頻譜。
* **無訊號 / 跨域自動模擬**：如果歌曲因瀏覽器跨域限制 (CORS) 無法讀取波形，系統會自動切換為「動態波形模擬演算法」，確保畫素波形永遠活潑地隨著節奏起舞。

### 3. 卡帶工作室 (自訂與 Spotify 匯入)
* **豐富自訂選項**：提供經典卡帶外殼配色、多款復古貼紙圖樣，以及包含「鉛筆黑」、「馬克筆紅」、「原子筆藍」與新推出的「立可白 (Correction Fluid White)」等多種專屬手寫字色。
* **手動新增模式（無需帳戶）**：不需連線 Spotify，直接自選樣式並輸入名稱後即可一鍵新增，立刻在首頁卡帶架上拿取播放。預設更搭載了免授權的 Lofi 與 8-bit 音樂。
* **Spotify 匯入模式**：支援安全、免 Server 端 Secret 暴露的 **Spotify PKCE OAuth 驗證連線**。輸入公開的 專輯/單曲/歌單 網址，即可自動獲取卡帶音訊 (30 秒試聽)。
* **即時卡帶預覽**：調整配色與樣式時，右側會顯示 100% 同步的卡帶 3D 預覽。
* **本地同步儲存**：卡帶庫自動同步儲存於瀏覽器的 `localStorage` 中。

### 4. 無伺服器卡帶分享 (URL Sharing)
* **特製連結分享**：在卡帶工作室中，每一張卡帶都可以產生專屬的分享網址 (`?tape=...`)，點選即自動複製到剪貼簿。
* **無後端架構**：系統將卡帶設定（包含配色與 Spotify ID）編碼為 Base64 字串，收到連結的朋友開啟網頁後，系統會自動解碼並將卡帶匯入至他的卡帶架中，達成免資料庫的社群分享體驗！

### 5. 響應式佈局 (Responsive Web Design)
* **桌面並排模式**：在寬螢幕下，隨身聽與卡帶架會完美並排，所有操作一目瞭然。
* **手機堆疊模式**：螢幕寬度縮小於 800px 時，會自動切換為垂直堆疊排列，並確保沒有多餘的水平卷軸。

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

啟動後，使用瀏覽器開啟：`http://localhost:5173`。

> **💡 手機測試 RWD 提示**
> 若您想在同一個 Wi-Fi 網路下的手機測試網頁，請改用以下指令啟動：
> ```bash
> npm run dev -- --host
> ```
> 接著在手機瀏覽器輸入電腦的區域網路 IP (例如 `http://192.168.1.113:5173`) 即可！

---

## 🔑 Spotify API 設定指引 (自訂歌單功能)

若您要使用「Spotify 歌單匯入」功能，需要準備一個 Spotify Developer Client ID：

1. 前往 [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) 並登入您的 Spotify 帳號。
2. 點選 **Create app**，填寫應用程式名稱。
3. 在 **Redirect URIs** 欄位填入（注意：**尾端不可加斜線**）：
   * `http://localhost:5173`
   * `http://127.0.0.1:5173` （建議同時填寫以防 IP 訪問）
4. 儲存後複製該 App 的 **Client ID**。
5. 前往網頁的 **TAPE STUDIO (卡帶工作室)**，將 Client ID 貼入 STEP 1 欄位並點選 **CONNECT**，即可完成登入授權！

---

## 📁 檔案結構說明

```text
pixel-cassette-player/
├── public/                 # 靜態資源
├── src/
│   ├── components/
│   │   ├── Cassette/
│   │   │   └── CassetteTape.tsx      # 卡帶外觀與齒輪/磁帶厚度動畫元件
│   │   ├── CassetteRack/
│   │   │   └── CassetteRack.tsx      # 木質卡帶架元件
│   │   ├── Walkman/
│   │   │   ├── DisplayScreen.tsx     # LCD 與 Canvas 頻譜視覺化元件
│   │   │   └── Walkman.tsx           # 隨身聽主機與控制按鍵元件
│   │   └── Settings/
│   │       └── SettingsPage.tsx      # 自訂卡帶配色與 Spotify 串接後臺
│   ├── hooks/
│   │   ├── useAudioPlayer.ts         # 基於 Web Audio API 封裝的播放引擎
│   │   └── useSpotifyPlayer.ts       # 基於 Spotify Web Playback SDK 的播放引擎
│   ├── services/
│   │   ├── mockData.ts               # 卡帶自訂選項定義與免版權 Lofi 音訊
│   │   ├── spotify.ts                # Spotify PKCE 授權流程與 API 抓取
│   │   └── spotify.test.ts           # Spotify API 映射與工具函數單元測試
│   ├── utils/
│   │   ├── audioHelpers.ts           # 播放時間落點計算純函數
│   │   └── audioHelpers.test.ts      # 音訊輔助函數單元測試
│   ├── App.tsx                       # 頁面路由器與全域狀態管理
│   ├── index.css                     # 核心 CSS 設計系統 (畫素邊框、CRT Scanlines)
│   └── main.tsx                      # 專案進入點
├── vitest.config.ts        # Vitest 設定檔 (整合 Vite 並啟用 JSDOM)
├── tsconfig.json
└── vite.config.ts
```

---

## 🧪 自動化單元測試 (Unit Testing)

專案配置了自動化單元測試以保護核心播放器邏輯與 API 資料處理，防止後續修改或功能擴充造成功能退化。

* **測試工具**：**Vitest**（測試執行器） + **JSDOM**（瀏覽器 API 模擬）。
* **測試範圍**：
  * 卡帶面總長度切換與音軌定位邏輯（`audioHelpers.ts`）。
  * Spotify 網址解析 Regex、Redirect URI 計算、Token 逾期清理與隨機金鑰長度（`spotify.ts`）。
* **指令**：
  ```bash
  # 1. 啟動監聽模式 (Watch Mode)
  npm run test
  
  # 2. 執行單次測試並產出報告
  npm run test:run
  ```

