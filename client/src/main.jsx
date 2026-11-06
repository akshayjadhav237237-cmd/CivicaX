import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Register Service Worker for PWA and Mountain Valley Offline Resilience
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[CivicaX PWA] Service worker registered successfully. Scope:', registration.scope);

        // Check for service worker updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[CivicaX PWA] New emergency assets ready. Stale-while-revalidate operational.');
                } else {
                  console.log('[CivicaX PWA] Critical offline emergency shell cached.');
                }
              }
            });
          }
        });

        // Periodic background update check (every 30 minutes when online)
        setInterval(() => {
          if (navigator.onLine) {
            registration.update().catch((err) => {
              console.warn('[CivicaX PWA] Periodic update check bypassed:', err.message);
            });
          }
        }, 30 * 60 * 1000);
      })
      .catch((error) => {
        console.warn('[CivicaX PWA] Service worker registration failed or bypassed:', error);
      });

    // Handle seamless controller updates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[CivicaX PWA] Controller activated. Live offline cache updated.');
      }
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
