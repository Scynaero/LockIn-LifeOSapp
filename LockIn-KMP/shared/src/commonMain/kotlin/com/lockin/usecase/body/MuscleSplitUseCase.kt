package com.lockin.usecase.body

import com.lockin.model.MuscleSplit
import com.lockin.repository.BodyRepository
import com.lockin.util.DateUtils
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.minus

class MuscleSplitUseCase(private val bodyRepo: BodyRepository) {

    /**
     * Get muscle split data for the last N days.
     * Returns a list of MuscleSplit with name, percentage, and set count.
     */
    fun getMuscleSplit(days: Int = 30): List<MuscleSplit> {
        val startDate = DateUtils.today().minus(days, DateTimeUnit.DAY).toString()
        val raw = bodyRepo.getMuscleSplitForRange(startDate)
        val total = raw.sumOf { it.second }
        if (total == 0L) return emptyList()

        return raw.map { (muscle, count) ->
            val displayName = muscle.substringAfter("/").replaceFirstChar { it.uppercase() }
            MuscleSplit(
                name = displayName,
                value = (count.toDouble() / total * 100),
                count = count.toInt()
            )
        }.sortedByDescending { it.count }
    }

    /**
     * Get muscles worked on a specific date (primary + secondary).
     */
    fun getMusclesForDate(date: String): List<String> {
        val primary = bodyRepo.getMusclesForDate(date)
        val secondary = bodyRepo.getSecondaryMusclesForDate(date)
        return (primary + secondary).distinct()
    }

    /**
     * Get total volume (weight * reps) for the given period.
     */
    fun getVolumeForRange(days: Int = 7): Double {
        val startDate = DateUtils.today().minus(days, DateTimeUnit.DAY).toString()
        return bodyRepo.getVolumeForRange(startDate)
    }

    /**
     * Get daily volume history for chart display.
     */
    fun getVolumeHistory(days: Int = 30): List<Pair<String, Double>> {
        val startDate = DateUtils.today().minus(days, DateTimeUnit.DAY).toString()
        return bodyRepo.getVolumeHistory(startDate)
    }
}
