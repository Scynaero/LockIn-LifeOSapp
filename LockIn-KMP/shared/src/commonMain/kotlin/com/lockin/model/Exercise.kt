package com.lockin.model

data class Exercise(
    val id: String,
    val name: String,
    val targetMuscle: String, // "chest/pectoralis major"
    val secondaryMuscles: List<String> = emptyList(),
    val equipment: String, // barbell, dumbbell, machine, cable, bodyweight
    val isCustom: Boolean = false
)

data class Workout(
    val id: String,
    val date: String,
    val name: String? = null,
    val durationSec: Int = 0,
    val bodyweight: Double? = null,
    val status: String = "active", // "active" or "completed"
    val timerStart: String? = null,
    val isTimerRunning: Boolean = false
)

data class WorkoutSet(
    val id: String,
    val workoutId: String,
    val exerciseId: String,
    val weight: Double,
    val reps: Int,
    val rpe: Double? = null,
    val isCompleted: Boolean = false,
    val type: String = "normal", // "normal", "warmup", "drop", "failure"
    val exerciseName: String? = null // joined from exercises table
)

data class SportsLog(
    val id: String,
    val activityName: String,
    val startTime: String,
    val durationMin: Int,
    val calories: Double,
    val metValue: Double
)

data class WeightLog(
    val id: String,
    val weight: Double,
    val date: String
)

data class MuscleSplit(
    val name: String,
    val value: Double, // percentage
    val count: Int
)
