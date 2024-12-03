<template>
  <div class="audio-recorder" @click.stop @touchstart.prevent @touchmove.prevent @touchend.prevent>
    <div class="status-panel">
      <div class="status-text" :class="{ 'recording': isRecording, 'error': statusText.includes('失敗') || statusText.includes('錯誤') }">
        {{ statusText }}
      </div>
      <div v-if="recordingTime" class="recording-time">{{ recordingTime }}s</div>
    </div>

    <!-- 權限請求部分 -->
    <div v-if="!hasRecordingPermission" class="permission-section" @touchstart.prevent @touchmove.prevent @touchend.prevent>
      <div class="permission-alert">
        <span class="alert-icon">🎤</span>
        <div class="permission-content">
          <h4>需要麥克風權限</h4>
          <p>請按照以下步驟授權：</p>
          <ol class="permission-steps">
            <li>點擊下方的「授權使用麥克風」按鈕</li>
            <li>在彈出的瀏覽器權限提示中選擇「允許」</li>
            <li>如果沒有看到提示，請檢查瀏覽器地址欄是否有權限圖標</li>
          </ol>
          <p class="permission-note">* 如果意外拒絕，請點擊瀏覽器地址欄的鎖頭圖標重新授權</p>
        </div>
      </div>
      <div class="button-container">
        <div 
          role="button"
          tabindex="0"
          class="permission-btn"
          :class="{ 'disabled': isRequestingPermission }"
          data-action="request-permission"
          @touchstart.prevent="handlePermissionRequest"
          @touchend.prevent="handlePermissionRequest"
          @click.prevent="handlePermissionRequest"
          @keyup.enter.prevent="handlePermissionRequest"
          @keyup.space.prevent="handlePermissionRequest"
        >
          {{ isRequestingPermission ? '請求中...' : '授權使用麥克風' }}
        </div>
      </div>
    </div>

    <!-- 錄音控制按鈕 -->
    <div v-if="hasRecordingPermission" class="controls">
      <!-- 錄音按鈕 -->
      <div 
        class="control-btn"
        :class="{ 'recording': isRecording }"
        @touchstart.prevent="toggleRecording"
        @click.prevent="toggleRecording"
      >
        <span class="btn-icon">{{ isRecording ? '⬛' : '⚫' }}</span>
        <span class="btn-text">{{ isRecording ? '停止' : '錄音' }}</span>
      </div>

      <!-- 播放按鈕 -->
      <div 
        v-if="audioURL"
        class="control-btn"
        :class="{ 'playing': isPlaying }"
        @touchstart.prevent="togglePlayback"
        @click.prevent="togglePlayback"
      >
        <span class="btn-icon">{{ isPlaying ? '⏸' : '▶' }}</span>
        <span class="btn-text">{{ isPlaying ? '暫停' : '播放' }}</span>
      </div>

      <!-- 音頻播放器 -->
      <audio 
        ref="audioPlayer"
        :src="audioURL"
        @ended="handlePlaybackEnd"
        @pause="handlePlaybackPause"
        @play="handlePlaybackStart"
        style="display: none;"
      ></audio>
    </div>

    <!-- 錄音支持狀態 -->
    <div class="support-status">
      <h3>設備支持狀態：</h3>
      <ul>
        <li>錄音API支持：{{ isRecordingSupported ? '✅' : '❌' }}</li>
        <li>音頻上下文支持：{{ isAudioContextSupported ? '✅' : '❌' }}</li>
        <li>麥克風權限：{{ hasRecordingPermission ? '✅' : '待授權' }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 狀態變量
const isRecording = ref(false)
const isPlaying = ref(false)
const audioURL = ref(null)
const recordingTime = ref(0)
const statusText = ref('準備就緒')
const hasRecordingPermission = ref(false)
const isRecordingSupported = ref(false)
const isAudioContextSupported = ref(false)
const isRequestingPermission = ref(false)

// 錄音相關變量
let mediaRecorder = null
let audioChunks = []
let recordingInterval = null
const audioPlayer = ref(null)

// 處理權限請求
const handlePermissionRequest = async (event) => {
  // 阻止所有默認行為
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }

  // 檢查是否是有效的觸發事件
  if (event && event.type === 'touchend' && event.target.dataset.action !== 'request-permission') {
    return
  }

  // 如果正在請求中，直接返回
  if (isRequestingPermission.value) {
    return
  }

  try {
    isRequestingPermission.value = true
    statusText.value = '正在請求麥克風權限...'

    // 使用 try/catch 包裝權限請求
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    })

    // 立即停止所有音軌
    stream.getTracks().forEach(track => track.stop())

    // 更新權限狀態
    hasRecordingPermission.value = true
    statusText.value = '已獲得麥克風權限'

  } catch (error) {
    console.error('權限請求失敗:', error)
    statusText.value = '無法獲得麥克風權限'
    hasRecordingPermission.value = false
  } finally {
    isRequestingPermission.value = false
  }
}

