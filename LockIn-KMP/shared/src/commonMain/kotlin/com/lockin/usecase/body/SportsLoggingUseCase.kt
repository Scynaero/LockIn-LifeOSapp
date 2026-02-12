package com.lockin.usecase.body

import com.lockin.model.SportsLog
import com.lockin.repository.BodyRepository

class SportsLoggingUseCase(private val bodyRepo: BodyRepository) {

    /**
     * Log a sports/cardio activity with MET-based calorie calculation.
     */
    fun logSport(
        activityName: String,
        durationMin: Int,
        metValue: Double,
        date: String? = null
    ): String {
        val weightKg = bodyRepo.getLatestWeight()
        val calories = calculateCalories(metValue, weightKg, durationMin)
        return bodyRepo.logSport(activityName, durationMin, calories, metValue, date)
    }

    fun getSportsLogs(date: String? = null): List<SportsLog> {
        return bodyRepo.getSportsLogs(date)
    }

    fun deleteSportsLog(id: String) {
        bodyRepo.deleteSportsLog(id)
    }

    /**
     * MET Calorie Formula: (met * 3.5 * weight_kg) / 200.0 * duration_min
     */
    fun calculateCalories(met: Double, weightKg: Double, durationMin: Int): Double {
        return (met * 3.5 * weightKg) / 200.0 * durationMin
    }

    companion object {
        val COMMON_SPORTS = mapOf(
            "Walking" to 3.0,
            "Running" to 9.8,
            "Cycling" to 5.8,
            "Swimming" to 8.0,
            "HIIT" to 12.0,
            "Yoga" to 3.0,
            "Basketball" to 6.5,
            "Soccer" to 7.0,
            "Tennis" to 7.3,
            "Jump Rope" to 12.3
        )
    }
}
