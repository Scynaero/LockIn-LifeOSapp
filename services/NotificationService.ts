import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from './HabitService';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const NotificationService = {
    requestPermissions: async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        return finalStatus === 'granted';
    },

    scheduleReminder: async (habit: Pick<Habit, 'id' | 'name' | 'reminder_time'>) => {
        if (!habit.reminder_time) return;

        // Cancel any existing notifs for this habit to avoid duplicates
        await NotificationService.cancelReminder(habit.id);

        const timeDate = new Date(habit.reminder_time);
        const hour = timeDate.getHours();
        const minute = timeDate.getMinutes();

        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: "It's time to Lock In",
                body: `Time for your protocol: ${habit.name}`,
                sound: true,
                data: { url: `/habit/${habit.id}` }
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour,
                minute,
                repeats: true,
            },
        });

        // Save identifier logic if needed, skipping for MVP
        // In a real app, we'd store this identifier in the DB alongside the habit
        // or use a consistent ID generation strategy.
        console.log(`Scheduled notification for ${habit.name} at ${hour}:${minute} (ID: ${identifier})`);
    },

    cancelReminder: async (habitId: string) => {
        // Current limitation: we don't track notification IDs in DB yet.
        await Notifications.cancelAllScheduledNotificationsAsync();
    },

    scheduleNoteReminder: async (noteId: string, content: string, date: Date) => {
        const trigger = date;
        // Schedule for the specific date
        // Note: trigger must be in the future
        if (trigger.getTime() <= Date.now()) return;

        await Notifications.scheduleNotificationAsync({
            identifier: `note-${noteId}`,
            content: {
                title: "Note Reminder",
                body: content,
                sound: true,
                data: { url: `/note/${noteId}` }
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: trigger, // Pass the Date object here
            },
        });
        console.log(`Scheduled note reminder for ${noteId} at ${date.toISOString()}`);
    }
};
