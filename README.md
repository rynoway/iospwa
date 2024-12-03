# iOS PWA 錄音應用

這是一個基於 Vue 3 + Vite 開發的 iOS PWA 錄音應用，支持在 iOS Safari 瀏覽器中進行音頻錄製和播放。

## 功能特點

- 音頻錄製和播放
- 錄音時長顯示
- 錄音狀態提示
- 錯誤提示彈窗
- iOS Safari 兼容性優化
- PWA 支持

## 開發環境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- Vue 3
- Vite

## 安裝和運行

1. 安裝依賴：
```bash
npm install
```

2. 開發模式運行：
```bash
npm run dev
```

3. 生產環境構建：
```bash
npm run build
```

## 使用說明

1. 在 iOS Safari 中訪問應用
2. 允許麥克風訪問權限
3. 點擊錄音按鈕開始錄音
4. 再次點擊停止錄音
5. 使用播放按鈕控制音頻播放

## 常見問題解決

### 錄音失敗

如果遇到錄音失敗的情況，請確保：
1. 已允許麥克風訪問權限
2. 設備麥克風正常工作
3. 沒有其他應用正在使用麥克風

### 緩存問題

如果更新後頁面沒有變化，請嘗試：
1. 清除瀏覽器緩存
2. 在 iOS Safari 中：
   - 設置 -> Safari -> 清除歷史記錄和網站數據
   - 或使用無痕模式訪問

## 技術棧

- Vue 3 (Composition API)
- Vite
- MediaRecorder API
- Web Audio API
- PWA

## 瀏覽器支持

- iOS Safari >= 14.5
- Chrome >= 80
- Firefox >= 75
- Edge >= 80

## 注意事項

1. 必須使用 HTTPS 或 localhost 訪問（WebRTC 要求）
2. iOS Safari 對 WebM 格式支持有限，已做相應優化
3. PWA 安裝需要 HTTPS 環境

## 開發建議

1. 使用 Chrome DevTools 的設備模擬器進行開發測試
2. 在實機 iOS 設備上進行最終測試
3. 注意音頻格式的兼容性問題

## License

MIT
