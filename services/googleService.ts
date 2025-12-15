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

    createCalendarEvent: async (
        accessToken: string,
        event: {
            summary: string;
            description?: string;
            location?: string;
            start: string; // ISO datetime
            end: string; // ISO datetime
        }
    ): Promise<GoogleEvent> => {
        try {
            const response = await axios.post(
                CALENDAR_API_URL,
                {
                    summary: event.summary,
                    description: event.description,
                    location: event.location,
                    start: { dateTime: event.start, timeZone: 'America/Caracas' },
                    end: { dateTime: event.end, timeZone: 'America/Caracas' },
                    reminders: {
                        useDefault: false,
                        overrides: [
                            { method: 'popup', minutes: 30 },
                            { method: 'popup', minutes: 10 }
                        ]
                    }
                },
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error creating calendar event:', error);
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
    },

    createTask: async (
        accessToken: string,
        task: {
            title: string;
            notes?: string;
            due?: string; // ISO date
        }
    ): Promise<GoogleTask> => {
        try {
            const response = await axios.post(
                TASKS_API_URL,
                {
                    title: task.title,
                    notes: task.notes,
                    due: task.due
                },
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    deleteTask: async (accessToken: string, taskId: string): Promise<void> => {
        try {
            await axios.delete(`${TASKS_API_URL}/${taskId}`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }
};
