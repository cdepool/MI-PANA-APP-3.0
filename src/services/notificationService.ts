import { supabase } from './supabaseClient';

// Firebase configuration - set in environment variables
const FIREBASE_CONFIG = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

interface NotificationOptions {
    title: string;
    body: string;
    icon?: string;
    data?: Record<string, string>;
    requireInteraction?: boolean;
    tag?: string;
}

export const notificationService = {
    /**
     * Check if push notifications are supported
     */
    isSupported(): boolean {
        return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    },

    /**
     * Check current permission status
     */
    getPermissionStatus(): NotificationPermission | 'unsupported' {
        if (!this.isSupported()) return 'unsupported';
        return Notification.permission;
    },

    /**
     * Request notification permission and register for push
     */
    async requestPermission(userId: string): Promise<boolean> {
        if (!this.isSupported()) {
            console.warn('[Notifications] Not supported in this browser');
            return false;
        }

        // Check if already granted
        if (Notification.permission === 'granted') {
            await this.registerPushToken(userId);
            return true;
        }

        // Request permission
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('[Notifications] Permission granted');
            await this.registerPushToken(userId);
            return true;
        }

        console.warn('[Notifications] Permission denied');
        return false;
    },

    /**
     * Register for push notifications and save token
     */
    async registerPushToken(userId: string): Promise<string | null> {
        try {
            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(VAPID_KEY || ''),
            });

            // Extract the token (endpoint is the important part for web push)
            const token = JSON.stringify(subscription.toJSON());

            // Save to database
            await this.saveToken(userId, token);

            console.log('[Notifications] Push token registered');
            return token;
        } catch (error) {
            console.error('[Notifications] Failed to register push token:', error);

            // Fallback: use a simple browser token
            const fallbackToken = `browser_${userId}_${Date.now()}`;
            await this.saveToken(userId, fallbackToken);
            return fallbackToken;
        }
    },

    /**
     * Save FCM/push token to user profile
     */
    async saveToken(userId: string, token: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ fcm_token: token })
            .eq('id', userId);

        if (error) {
            console.error('[Notifications] Error saving push token:', error);
        }
    },

    /**
     * Remove push token (logout or disable notifications)
     */
    async removeToken(userId: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ fcm_token: null })
            .eq('id', userId);

        if (error) {
            console.error('[Notifications] Error removing push token:', error);
        }
    },

    /**
     * Update notification preferences
     */
    async updatePreferences(
        userId: string,
        preferences: { trip_updates?: boolean; promotions?: boolean; driver_nearby?: boolean }
    ): Promise<void> {
        const { data: profile } = await supabase
            .from('profiles')
            .select('notification_preferences')
            .eq('id', userId)
            .single();

        const currentPrefs = profile?.notification_preferences || {};
        const newPrefs = { ...currentPrefs, ...preferences };

        await supabase
            .from('profiles')
            .update({ notification_preferences: newPrefs })
            .eq('id', userId);
    },

    /**
     * Send a local notification (fallback when push isn't available)
     */
    sendLocalNotification(title: string, body: string, icon?: string): void {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: icon || '/logo-app.png',
                badge: '/logo-app.png',
                tag: 'mipana-notification',
                renotify: true,
            });
        }
    },

    /**
     * Show notification via service worker (works in background)
     */
    async showServiceWorkerNotification(options: NotificationOptions): Promise<void> {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(options.title, {
                body: options.body,
                icon: options.icon || '/logo-app.png',
                badge: '/logo-app.png',
                data: options.data,
                requireInteraction: options.requireInteraction || false,
                tag: options.tag || 'mipana-notification',
            });
        }
    },

    /**
     * Check if app is installed as PWA
     */
    isPWAInstalled(): boolean {
        return window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    },

    /**
     * Listen for incoming push messages in foreground
     */
    onForegroundMessage(callback: (payload: { title: string; body: string; data?: Record<string, unknown> }) => void): () => void {
        if ('serviceWorker' in navigator) {
            const handler = (event: MessageEvent) => {
                if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
                    callback(event.data.payload);
                }
            };

            navigator.serviceWorker.addEventListener('message', handler);
            return () => navigator.serviceWorker.removeEventListener('message', handler);
        }
        return () => { };
    },

    /**
     * Helper: Convert VAPID key to Uint8Array
     */
    urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },
};

export default notificationService;
