import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export const CalendarService = {
    checkPermissions: async () => {
        const { status } = await Calendar.getCalendarPermissionsAsync();
        return status === 'granted';
    },

    requestPermissions: async () => {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        // For iOS, Reminders permission might also be needed if we were accessing Reminders
        if (status === 'granted') {
            if (Platform.OS === 'ios') {
                const remindersStatus = await Calendar.requestRemindersPermissionsAsync();
                return remindersStatus.status === 'granted';
            }
            return true;
        }
        return status === 'granted';
    },

    getEventsForToday: async () => {
        const hasPermission = await CalendarService.checkPermissions();
        if (!hasPermission) return [];

        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const calendarIds = calendars.map(c => c.id);

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const events = await Calendar.getEventsAsync(calendarIds, startOfDay, endOfDay);
        return events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
};
