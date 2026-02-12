package com.lockin.usecase.habit

import com.lockin.db.LockinDatabase
import com.lockin.model.HabitBreakdown
import com.lockin.model.HabitStats
import com.lockin.repository.HabitRepository
import com.lockin.util.DateUtils
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.minus
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Get habit completion stats for a date (matches HabitService.ts:589-683)
 *
 * Returns:
 * - completionRate: percentage of habits completed (including frozen) for the date
 * - breakdown: count of build/quit/frozen/total habits
 * - currentStreak: global "perfect day" streak from heatmap data
 */
class GetHabitStatsUseCase(
    private val database: LockinDatabase,
    private val habitRepo: HabitRepository,
    private val getHeatmapDataUseCase: GetHeatmapDataUseCase
) {

    fun execute(date: String? = null): HabitStats {
        val targetDate = date ?: DateUtils.getTodayDateString()

        // 1. Get habits that were due on this date
        val habitsForDate = database.habitsQueries.getHabitsForDate(targetDate, targetDate)
            .executeAsList()

        val totalHabits = habitsForDate.size
        if (totalHabits == 0) return HabitStats()

        val validHabitIds = habitsForDate.map { it.id }.toSet()

        // 2. Get logs for this date
        val logsForDate = database.logsQueries.getLogsForDate(targetDate).executeAsList()

        var buildCount = 0
        var quitCount = 0
        val loggedIds = mutableSetOf<String>()

        logsForDate.forEach { log ->
            if (log.habit_id in validHabitIds) {
                loggedIds.add(log.habit_id)
                if (log.type == "build") buildCount++ else quitCount++
            }
        }

        // 3. Get freezes for this date (only count if not already logged)
        val freezesForDate = database.streakFreezesQueries.getFreezesForDate(targetDate)
            .executeAsList()

        var frozenCount = 0
        freezesForDate.forEach { freeze ->
            if (freeze.habit_id in validHabitIds && freeze.habit_id !in loggedIds) {
                frozenCount++
            }
        }

        // 4. Calculate completion rate
        val totalDone = buildCount + quitCount + frozenCount
        val effectiveDone = min(totalDone, totalHabits)
        val rate = ((effectiveDone.toDouble() / totalHabits) * 100).roundToInt()

        // 5. Calculate global streak from heatmap
        val globalStreak = calculateGlobalStreak(targetDate)

        return HabitStats(
            currentStreak = globalStreak,
            completionRate = rate.toDouble(),
            breakdown = HabitBreakdown(
                build = buildCount,
                quit = quitCount,
                frozen = frozenCount,
                total = totalHabits
            )
        )
    }

    /**
     * Calculate the global "perfect day" streak.
     * Uses heatmap data to walk backward from the target date.
     */
    private fun calculateGlobalStreak(targetDate: String): Int {
        val heatmap = getHeatmapDataUseCase.execute()
        if (heatmap.isEmpty()) return 0

        val startDate = DateUtils.parseDate(targetDate) ?: return 0
        var streak = 0

        // Check today
        if ((heatmap[targetDate] ?: 0) > 0) {
            streak = 1
            var checkDate = startDate.minus(1, DateTimeUnit.DAY)

            // Walk backward
            for (i in 0 until 365) {
                val dateStr = checkDate.toString()
                if ((heatmap[dateStr] ?: 0) > 0) {
                    streak++
                    checkDate = checkDate.minus(1, DateTimeUnit.DAY)
                } else {
                    break
                }
            }
        } else {
            // Check yesterday
            val yesterday = startDate.minus(1, DateTimeUnit.DAY)
            val yesterdayStr = yesterday.toString()
            if ((heatmap[yesterdayStr] ?: 0) <= 0) {
                return 0
            }

            // Start from yesterday
            var checkDate = yesterday
            for (i in 0 until 365) {
                val dateStr = checkDate.toString()
                if ((heatmap[dateStr] ?: 0) > 0) {
                    streak++
                    checkDate = checkDate.minus(1, DateTimeUnit.DAY)
                } else {
                    break
                }
            }
        }

        return streak
    }
}
