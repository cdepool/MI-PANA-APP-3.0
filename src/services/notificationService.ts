import { supabase } from './supabaseClient';

export const notificationService = {
    /**
     * Request permission for notifications and store token.
     */
    async requestPermission(userId: string) {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // In a real FCM scenario, we would get the token here.
            // For this implementation, we will use a browser-native fallback 
            // where the app broadcasts messages via a SharedWorker or simply 
            // triggered via Supabase real-time events.

            console.log('Notification permission granted');
            await this.saveToken(userId, 'browser-native-demo');
        }
    },

    async saveToken(userId: string, token: string) {
        const { error } = await supabase
            .from('profiles')
            .update({ push_token: token })
            .eq('id', userId);

        if (error) console.error('Error saving push token:', error);
    },

    /**
     * Send a local notification (fallback for non-FCM)
     */
    sendLocalNotification(title: string, body: string, icon?: string) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: icon || '/logo-app.png'
            });
        }
    }
};
