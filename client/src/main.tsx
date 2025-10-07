import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// DEVELOPMENT: Clear all service worker caches on startup
if (!import.meta.env.PROD && 'serviceWorker' in navigator) {
  (async () => {
    try {
      // Unregister all existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🧹 Development: Unregistered service worker');
      }
      
      // Delete all caches starting with 'morouna-'
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        if (cacheName.startsWith('morouna-')) {
          await caches.delete(cacheName);
          console.log(`🧹 Development: Deleted cache ${cacheName}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not clear service worker caches:', error);
    }
  })();
}

createRoot(document.getElementById("root")!).render(<App />);

// PRODUCTION ONLY: Register Service Worker for PWA support
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Add version query parameter to force browser to fetch new SW
    const swUrl = `/sw.js?v=${Date.now()}`;
    
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New version available! Refresh to update.');
                // Optionally show a toast notification to the user
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
  
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_CLEARED') {
      console.log('✅ Cache cleared successfully');
    }
  });
}
