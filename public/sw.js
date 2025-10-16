// Service Worker for Offline-First Architecture
const CACHE_NAME = 'hisaabdost-v4';
const APP_SHELL_CACHE = 'app-shell-v4';
const DATA_CACHE = 'data-cache-v4';

// App shell resources - these should load instantly
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Runtime caching for routes
const ROUTES_TO_CACHE = [
  '/app',
  '/app/dashboard',
  '/app/budget',
  '/app/expenses',
  '/app/wallet',
  '/app/goals',
  '/app/insights'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(APP_SHELL_FILES);
      })
      .then(() => {
        console.log('Service Worker: App shell cached');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== APP_SHELL_CACHE && cacheName !== DATA_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for non-GET requests (HEAD, POST, etc.)
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Skip caching for dynamically loaded asset chunks to avoid stale references
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Handle navigation requests (app shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then((response) => {
          if (response) {
            console.log('Service Worker: Serving app shell from cache');
            return response;
          }
          return fetch(request);
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Handle API requests (data)
  if (url.hostname.includes('supabase') || url.pathname.includes('/api/')) {
    event.respondWith(
      networkFirstWithCache(request)
    );
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      cacheFirstWithNetwork(request)
    );
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(
    networkFirstWithCache(request)
  );
});

// Network first strategy for data
async function networkFirstWithCache(request) {
  // Only cache GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }

  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses with error handling
    if (networkResponse.status === 200) {
      try {
        const cache = await caches.open(DATA_CACHE);
        await cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.log('Service Worker: Cache put failed:', cacheError);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for API requests
    if (request.url.includes('supabase')) {
      return new Response(JSON.stringify({ 
        offline: true, 
        data: [], 
        error: 'Offline - cached data not available' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Cache first strategy for static assets
async function cacheFirstWithNetwork(request) {
  // Only cache GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }

  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.status === 200) {
        const cache = caches.open(APP_SHELL_CACHE);
        cache.then(c => {
          c.put(request, response).catch(() => {});
        });
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.status === 200) {
    try {
      const cache = await caches.open(APP_SHELL_CACHE);
      await cache.put(request, networkResponse.clone());
    } catch (cacheError) {
      console.log('Service Worker: Cache put failed:', cacheError);
    }
  }
  
  return networkResponse;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-expenses') {
    event.waitUntil(syncExpenses());
  } else if (event.tag === 'sync-budgets') {
    event.waitUntil(syncBudgets());
  }
});

// Sync functions
async function syncExpenses() {
  console.log('Service Worker: Syncing expenses...');
  // This would integrate with your existing sync service
  try {
    const response = await fetch('/api/sync/expenses', { method: 'POST' });
    if (response.ok) {
      // Notify app that sync completed
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'EXPENSES_SYNCED' });
        });
      });
    }
  } catch (error) {
    console.error('Service Worker: Expense sync failed:', error);
  }
}

async function syncBudgets() {
  console.log('Service Worker: Syncing budgets...');
  try {
    const response = await fetch('/api/sync/budgets', { method: 'POST' });
    if (response.ok) {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'BUDGETS_SYNCED' });
        });
      });
    }
  } catch (error) {
    console.error('Service Worker: Budget sync failed:', error);
  }
}

// Push notifications for background updates
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Your financial data has been updated',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'data-update',
      data: data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'HisaabDost', options)
    );
  }
});