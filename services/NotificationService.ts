import { Habit } from './HabitService';
import { Platform } from 'react-native';

// MOCK Notification Service to bypass build errors on Free Developer Account
export const NotificationService = {
    requestPermissions: async () => {
        console.log("Mock NotificationService: requestPermissions");
        return false;
    },

    scheduleReminder: async (habit: Pick<Habit, 'id' | 'name' | 'reminder_time'>) => {
        console.log("Mock NotificationService: scheduleReminder", habit);
    },

    cancelReminder: async (habitId: string) => {
        console.log("Mock NotificationService: cancelReminder", habitId);
    },

    scheduleNoteReminder: async (noteId: string, content: string, date: Date) => {
        console.log("Mock NotificationService: scheduleNoteReminder", noteId, content, date);
    }
};
