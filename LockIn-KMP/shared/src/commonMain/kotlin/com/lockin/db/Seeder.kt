package com.lockin.db

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class ExerciseSeed(
    val id: String,
    val name: String,
    val target_muscle: String,
    val secondary_muscles: List<String> = emptyList(),
    val equipment: String,
    val category_icon: String? = null,
    val is_custom: Int = 0
)

class Seeder(private val database: LockinDatabase) {

    private val json = Json { ignoreUnknownKeys = true }

    fun seedExercises(exercisesJson: String) {
        val exercises = json.decodeFromString<List<ExerciseSeed>>(exercisesJson)
        val count = database.exercisesQueries.getExerciseCount().executeAsOne()

        if (count < exercises.size.toLong()) {
            exercises.forEach { exercise ->
                database.exercisesQueries.insertExercise(
                    id = exercise.id,
                    name = exercise.name,
                    target_muscle = exercise.target_muscle,
                    secondary_muscles = Json.encodeToString(
                        kotlinx.serialization.builtins.ListSerializer(kotlinx.serialization.builtins.serializer<String>()),
                        exercise.secondary_muscles
                    ),
                    equipment = exercise.equipment,
                    is_custom = exercise.is_custom.toLong()
                )
            }
        }
    }
}
