package com.lockin.usecase.habit

import com.lockin.db.LockinDatabase
import com.lockin.repository.HabitRepository

/**
 * Perfect Day Heatmap Logic (matches HabitService.ts:467-539)
 *
 * Algorithm:
 * For each date that has any activity (logs or freezes):
 * 1. Calculate denominator: how many habits were "due" on that date
 *    (created_at <= date AND not archived before that date)
 * 2. Calculate numerator: distinct habits with log OR freeze on that date
 * 3. If numerator >= denominator, it's a "Perfect Day"
 *    - Green (1): At least one log exists (mixed/completed)
 *    - Blue (2): All entries are freezes (no actual logs)
 *
 * Returns: Map<String, Int> where key=date, value=1(green) or 2(blue)
 * Only "perfect" dates appear in the map.
 */
class GetHeatmapDataUseCase(
    private val database: LockinDatabase,
    private val habitRepo: HabitRepository
) {

    fun execute(): Map<String, Int> {
        // 1. Get all habits with their timelines
        val allHabits = habitRepo.getAllHabits()
        if (allHabits.isEmpty()) return emptyMap()

        // 2. Get log counts by date
        val logCountsByDate = database.logsQueries.getLogCountsByDate().executeAsList()
        val logMap = mutableMapOf<String, Long>()
        logCountsByDate.forEach { logMap[it.date] = it.count }

        // 3. Get total activity (logs + freezes union) by date
        val totalActivityByDate = database.logsQueries.getTotalActivityByDate().executeAsList()
        val activityMap = mutableMapOf<String, Long>()
        totalActivityByDate.forEach { activityMap[it.date] = it.count }

        // 4. Collect all dates that have any activity
        val freezeCountsByDate = database.streakFreezesQueries.getFreezeCountsByDate().executeAsList()
        val allActivityDates = mutableSetOf<String>()
        logCountsByDate.forEach { allActivityDates.add(it.date) }
        freezeCountsByDate.forEach { allActivityDates.add(it.date) }

        // 5. For each date, determine if it's a perfect day
        val map = mutableMapOf<String, Int>()

        for (date in allActivityDates) {
            // Calculate how many habits were due on this date
            val dueHabits = allHabits.filter { habit ->
                val created = habit.createdAt ?: "2024-01-01" // Robust fallback
                val isActive = !habit.archived || (habit.archived && (habit.archivedAt ?: "") > date)
                date >= created && isActive
            }

            val totalDue = dueHabits.size
            if (totalDue > 0) {
                val doneCount = activityMap[date] ?: 0
                if (doneCount >= totalDue) {
                    // Perfect Day!
                    val logsCount = logMap[date] ?: 0
                    if (logsCount == 0L) {
                        map[date] = 2 // All Frozen (Blue)
                    } else {
                        map[date] = 1 // Mixed/Logged (Green)
                    }
                }
            }
        }

        return map
    }
}
