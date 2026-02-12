package com.lockin.platform

actual class NotificationScheduler {
    actual fun scheduleDailyReminder(
        id: String,
        title: String,
        body: String,
        hour: Int,
        minute: Int
    ) {
        // iOS: Use UNUserNotificationCenter
        // TODO: Implement with UNCalendarNotificationTrigger
    }

    actual fun cancel(id: String) {
        // TODO: UNUserNotificationCenter.removePendingNotificationRequests
    }

    actual fun cancelAll() {
        // TODO: UNUserNotificationCenter.removeAllPendingNotificationRequests
    }
}
