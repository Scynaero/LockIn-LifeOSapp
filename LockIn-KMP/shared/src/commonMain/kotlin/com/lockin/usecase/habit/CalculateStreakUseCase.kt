package com.lockin.usecase.habit

import com.lockin.repository.HabitRepository
import com.lockin.util.DateUtils
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.minus

/**
 * Strict Streak Calculation (matches HabitService.ts:361-416)
 *
 * Algorithm:
 * 1. Merge log dates + freeze dates into validDates set
 * 2. Start from today (or yesterday if today has no entry)
 * 3. Walk backward: logs increment streak, freezes maintain continuity but don't increment
 * 4. Break on first gap (date not in validDates)
 *
 * Also supports recalculating all active habit streaks on startup.
 */
class CalculateStreakUseCase(private val habitRepo: HabitRepository) {

    /**
     * Calculate and persist the current streak for a single habit.
     * Returns the computed streak count.
     */
    fun execute(habitId: String): Int {
        val logDates = habitRepo.getDistinctLogDates(habitId)
        val freezeDates = habitRepo.getFreezeDates(habitId)
        val validDates = logDates + freezeDates

        if (validDates.isEmpty()) {
            habitRepo.updateStreak(habitId, 0)
            return 0
        }

        val today = DateUtils.today()
        val yesterday = DateUtils.yesterday()
        val todayStr = today.toString()
        val yesterdayStr = yesterday.toString()

        // Determine starting point
        val sortedDesc = validDates.sortedDescending()
        val lastDate = sortedDesc.first()

        var currentDate = when (lastDate) {
            todayStr -> today
            yesterdayStr -> yesterday
            else -> {
                // Streak is broken - no activity today or yesterday
                habitRepo.updateStreak(habitId, 0)
                return 0
            }
        }

        // Walk backward counting only log days (freezes maintain continuity)
        var streak = 0
        while (currentDate.toString() in validDates) {
            val dateStr = currentDate.toString()
            if (dateStr in logDates) {
                streak++
            }
            // Freeze dates maintain continuity but don't increment
            currentDate = currentDate.minus(1, DateTimeUnit.DAY)
        }

        habitRepo.updateStreak(habitId, streak)
        return streak
    }

    /**
     * Read-only streak calculation for a specific reference date.
     * Does NOT write to DB. Used for historical streak display.
     */
    fun calculateForDate(habitId: String, referenceDate: String): Int {
        val logDates = habitRepo.getDistinctLogDates(habitId)
        val freezeDates = habitRepo.getFreezeDates(habitId)
        val validDates = logDates + freezeDates

        if (validDates.isEmpty()) return 0

        val refDate = DateUtils.parseDate(referenceDate) ?: return 0
        val refYesterday = refDate.minus(1, DateTimeUnit.DAY)

        val sortedDesc = validDates.sortedDescending()
        val lastDate = sortedDesc.first()

        var currentDate = when (lastDate) {
            referenceDate -> refDate
            refYesterday.toString() -> refYesterday
            else -> return 0
        }

        var streak = 0
        while (currentDate.toString() in validDates) {
            if (currentDate.toString() in logDates) {
                streak++
            }
            currentDate = currentDate.minus(1, DateTimeUnit.DAY)
        }
        return streak
    }

    /**
     * Recalculate ALL active habit streaks.
     * Should be called on app startup to fix any stale data.
     */
    fun recalculateAll() {
        val habits = habitRepo.getAllHabits().filter { !it.archived }
        for (habit in habits) {
            execute(habit.id)
        }
    }
}
