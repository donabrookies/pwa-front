const CACHE_NAME = 'dona-brookies-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('Todos os recursos cacheados com sucesso');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.log('Falha ao fazer cache dos recursos:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker ativando...');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker ativado');
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', function(event) {
  // Não cachear requisições para a API
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - retorna resposta do cache
        if (response) {
          return response;
        }
        
        // Clona a requisição porque ela é um stream e só pode ser consumida uma vez
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(
          function(response) {
            // Verifica se recebemos uma resposta válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona a resposta porque ela é um stream e só pode ser consumida uma vez
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(function(cache) {
                // Não cachear requisições para APIs externas
                if (!event.request.url.includes('cdn.tailwindcss.com') && 
                    !event.request.url.includes('cdnjs.cloudflare.com') &&
                    !event.request.url.includes('fonts.googleapis.com') &&
                    !event.request.url.includes('cdn.jsdelivr.net')) {
                  cache.put(event.request, responseToCache);
                }
              });
            
            return response;
          }
        ).catch(function() {
          // Fallback para página offline
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
    );
});

// Mensagens do Service Worker
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});