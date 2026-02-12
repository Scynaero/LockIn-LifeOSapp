package com.lockin.repository

import com.lockin.db.LockinDatabase
import com.lockin.model.*
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn
import kotlinx.serialization.json.Json
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@OptIn(ExperimentalUuidApi::class)
class BodyRepository(private val database: LockinDatabase) {

    private val json = Json { ignoreUnknownKeys = true }

    // --- Exercises ---

    fun getAllExercises(): List<Exercise> {
        return database.exercisesQueries.getAllExercises().executeAsList().map { e ->
            Exercise(
                id = e.id,
                name = e.name,
                targetMuscle = e.target_muscle,
                secondaryMuscles = parseSecondaryMuscles(e.secondary_muscles),
                equipment = e.equipment,
                isCustom = e.is_custom != 0L
            )
        }
    }

    fun getExerciseById(id: String): Exercise? {
        val e = database.exercisesQueries.getExerciseById(id).executeAsOneOrNull() ?: return null
        return Exercise(
            id = e.id,
            name = e.name,
            targetMuscle = e.target_muscle,
            secondaryMuscles = parseSecondaryMuscles(e.secondary_muscles),
            equipment = e.equipment,
            isCustom = e.is_custom != 0L
        )
    }

    fun searchExercises(query: String): List<Exercise> {
        val pattern = "%$query%"
        return database.exercisesQueries.searchExercises(pattern, pattern).executeAsList().map { e ->
            Exercise(
                id = e.id,
                name = e.name,
                targetMuscle = e.target_muscle,
                secondaryMuscles = parseSecondaryMuscles(e.secondary_muscles),
                equipment = e.equipment,
                isCustom = e.is_custom != 0L
            )
        }
    }

    fun createCustomExercise(name: String, targetMuscle: String, equipment: String, secondaryMuscles: List<String>): String {
        val id = "custom_${Uuid.random()}"
        val secondaryJson = Json.encodeToString(
            kotlinx.serialization.builtins.ListSerializer(kotlinx.serialization.builtins.serializer<String>()),
            secondaryMuscles
        )
        database.exercisesQueries.insertExercise(
            id = id,
            name = name,
            target_muscle = targetMuscle,
            secondary_muscles = secondaryJson,
            equipment = equipment,
            is_custom = 1
        )
        return id
    }

    // --- Workouts ---

    fun startWorkout(name: String?, date: String?): String {
        val id = Uuid.random().toString()
        val workoutDate = date ?: Clock.System.now().toString()
        database.workoutsQueries.insertWorkout(
            id = id,
            date = workoutDate,
            name = name ?: "Workout",
            duration_sec = 0,
            bodyweight = null,
            status = "active",
            timer_start = null,
            is_timer_running = 0
        )
        return id
    }

    fun getActiveWorkout(): Workout? {
        val w = database.workoutsQueries.getActiveWorkout().executeAsOneOrNull() ?: return null
        return mapWorkout(w)
    }

    fun getWorkoutsForDate(dateStr: String): List<Workout> {
        return database.workoutsQueries.getWorkoutsForDate("$dateStr%").executeAsList().map { mapWorkout(it) }
    }

    fun getAllWorkouts(): List<Workout> {
        return database.workoutsQueries.getAllWorkouts().executeAsList().map { mapWorkout(it) }
    }

    fun getWorkoutsForRange(startDate: String): List<Workout> {
        return database.workoutsQueries.getWorkoutsForRange(startDate).executeAsList().map { mapWorkout(it) }
    }

    fun finishWorkout(id: String, durationSec: Int, bodyweight: Double?) {
        database.workoutsQueries.finishWorkout(
            duration_sec = durationSec.toLong(),
            bodyweight = bodyweight,
            id = id
        )
    }

    fun toggleWorkoutTimer(id: String, shouldRun: Boolean) {
        val timerStart = if (shouldRun) Clock.System.now().toString() else null
        database.workoutsQueries.toggleTimer(
            timer_start = timerStart,
            is_timer_running = if (shouldRun) 1 else 0,
            id = id
        )
    }

    fun resetWorkoutTimer(id: String) {
        database.workoutsQueries.resetTimer(id)
    }

    // --- Sets ---

    fun addSet(workoutId: String, exerciseId: String, weight: Double, reps: Int, rpe: Double?, type: String): String {
        val id = Uuid.random().toString()
        database.workoutSetsQueries.insertSet(
            id = id,
            workout_id = workoutId,
            exercise_id = exerciseId,
            weight = weight,
            reps = reps.toLong(),
            rpe = rpe,
            is_completed = 0,
            type = type
        )
        return id
    }

