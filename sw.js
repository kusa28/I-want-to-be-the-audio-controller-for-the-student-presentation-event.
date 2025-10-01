const CACHE_NAME = 'sound-controller-cache-v1';
const AUDIO_CACHE_NAME = 'sound-controller-audio-v1';

// アプリケーションの基本ファイル（初回インストール時にキャッシュ）
const urlsToCache = [
  './',
  './index.html'
];

// インストールイベント
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 有効化イベント（古いキャッシュの削除）
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, AUDIO_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// フェッチイベント（ネットワークリクエストの仲介）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュに存在すれば、それを返す
        if (response) {
          return response;
        }

        // キャッシュになければ、ネットワークにリクエストしに行く
        return fetch(event.request).then(
          (response) => {
            // 不正なレスポンスはキャッシュしない
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンして、片方をキャッシュに保存
            const responseToCache = response.clone();
            
            // 音声ファイルは専用のキャッシュに保存
            if (event.request.url.includes('/audio/')) {
                 caches.open(AUDIO_CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
            }
            
            return response;
          }
        );
      })
  );
});