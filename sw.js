const CACHE_NAME = 'camp-water-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js'
];

// تثبيت وحفظ الملفات في الهاتف بشكل آمن
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('تخطي ملف تعذر كاشه مؤقتاً:', asset);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// تفعيل وتنظيف النسخ السابقة فوراً
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// الرد من الذاكرة المحلية أولاً عند انقطاع الاتصال
self.addEventListener('fetch', (event) => {
  // عدم اعتراض اتصالات Firebase الحية
  if (event.request.url.includes('firebaseio.com') || event.request.url.includes('.info/connected')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(async () => {
        // عند انقطاع النت وطلب فتح الصفحة
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('./index.html') || await caches.match('./');
          return fallback;
        }
      });
    })
  );
});
