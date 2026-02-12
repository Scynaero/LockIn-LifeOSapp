package com.lockin.platform

/**
 * Schedules and cancels local notifications for habit reminders.
 */
expect class NotificationScheduler {
    /**
     * Schedule a daily notification at the given hour and minute.
     * @param id Unique ID for this notification
     * @param title Notification title
     * @param body Notification body text
     * @param hour Hour of day (0-23)
     * @param minute Minute of hour (0-59)
     */
    fun scheduleDailyReminder(
        id: String,
        title: String,
        body: String,
        hour: Int,
        minute: Int
    )

    /**
     * Cancel a previously scheduled notification.
     */
    fun cancel(id: String)

    /**
     * Cancel all scheduled notifications.
     */
    fun cancelAll()
}