// 檢查瀏覽器支持
onMounted(() => {
  // 阻止默認行為
  const recorder = document.querySelector('.audio-recorder')
  if (recorder) {
    recorder.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false })
    recorder.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })
    recorder.addEventListener('touchend', (e) => e.preventDefault(), { passive: false })
  }

  // 為所有按鈕添加事件監聽
  document.querySelectorAll('.permission-btn, .control-btn').forEach((element) => {
    element.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false })
    element.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })
    element.addEventListener('touchend', (e) => e.preventDefault(), { passive: false })
  })

  // 檢查支持
  checkSupport()
})

// 處理權限變更
function handlePermissionChange(e) {
  hasRecordingPermission.value = e.target.state === 'granted'
  if (e.target.state === 'granted') {
    statusText.value = '已獲得麥克風權限'
  } else {
    statusText.value = '麥克風權限已' + (e.target.state === 'denied' ? '被拒絕' : '被撤銷')
    // 如果正在錄音，則停止錄音
    if (isRecording.value) {
      stopRecording()
    }
  }
}

// 開始/停止錄音
async function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

// 檢查支持的音頻格式
function getSupportedMimeType() {
  const types = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/mp4',
    'audio/mp4;codecs=mp4a',
    'audio/aac',
    'audio/ogg',
    'audio/wav'
  ]

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  return 'audio/webm' // 默認格式
}

// 開始錄音
async function startRecording() {
  try {
    console.log('開始請求錄音權限...')
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true }
      }
    })
    
    console.log('獲得錄音權限，準備創建 MediaRecorder...')
    const mimeType = getSupportedMimeType()
    console.log('使用的音頻格式:', mimeType)

    const options = {
      mimeType: mimeType,
      audioBitsPerSecond: 128000
    }

    try {
      mediaRecorder = new MediaRecorder(stream, options)
    } catch (e) {
      console.log('創建 MediaRecorder 失敗，嘗試使用默認配置...')
      mediaRecorder = new MediaRecorder(stream)
    }

    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      console.log('錄音停止，處理音頻數據...')
      const mimeType = mediaRecorder.mimeType || 'audio/webm'
      const audioBlob = new Blob(audioChunks, { type: mimeType })
      
      if (audioURL.value) {
        URL.revokeObjectURL(audioURL.value)
      }
      
      audioURL.value = URL.createObjectURL(audioBlob)
      statusText.value = '錄音完成'
      recordingTime.value = 0
      console.log('音頻處理完成')
    }

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder 錯誤:', event.error)
      statusText.value = '錄音出錯：' + event.error.message
      stopRecording()
    }

    console.log('開始錄音...')
    mediaRecorder.start(100) // 每100ms收集一次數據
    isRecording.value = true
    statusText.value = '正在錄音...'
    
    // 開始計時
    recordingTime.value = 0
    recordingInterval = setInterval(() => {
      recordingTime.value++
    }, 1000)

  } catch (err) {
    console.error('錄音失敗:', err)
    statusText.value = '錄音失敗：' + (err.message || '未知錯誤')
    isRecording.value = false
  }
}

// 停止錄音
function stopRecording() {
  console.log('準備停止錄音...')
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop()
      console.log('錄音已停止')
      
      // 停止所有音軌
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => {
          track.stop()
          console.log('音軌已停止')
        })
      }
      
      // 清理計時器
      if (recordingInterval) {
        clearInterval(recordingInterval)
        console.log('計時器已清理')
      }
      
      isRecording.value = false
    } catch (err) {
      console.error('停止錄音時出錯:', err)
      statusText.value = '停止錄音失敗：' + (err.message || '未知錯誤')
    }
  }
}

