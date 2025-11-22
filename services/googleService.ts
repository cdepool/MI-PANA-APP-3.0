import axios from 'axios';

export interface GoogleEvent {
    id: string;
    summary: string;
    start: { dateTime: string; date?: string };
    end: { dateTime: string; date?: string };
}

export interface GoogleTask {
    id: string;
    title: string;
    due?: string;
    status: string;
}

const CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const TASKS_API_URL = 'https://www.googleapis.com/tasks/v1/lists/@default/tasks';

export const googleService = {
    getEvents: async (accessToken: string): Promise<GoogleEvent[]> => {
        try {
            const response = await axios.get(CALENDAR_API_URL, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    timeMin: new Date().toISOString(),
                    maxResults: 10,
                    singleEvents: true,
                    orderBy: 'startTime',
                },
            });
            return response.data.items || [];
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            throw error;
        }
    },

    getTasks: async (accessToken: string): Promise<GoogleTask[]> => {
        try {
            const response = await axios.get(TASKS_API_URL, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    showCompleted: false,
                    maxResults: 10,
                },
            });
            return response.data.items || [];
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    }
};
