// 緩存名稱
const CACHE_NAME = 'ios-pwa-cache-v1';
const AUDIO_CACHE_NAME = 'ios-pwa-audio-cache-v1';

// 需要緩存的資源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/share-icon.svg',
  '/src/main.js',
  '/src/App.vue',
  '/src/components/AudioRecorder.vue',
  '/manifest.json',
  '/favicon.ico'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  // 檢查是否為音頻相關請求
  if (event.request.url.includes('/audio/') || 
      event.request.headers.get('Content-Type')?.includes('audio/')) {
    event.respondWith(handleAudioRequest(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果在緩存中找到響應，則返回緩存的響應
        if (response) {
          return response;
        }

        // 否則嘗試從網絡獲取
        return fetch(event.request)
          .then((response) => {
            // 檢查是否得到了有效的響應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆響應，因為響應流只能使用一次
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // 只緩存 GET 請求
                if (event.request.method === 'GET') {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(() => {
            // 如果請求失敗，返回離線頁面
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('離線狀態無法訪問此資源', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 處理音頻請求
async function handleAudioRequest(request) {
  // 先檢查音頻緩存
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    
    // 檢查響應是否有效
    if (!response || response.status !== 200) {
      return response;
    }

    // 緩存音頻文件
    const cache = await caches.open(AUDIO_CACHE_NAME);
    await cache.put(request, response.clone());
    
    return response;
  } catch (error) {
    console.error('音頻請求失敗:', error);
    return new Response('無法加載音頻文件', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// 清理舊緩存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 處理推送通知
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/share-icon.svg',
      badge: '/favicon.ico'
    };

    event.waitUntil(
      self.registration.showNotification('音頻錄製', options)
    );
  }
});
