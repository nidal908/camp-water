const CACHE_NAME = 'camp-water-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js'
];

// 1. التثبيت الفوري للنسخة الجديدة
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('تخطي ملف مؤقتاً:', asset);
        }
      }
    })
  );
});

// 2. مسح كافة النسخ القديمة فوراً من ذاكرة الهاتف
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. الاستجابة الذكية: جلب الصفحة من الإنترنت أولاً لتحديثها، والاعتماد على الكاش عند انقطاع النت (Offline)
self.addEventListener('fetch', (event) => {
  // عدم اعتراض اتصالات Firebase الحية
  if (event.request.url.includes('firebaseio.com') || event.request.url.includes('.info/connected')) {
    return;
  }

  // إذا كان الطلب لفتح الصفحة الرئيسية (index.html)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // تحديث الكاش بالنسخة الجديدة فور تنزيلها
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // في حال كان الهاتف أوفلاين وبدون نت: يفتح فوراً من الذاكرة
          return caches.match('./index.html') || caches.match('./');
        })
    );
    return;
  }

  // لباقي الملفات (الأيقونة والمكتبات): قراءة من الكاش لتوفير البيانات
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