// 播放/暫停
function togglePlayback() {
  if (!audioPlayer.value) {
    console.error('找不到音頻播放器')
    return
  }

  try {
    if (isPlaying.value) {
      audioPlayer.value.pause()
    } else {
      const playPromise = audioPlayer.value.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('播放失敗:', error)
          statusText.value = '播放失敗：' + (error.message || '未知錯誤')
          isPlaying.value = false
        })
      }
    }
  } catch (err) {
    console.error('播放控制失敗:', err)
    statusText.value = '播放控制失敗：' + (err.message || '未知錯誤')
    isPlaying.value = false
  }
}

// 播放開始處理
function handlePlaybackStart() {
  isPlaying.value = true
  statusText.value = '正在播放'
}

// 播放暫停處理
function handlePlaybackPause() {
  isPlaying.value = false
  statusText.value = '已暫停'
}

// 播放結束處理
function handlePlaybackEnd() {
  isPlaying.value = false
  statusText.value = '準備就緒'
}

// 組件銷毀時清理
onUnmounted(() => {
  const recorder = document.querySelector('.audio-recorder')
  if (recorder) {
    recorder.removeEventListener('touchstart')
    recorder.removeEventListener('touchmove')
    recorder.removeEventListener('touchend')
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    stopRecording()
  }
  if (audioURL.value) {
    URL.revokeObjectURL(audioURL.value)
  }
})

// 檢查瀏覽器支持
async function checkSupport() {
  // 檢查 MediaRecorder API 支持
  isRecordingSupported.value = 'MediaRecorder' in window
  
  // 檢查 AudioContext 支持
  isAudioContextSupported.value = 'AudioContext' in window || 'webkitAudioContext' in window
  
  // 檢查麥克風權限狀態
  try {
    const result = await navigator.permissions.query({ name: 'microphone' })
    hasRecordingPermission.value = result.state === 'granted'
    
    // 監聽權限變化
    result.addEventListener('change', handlePermissionChange)
  } catch (err) {
    console.log('無法檢查麥克風權限狀態')
  }
}
</script>

<style scoped>
.audio-recorder {
  position: relative;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  overscroll-behavior: none;
}

.status-panel {
  text-align: center;
  margin-bottom: 20px;
}

.status-text {
  margin: 10px 0;
  text-align: center;
  font-size: 14px;
}

.status-text.recording {
  color: #ff3b30;
}

.status-text.error {
  color: #ff4444;
  background-color: #ffeeee;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.recording-time {
  font-size: 24px;
  font-weight: bold;
  color: #ff3b30;
  margin-top: 10px;
}

.permission-section {
  text-align: center;
  margin: 20px 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  touch-action: none;
  -webkit-touch-callout: none;
  user-select: none;
  -webkit-user-select: none;
}

.permission-alert {
  background: #fff3cd;
  color: #856404;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  text-align: left;
}

.permission-content {
  flex: 1;
}

.permission-content h4 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #664d03;
}

.permission-steps {
  margin: 10px 0;
  padding-left: 20px;
}

.permission-steps li {
  margin-bottom: 8px;
  line-height: 1.4;
}

.permission-note {
  margin-top: 10px;
  font-size: 0.9em;
  color: #664d03;
  font-style: italic;
}

.alert-icon {
  font-size: 24px;
  padding-top: 3px;
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.permission-btn {
  background: #007aff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.permission-btn::before {
  content: '';
  position: absolute;
  top: -10px;
  right: -10px;
  bottom: -10px;
  left: -10px;
  z-index: -1;
}

.permission-btn.disabled {
  background: #ccc;
  cursor: not-allowed;
  pointer-events: none;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px;
  border-radius: 12px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.control-btn:active {
  transform: scale(0.95);
  background: #e5e5e5;
}

.control-btn.recording {
  background: #ff3b30;
  color: white;
}

.control-btn.playing {
  background: #34c759;
  color: white;
}

.btn-icon {
  font-size: 24px;
  line-height: 1;
}

.btn-text {
  font-size: 14px;
  font-weight: 500;
}

/* 動畫效果 */
.recording .btn-icon {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.audio-player {
  width: 100%;
  margin-top: 20px;
}

.support-status {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.support-status h3 {
  margin-bottom: 10px;
  color: #333;
}

.support-status ul {
  list-style: none;
  padding: 0;
}

.support-status li {
  margin: 5px 0;
  color: #666;
}

/* 防止 iOS 上的點擊高亮和選擇 */
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
</style>