<template>
  <div class="app" :class="{ 'ios-installed': isIOSInstalled }">
    <div class="nav-bar">
      <h1>iOS PWA Test</h1>
    </div>

    <div class="content">
      <div class="card">
        <h2>iOS 錄音測試</h2>
        <AudioRecorder />
      </div>

      <!-- iOS 安裝提示 -->
      <!-- <div v-if="showInstallPrompt" class="install-prompt">
        <div class="prompt-content">
          <h3>Install for Better Experience</h3>
          <p>
            <span class="step">1. Tap <img src="/share-icon.svg" alt="share" class="icon" /></span>
            <span class="step">2. Scroll and tap "Add to Home Screen"</span>
          </p>
          <button class="ios-style-button" @click="dismissPrompt">Got it</button>
        </div>
      </div> -->
    </div> 

    <!-- 底部導航欄 -->
    <!-- <div class="tab-bar">
      <div class="tab-item active">
        <i class="tab-icon">🏠</i>
        <span>Home</span>
      </div>
      <div class="tab-item">
        <i class="tab-icon">📝</i>
        <span>Notes</span>
      </div>
      <div class="tab-item">
        <i class="tab-icon">⚙️</i>
        <span>Settings</span>
      </div>
    </div> -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AudioRecorder from './components/AudioRecorder.vue'

const isPWA = ref(false)
const showInstallPrompt = ref(false)
const isIOSInstalled = ref(false)
const deviceInfo = ref('')
const iOSVersion = ref('Not iOS')
const safariVersion = ref('N/A')
const isStandalone = ref(false)
const displayMode = ref('browser')

function getIOSVersion() {
  const match = navigator.userAgent.match(/OS (\d+_\d+)/i)
  return match ? match[1].replace('_', '.') : null
}

function getSafariVersion() {
  const match = navigator.userAgent.match(/Version\/(\d+\.\d+)/i)
  return match ? match[1] : null
}

onMounted(() => {
  // Check if running as PWA
  isPWA.value = window.matchMedia('(display-mode: standalone)').matches
  
  // Get device info
  deviceInfo.value = /iPad/.test(navigator.userAgent) ? 'iPad' : 
                    /iPhone/.test(navigator.userAgent) ? 'iPhone' : 
                    'Other'

  // Get iOS version
  const iosVer = getIOSVersion()
  if (iosVer) {
    iOSVersion.value = iosVer
  }

  // Get Safari version
  const safariVer = getSafariVersion()
  if (safariVer) {
    safariVersion.value = safariVer
  }

  // Check standalone mode
  isStandalone.value = ('standalone' in window.navigator) && window.navigator.standalone

  // Get display mode
  displayMode.value = isPWA.value ? 'standalone' : 
                     isStandalone.value ? 'standalone (iOS)' : 'browser'

  // 檢測是否是 iOS 設備
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  // 檢測是否已經安裝
  isIOSInstalled.value = window.navigator.standalone === true
  
  // 如果是 iOS 且未安裝，顯示提示
  if (isIOS && !isIOSInstalled.value && !localStorage.getItem('installPromptDismissed')) {
    showInstallPrompt.value = true
  }

  // 防止所有默認觸摸行為
  document.addEventListener('touchstart', preventDefaultBehavior, { passive: false })
  document.addEventListener('touchmove', preventDefaultBehavior, { passive: false })
  document.addEventListener('touchend', preventDefaultBehavior, { passive: false })
  
  // 防止雙擊縮放
  document.addEventListener('dblclick', preventDefaultBehavior, { passive: false })
  
  // 防止縮放
  document.addEventListener('gesturestart', preventDefaultBehavior, { passive: false })
  document.addEventListener('gesturechange', preventDefaultBehavior, { passive: false })
  document.addEventListener('gestureend', preventDefaultBehavior, { passive: false })

  // 防止滾動刷新
  document.body.style.overscrollBehavior = 'none'
  
  // 禁用所有默認觸摸行為
  document.documentElement.style.touchAction = 'none'
})

// 統一的事件處理函數
function preventDefaultBehavior(event) {
  // 檢查是否是來自允許的元素
  const allowedElements = ['INPUT', 'TEXTAREA', 'SELECT']
  if (allowedElements.includes(event.target.tagName)) {
    return
  }

  // 檢查是否有特定的 data 屬性允許默認行為
  if (event.target.dataset.allowDefault === 'true') {
    return
  }

  // 阻止所有其他默認行為
  event.preventDefault()
}

onUnmounted(() => {
  // 清理事件監聽器
  document.removeEventListener('touchstart', preventDefaultBehavior)
  document.removeEventListener('touchmove', preventDefaultBehavior)
  document.removeEventListener('touchend', preventDefaultBehavior)
  document.removeEventListener('dblclick', preventDefaultBehavior)
  document.removeEventListener('gesturestart', preventDefaultBehavior)
  document.removeEventListener('gesturechange', preventDefaultBehavior)
  document.removeEventListener('gestureend', preventDefaultBehavior)
})

const dismissPrompt = () => {
  showInstallPrompt.value = false
  localStorage.setItem('installPromptDismissed', 'true')
}
</script>

<style>
/* 重置樣式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  overscroll-behavior: none;
}

/* 禁用默認的滾動刷新行為 */
html, body {
  overscroll-behavior-y: none;
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 允許內容區域滾動 */
.content {
  height: calc(100% - 50px - env(safe-area-inset-bottom));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  padding-bottom: calc(env(safe-area-inset-bottom) + 83px);
}

/* 主容器 */
.app {
  min-height: 100vh;
  background-color: #f2f2f7;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* 導航欄 */
.nav-bar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: env(safe-area-inset-top) 16px 10px;
  position: sticky;
  top: 0;
  z-index: 100;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.nav-bar h1 {
  font-size: 17px;
  font-weight: 600;
  color: #000;
}

/* 內容區域 */
.content {
  padding: 16px;
  padding-bottom: calc(env(safe-area-inset-bottom) + 83px);
}

.card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.card h2 {
  margin-bottom: 16px;
  font-size: 20px;
  color: #1c1c1e;
}

.status {
  margin-top: 20px;
  padding: 20px;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  text-align: left;
  margin-top: 20px;
}

.info-item {
  background: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.info-item strong {
  display: block;
  margin-bottom: 5px;
  color: #666;
}

.status-active {
  color: #4CAF50;
  font-weight: bold;
}

/* 安裝提示 */
.install-prompt {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  z-index: 1000;
}

.prompt-content {
  background: white;
  border-radius: 13px;
  padding: 16px;
  text-align: center;
}

.step {
  display: block;
  margin: 10px 0;
}

.icon {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}

/* iOS 風格按鈕 */
.ios-style-button {
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 17px;
  font-weight: 600;
  margin-top: 16px;
  width: 100%;
}

/* 底部標籤欄 */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 7px 0;
  color: #8e8e93;
}

.tab-item.active {
  color: #007AFF;
}

.tab-icon {
  display: block;
  font-size: 24px;
  margin-bottom: 2px;
}

.tab-item span {
  font-size: 10px;
}

/* iOS 已安裝狀態 */
.ios-installed {
  /* 移除滾動回彈效果 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.ios-installed .content {
  overflow-y: auto;
  height: calc(100vh - 44px - 49px);
  -webkit-overflow-scrolling: touch;
}
</style>
