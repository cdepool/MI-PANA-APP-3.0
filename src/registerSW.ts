// Service Worker Registration for MI PANA APP PWA
// Version 3.0.0

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export async function registerServiceWorker(config?: ServiceWorkerConfig): Promise<void> {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Workers are not supported in this browser');
    return;
  }

  // Wait for page load
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA] Service Worker registered successfully:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New content is available; please refresh.');
            
            if (config?.onUpdate) {
              config.onUpdate(registration);
            } else {
              // Show default update notification
              showUpdateNotification();
            }
          }
        });
      });

      // Success callback
      if (config?.onSuccess) {
        config.onSuccess(registration);
      }

      // Setup periodic sync for background updates
      if ('periodicSync' in registration) {
        try {
          await (registration as any).periodicSync.register('sync-ride-requests', {
            minInterval: 60 * 60 * 1000 // 1 hour
          });
          console.log('[PWA] Periodic background sync registered');
        } catch (error) {
          console.warn('[PWA] Periodic background sync registration failed:', error);
        }
      }

    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  });

  // Handle online/offline events
  window.addEventListener('online', () => {
    console.log('[PWA] Connection restored');
    if (config?.onOnline) {
      config.onOnline();
    }
  });

  window.addEventListener('offline', () => {
    console.log('[PWA] Connection lost');
    if (config?.onOffline) {
      config.onOffline();
    }
  });
}

export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
    console.log('[PWA] Service Worker unregistered');
  } catch (error) {
    console.error('[PWA] Service Worker unregistration failed:', error);
  }
}

export async function checkForUpdates(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('[PWA] Checked for updates');
  } catch (error) {
    console.error('[PWA] Update check failed:', error);
  }
}

function showUpdateNotification(): void {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #003366;
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: 90%;
    animation: slideUp 0.3s ease-out;
  `;

  notification.innerHTML = `
    <span style="flex: 1;">Nueva versión disponible</span>
    <button 
      onclick="window.location.reload()" 
      style="
        background: white;
        color: #003366;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      "
    >
      Actualizar
    </button>
    <button 
      onclick="this.parentElement.remove()" 
      style="
        background: transparent;
        color: white;
        border: none;
        padding: 8px;
        cursor: pointer;
        font-size: 20px;
      "
    >
      ×
    </button>
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    notification.remove();
  }, 10000);
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[PWA] Notifications are not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

// Show notification
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    console.warn('[PWA] Notification permission denied');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    // Fallback to regular notification
    new Notification(title, options);
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      vibrate: [200, 100, 200],
      ...options
    });
  } catch (error) {
    console.error('[PWA] Failed to show notification:', error);
  }
}

// Install prompt
let deferredPrompt: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('[PWA] Install prompt available');
});

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('[PWA] Install prompt not available');
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log('[PWA] Install prompt outcome:', outcome);
  deferredPrompt = null;

  return outcome === 'accepted';
}

export function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

// Export all functions
export default {
  registerServiceWorker,
  unregisterServiceWorker,
  checkForUpdates,
  requestNotificationPermission,
  showNotification,
  promptInstall,
  isInstalled
};
