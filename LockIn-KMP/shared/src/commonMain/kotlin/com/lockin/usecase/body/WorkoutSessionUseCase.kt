package com.lockin.usecase.body

import com.lockin.model.Workout
import com.lockin.model.WorkoutSet
import com.lockin.repository.BodyRepository
import com.lockin.util.DateUtils

class WorkoutSessionUseCase(private val bodyRepo: BodyRepository) {

    fun startWorkout(name: String? = null): String {
        return bodyRepo.startWorkout(name)
    }

    fun getActiveWorkout(): Workout? {
        return bodyRepo.getActiveWorkout()
    }

    fun finishWorkout(workoutId: String, durationSec: Int, bodyweight: Double?) {
        bodyRepo.finishWorkout(workoutId, durationSec, bodyweight)
        if (bodyweight != null) {
            bodyRepo.logWeight(bodyweight, DateUtils.getTodayDateString())
        }
    }

    fun toggleTimer(workoutId: String, shouldRun: Boolean) {
        bodyRepo.toggleWorkoutTimer(workoutId, shouldRun)
    }

    fun resetTimer(workoutId: String) {
        bodyRepo.resetWorkoutTimer(workoutId)
    }

    fun getSetsForWorkout(workoutId: String): List<WorkoutSet> {
        return bodyRepo.getSetsForWorkout(workoutId)
    }

    fun getWorkoutsForDate(date: String): List<Workout> {
        return bodyRepo.getWorkoutsForDate(date)
    }
}
