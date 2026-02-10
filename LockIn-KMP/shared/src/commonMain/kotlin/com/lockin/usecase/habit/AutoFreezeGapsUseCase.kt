package com.lockin.usecase.habit

import com.lockin.repository.HabitRepository
import com.lockin.util.DateUtils
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus
import kotlinx.datetime.plus

/**
 * Auto-fill missing days with freeze records (matches HabitService.ts:280-333)
 *
 * Algorithm:
 * 1. Get all log + freeze dates for the habit
 * 2. Find the last active date (most recent log or freeze)
 * 3. If last activity is before yesterday, fill the gap with freeze records
 * 4. Cap at 365 days for safety
 * 5. Update streak_state to "frozen" and recalculate streak
 *
 * This is called every time habits are loaded for the current day,
 * ensuring no gaps exist in the timeline.
 */
class AutoFreezeGapsUseCase(
    private val habitRepo: HabitRepository,
    private val calculateStreakUseCase: CalculateStreakUseCase
) {

    /**
     * Auto-freeze gaps for a single habit.
     * Fills any missing days between last activity and yesterday with freeze records.
     */
    fun execute(habitId: String) {
        val habit = habitRepo.getHabitById(habitId) ?: return
        val createdAt = habit.createdAt ?: return

        val yesterday = DateUtils.yesterday()
        val yesterdayStr = yesterday.toString()

        // Get all history dates
        val logDates = habitRepo.getDistinctLogDates(habitId)
        val freezeDates = habitRepo.getFreezeDates(habitId)
        val allDates = (logDates + freezeDates).sorted()

        if (allDates.isEmpty()) {
            // No history at all - use createdAt as the reference
            // Only freeze if createdAt is before yesterday
            val created = DateUtils.parseDate(createdAt) ?: return
            if (created >= yesterday) return
            fillGaps(habitId, created, yesterday, createdAt, emptySet())
            return
        }

        // Find the last activity date
        val lastActiveStr = allDates.last()
        if (lastActiveStr >= yesterdayStr) return // No gaps to fill

        val lastActive = DateUtils.parseDate(lastActiveStr) ?: return
        fillGaps(habitId, lastActive, yesterday, createdAt, logDates + freezeDates)
    }

    private fun fillGaps(
        habitId: String,
        lastActive: LocalDate,
        yesterday: LocalDate,
        createdAt: String,
        existingDates: Set<String>
    ) {
        var current = lastActive.plus(1, DateTimeUnit.DAY)
        var count = 0
        var inserted = 0

        while (current <= yesterday && count < 365) {
            val dateStr = current.toString()
            // Only insert freeze if date is after creation and not already covered
            if (dateStr > createdAt && dateStr !in existingDates) {
                habitRepo.insertFreeze(habitId, dateStr)
                inserted++
            }
            current = current.plus(1, DateTimeUnit.DAY)
            count++
        }

        if (inserted > 0) {
            habitRepo.updateStreakState(habitId, "frozen")
            calculateStreakUseCase.execute(habitId)
        }
    }

    /**
     * Auto-freeze all active habits.
     * Should be called when loading habits for the current day.
     */
    fun executeAll() {
        val habits = habitRepo.getAllHabits().filter { !it.archived }
        for (habit in habits) {
            execute(habit.id)
        }
    }
}