    fun getSetsForWorkout(workoutId: String): List<WorkoutSet> {
        return database.workoutSetsQueries.getSetsForWorkout(workoutId).executeAsList().map { s ->
            WorkoutSet(
                id = s.id,
                workoutId = s.workout_id,
                exerciseId = s.exercise_id,
                weight = s.weight,
                reps = s.reps.toInt(),
                rpe = s.rpe,
                isCompleted = s.is_completed != 0L,
                type = s.type,
                exerciseName = s.exercise_name
            )
        }
    }

    fun updateSet(setId: String, weight: Double, reps: Int, isCompleted: Boolean) {
        database.workoutSetsQueries.updateSet(
            weight = weight,
            reps = reps.toLong(),
            is_completed = if (isCompleted) 1 else 0,
            id = setId
        )
    }

    fun deleteSet(id: String) {
        database.workoutSetsQueries.deleteSet(id)
    }

    // --- Sports ---

    fun logSport(activityName: String, durationMin: Int, calories: Double, metValue: Double, date: String?): String {
        val id = Uuid.random().toString()
        val startTime = date ?: Clock.System.now().toString()
        database.sportsLogsQueries.insertSportsLog(
            id = id,
            activity_name = activityName,
            start_time = startTime,
            duration_min = durationMin.toLong(),
            calories = calories,
            met_value = metValue
        )
        return id
    }

    fun getSportsLogs(dateStr: String?): List<SportsLog> {
        val logs = if (dateStr != null) {
            database.sportsLogsQueries.getSportsLogsForDate("$dateStr%").executeAsList()
        } else {
            database.sportsLogsQueries.getAllSportsLogs().executeAsList()
        }
        return logs.map { s ->
            SportsLog(
                id = s.id,
                activityName = s.activity_name,
                startTime = s.start_time,
                durationMin = s.duration_min.toInt(),
                calories = s.calories,
                metValue = s.met_value
            )
        }
    }

    fun deleteSportsLog(id: String) {
        database.sportsLogsQueries.deleteSportsLog(id)
    }

    // --- Weight ---

    fun logWeight(weight: Double, date: String) {
        val existing = database.weightLogsQueries.getWeightForDate(date).executeAsOneOrNull()
        if (existing != null) {
            database.weightLogsQueries.updateWeight(weight = weight, date = date)
        } else {
            val id = Uuid.random().toString()
            database.weightLogsQueries.insertWeight(id = id, weight = weight, date = date)
        }
    }

    fun getWeightHistory(): List<WeightLog> {
        return database.weightLogsQueries.getWeightHistory().executeAsList().map { w ->
            WeightLog(id = w.id, weight = w.weight, date = w.date)
        }
    }

    fun getLatestWeight(): Double {
        return database.weightLogsQueries.getLatestWeight().executeAsOneOrNull() ?: 70.0
    }

    // --- Height ---

    fun updateHeight(heightCm: Double) {
        database.userMetaQueries.upsert(key = "height_cm", value_ = heightCm.toString())
    }

    fun getHeight(): Double? {
        return database.userMetaQueries.getValue("height_cm").executeAsOneOrNull()?.toDoubleOrNull()
    }

    // --- Muscle Analytics ---

    fun getMusclesForDate(dateStr: String): List<String> {
        return database.workoutSetsQueries.getMusclesForDate("$dateStr%").executeAsList()
    }

    fun getSecondaryMusclesForDate(dateStr: String): List<String> {
        return database.workoutSetsQueries.getSecondaryMusclesForDate("$dateStr%")
            .executeAsList()
            .flatMap { parseSecondaryMuscles(it) }
    }

    fun getMusclesForRange(startDate: String): List<String> {
        return database.workoutSetsQueries.getMusclesForRange(startDate).executeAsList()
    }

    fun getVolumeForRange(startDate: String): Double {
        return database.workoutSetsQueries.getVolumeForRange(startDate).executeAsOneOrNull()?.total_volume ?: 0.0
    }

    fun getVolumeHistory(startDate: String): List<Pair<String, Double>> {
        return database.workoutSetsQueries.getVolumeByDate(startDate).executeAsList().map {
            Pair(it.day ?: "", it.volume ?: 0.0)
        }
    }

    fun getMuscleSplitForRange(startDate: String): List<Pair<String, Long>> {
        return database.workoutSetsQueries.getMuscleSplitForRange(startDate).executeAsList().map {
            Pair(it.target_muscle, it.set_count)
        }
    }

    // --- Helpers ---

    private fun parseSecondaryMuscles(jsonStr: String?): List<String> {
        if (jsonStr.isNullOrBlank()) return emptyList()
        return try {
            json.decodeFromString<List<String>>(jsonStr)
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun mapWorkout(w: com.lockin.db.Workouts): Workout {
        return Workout(
            id = w.id,
            date = w.date,
            name = w.name,
            durationSec = w.duration_sec.toInt(),
            bodyweight = w.bodyweight,
            status = w.status,
            timerStart = w.timer_start,
            isTimerRunning = w.is_timer_running != 0L
        )
    }
}
