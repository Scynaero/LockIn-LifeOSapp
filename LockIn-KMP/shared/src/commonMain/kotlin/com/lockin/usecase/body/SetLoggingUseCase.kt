package com.lockin.usecase.body

import com.lockin.repository.BodyRepository

class SetLoggingUseCase(private val bodyRepo: BodyRepository) {

    fun addSet(
        workoutId: String,
        exerciseId: String,
        weight: Double,
        reps: Int,
        rpe: Double? = null,
        type: String = "normal"
    ): String {
        return bodyRepo.addSet(workoutId, exerciseId, weight, reps, rpe, type)
    }

    fun updateSet(setId: String, weight: Double, reps: Int, isCompleted: Boolean) {
        bodyRepo.updateSet(setId, weight, reps, isCompleted)
    }

    fun deleteSet(setId: String) {
        bodyRepo.deleteSet(setId)
    }

    /**
     * 1RM Brzycki Formula: weight * (1 + reps / 30.0)
     */
    fun oneRepMax(weight: Double, reps: Int): Double {
        if (reps <= 0) return weight
        return weight * (1 + reps / 30.0)
    }
}
