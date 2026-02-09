export interface Activity {
    id: string;
    type: 'ride' | 'purchase' | 'recharge' | 'delivery';
    title: string;
    subtitle: string;
    timestamp: number;
    metadata?: any;
}

const STORAGE_KEY = 'mi_pana_recent_activity';
const MAX_ITEMS = 5;

export const RecentActivityCache = {
    add: (activity: Omit<Activity, 'id' | 'timestamp'>) => {
        try {
            const newActivity: Activity = {
                ...activity,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
            };

            const existing = RecentActivityCache.getAll();
            const updated = [newActivity, ...existing].slice(0, MAX_ITEMS);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to cache activity', e);
        }
    },

    getAll: (): Activity[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    },

    clear: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
