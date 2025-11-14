// Service Worker para Dona Brookies PWA
const CACHE_NAME = 'dona-brookies-v2.1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Todos os recursos cacheados com sucesso');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Falha ao cachear recursos:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker ativado');
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  // Evitar cache de requisições para a API
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co') ||
      event.request.url.includes('vercel.app')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna o recurso do cache se encontrado
        if (response) {
          return response;
        }

        // Clona a requisição porque ela é um stream e só pode ser consumida uma vez
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Verifica se recebemos uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta porque ela é um stream e só pode ser consumida uma vez
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          console.log('Fetch falhou; retornando página offline:', error);
          // Se a fetch falhar e estivermos tentando carregar a página principal,
          // retorna a página principal do cache
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      }
    )
  );
});

// Mensagens do Service Worker
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});