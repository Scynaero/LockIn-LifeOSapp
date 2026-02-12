package com.lockin.usecase.habit

import com.lockin.repository.HabitRepository

/**
 * Toggle habit completion for a date (matches HabitService.ts:183-232)
 *
 * Algorithm:
 * - Boolean habits (targetValue == 1):
 *   - If log exists: DELETE it, deduct 10 XP (toggle OFF)
 *   - If no log: INSERT log with value=goal, add 10 XP (toggle ON)
 *
 * - Quantitative habits (targetValue > 1):
 *   - If log exists: DELETE it, deduct 10 XP (toggle OFF)
 *   - If no log: INSERT with provided value (or full goal), add 10 XP (toggle ON)
 *
 * After toggle:
 * - Remove freeze for this date if a log was added (freeze is no longer needed)
 * - Recalculate streak
 */
class LogCompletionUseCase(
    private val habitRepo: HabitRepository,
    private val calculateStreakUseCase: CalculateStreakUseCase,
    private val xpLevelingUseCase: XpLevelingUseCase
) {

    /**
     * Toggle a habit completion for the given date.
     *
     * @param habitId The habit to toggle
     * @param date The date string (YYYY-MM-DD)
     * @param value The value to log (defaults to habit's goal for simple toggle)
     * @param note Optional note for the log
     * @return true if the habit is now completed (log was added), false if it was toggled off
     */
    fun execute(
        habitId: String,
        date: String,
        value: Double? = null,
        note: String? = null
    ): Boolean {
        val habit = habitRepo.getHabitById(habitId) ?: return false
        val existingLog = habitRepo.getLogForDate(habitId, date)

        return if (existingLog != null) {
            // Toggle OFF: Remove the log
            habitRepo.deleteLogByDate(habitId, date)
            xpLevelingUseCase.addXp(-10)
            calculateStreakUseCase.execute(habitId)
            false
        } else {
            // Toggle ON: Create the log
            val logValue = value ?: habit.goal
            habitRepo.insertLog(habitId, date, logValue, note)

            // Auto-remove any freeze record for this date (it's now completed)
            habitRepo.deleteFreezeByDate(habitId, date)

            xpLevelingUseCase.addXp(10)
            calculateStreakUseCase.execute(habitId)
            true
        }
    }

    /**
     * Log a specific value for a quantitative habit.
     * Unlike execute(), this always creates/replaces the log (no toggle-off).
     *
     * @param habitId The habit to log for
     * @param date The date string
     * @param value The specific value to log
     * @param note Optional note
     */
    fun logValue(
        habitId: String,
        date: String,
        value: Double,
        note: String? = null
    ) {
        val existingLog = habitRepo.getLogForDate(habitId, date)

        if (existingLog != null) {
            // Replace existing log: delete and re-insert
            habitRepo.deleteLogByDate(habitId, date)
        } else {
            // New log, award XP
            xpLevelingUseCase.addXp(10)
        }

        habitRepo.insertLog(habitId, date, value, note)

        // Auto-remove any freeze record for this date
        habitRepo.deleteFreezeByDate(habitId, date)

        calculateStreakUseCase.execute(habitId)
    }

    /**
     * Freeze a date for a habit (toggle freeze on/off).
     * If a log exists, it will be removed (freeze replaces log).
     * If a freeze already exists, it will be removed (toggle off).
     */
    fun freezeDate(habitId: String, date: String) {
        // Remove any existing log
        val existingLog = habitRepo.getLogForDate(habitId, date)
        if (existingLog != null) {
            habitRepo.deleteLogByDate(habitId, date)
        }

        // Toggle freeze
        val existingFreeze = habitRepo.getFreezeForDate(habitId, date)
        if (existingFreeze != null) {
            // Toggle off
            habitRepo.deleteFreezeByDate(habitId, date)
        } else {
            // Toggle on
            habitRepo.insertFreeze(habitId, date)
        }

        calculateStreakUseCase.execute(habitId)
    }
}
