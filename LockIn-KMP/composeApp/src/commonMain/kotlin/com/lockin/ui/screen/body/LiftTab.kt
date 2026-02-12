package com.lockin.ui.screen.body

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockin.model.Exercise
import com.lockin.model.Workout
import com.lockin.model.WorkoutSet
import com.lockin.ui.theme.Background
import com.lockin.ui.theme.Error
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.Surface
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextPrimary
import com.lockin.ui.theme.TextSecondary
import org.koin.compose.koinInject
import com.lockin.repository.BodyRepository
import com.lockin.usecase.body.SetLoggingUseCase
import com.lockin.usecase.body.WorkoutSessionUseCase
import com.lockin.util.DateUtils

@Composable
fun LiftTab() {
    val bodyRepo: BodyRepository = koinInject()
    val workoutUseCase: WorkoutSessionUseCase = koinInject()
    val setLogging: SetLoggingUseCase = koinInject()

    var activeWorkout by remember { mutableStateOf<Workout?>(null) }
    var sets by remember { mutableStateOf<List<WorkoutSet>>(emptyList()) }
    var showExercisePicker by remember { mutableStateOf(false) }
    var showAddSet by remember { mutableStateOf<String?>(null) } // exerciseId
    var todayWorkouts by remember { mutableStateOf<List<Workout>>(emptyList()) }

    fun loadData() {
        activeWorkout = workoutUseCase.getActiveWorkout()
        activeWorkout?.let { sets = workoutUseCase.getSetsForWorkout(it.id) }
        todayWorkouts = workoutUseCase.getWorkoutsForDate(DateUtils.getTodayDateString())
    }

    LaunchedEffect(Unit) { loadData() }

    // Exercise Picker Dialog
    if (showExercisePicker) {
        ExercisePickerDialog(
            bodyRepo = bodyRepo,
            onSelect = { exercise ->
                activeWorkout?.let { workout ->
                    setLogging.addSet(workout.id, exercise.id, 0.0, 0)
                    loadData()
                }
                showExercisePicker = false
            },
            onDismiss = { showExercisePicker = false }
        )
    }

    // Add Set Dialog
    showAddSet?.let { exerciseId ->
        AddSetDialog(
            onSave = { weight, reps, rpe ->
                activeWorkout?.let { workout ->
                    setLogging.addSet(workout.id, exerciseId, weight, reps, rpe)
                    loadData()
                }
                showAddSet = null
            },
            onDismiss = { showAddSet = null }
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Active Workout or Start Button
        item {
            if (activeWorkout == null) {
                Button(
                    onClick = {
                        workoutUseCase.startWorkout()
                        loadData()
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary, contentColor = Color.Black),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(Icons.Default.PlayArrow, null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("START WORKOUT", fontWeight = FontWeight.Bold)
                }
            } else {
                // Active Workout Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Surface)
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("ACTIVE WORKOUT", fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                        Text("${sets.size} sets logged", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }
                    Row {
                        IconButton(onClick = { showExercisePicker = true }) {
                            Icon(Icons.Default.Add, "Add Exercise", tint = Primary)
                        }
                        IconButton(onClick = {
                            activeWorkout?.let {
                                workoutUseCase.finishWorkout(it.id, it.durationSec, null)
                                loadData()
                            }
                        }) {
                            Icon(Icons.Default.Stop, "Finish", tint = Error)
                        }
                    }
                }
            }
        }

        // Sets grouped by exercise
        if (activeWorkout != null && sets.isNotEmpty()) {
            val grouped = sets.groupBy { it.exerciseName ?: it.exerciseId }
            grouped.forEach { (exerciseName, exerciseSets) ->
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Surface)
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(exerciseName, color = Primary, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            IconButton(
                                onClick = { showAddSet = exerciseSets.first().exerciseId },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(Icons.Default.Add, "Add Set", tint = Primary, modifier = Modifier.size(18.dp))
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))

                        // Set header
                        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp)) {
                            Text("SET", color = TextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(32.dp))
                            Text("WEIGHT", color = TextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                            Text("REPS", color = TextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                            Spacer(modifier = Modifier.width(32.dp))
                        }

                        exerciseSets.forEachIndexed { index, set ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp, horizontal = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("${index + 1}", color = TextSecondary, fontSize = 14.sp, modifier = Modifier.width(32.dp))
                                Text("${set.weight}kg", color = TextPrimary, fontSize = 14.sp, modifier = Modifier.weight(1f))
                                Text("${set.reps}", color = TextPrimary, fontSize = 14.sp, modifier = Modifier.weight(1f))
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .clip(CircleShape)
                                        .background(if (set.isCompleted) Primary else SurfaceHighlight)
                                        .clickable {
                                            setLogging.updateSet(set.id, set.weight, set.reps, !set.isCompleted)
                                            loadData()
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (set.isCompleted) {
                                        Icon(Icons.Default.Check, null, tint = Color.Black, modifier = Modifier.size(14.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Today's Completed Workouts
        if (todayWorkouts.any { it.status == "completed" }) {
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text("COMPLETED TODAY", fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
            }
            items(todayWorkouts.filter { it.status == "completed" }) { workout ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Surface)
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(workout.name ?: "Workout", color = TextPrimary, fontWeight = FontWeight.Medium)
                    Text("${workout.durationSec / 60} min", color = TextSecondary)
                }
            }
        }

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

@Composable
private fun ExercisePickerDialog(
    bodyRepo: BodyRepository,
    onSelect: (Exercise) -> Unit,
    onDismiss: () -> Unit
) {
    var query by remember { mutableStateOf("") }
    var exercises by remember { mutableStateOf(bodyRepo.getAllExercises()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Pick Exercise", color = TextPrimary, fontWeight = FontWeight.Bold) },
        text = {
            Column {
                OutlinedTextField(
                    value = query,
                    onValueChange = {
                        query = it
                        exercises = if (it.isBlank()) bodyRepo.getAllExercises()
                        else bodyRepo.searchExercises(it)
                    },
                    placeholder = { Text("Search...", color = TextSecondary) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary,
                        unfocusedBorderColor = SurfaceHighlight,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        cursorColor = Primary
                    )
                )
                Spacer(modifier = Modifier.height(8.dp))
                // Show first 20 results
                Column(modifier = Modifier.height(300.dp)) {
                    exercises.take(20).forEach { exercise ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelect(exercise) }
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(exercise.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                Text(exercise.targetMuscle, color = TextSecondary, fontSize = 11.sp)
                            }
                            Text(exercise.equipment, color = TextSecondary, fontSize = 11.sp)
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel", color = TextSecondary) }
        },
        containerColor = Surface
    )
}

@Composable
private fun AddSetDialog(
    onSave: (Double, Int, Double?) -> Unit,
    onDismiss: () -> Unit
) {
    var weight by remember { mutableStateOf("") }
    var reps by remember { mutableStateOf("") }
    var rpe by remember { mutableStateOf("") }

    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = Primary,
        unfocusedBorderColor = SurfaceHighlight,
        focusedTextColor = TextPrimary,
        unfocusedTextColor = TextPrimary,
        cursorColor = Primary,
        focusedLabelColor = Primary,
        unfocusedLabelColor = TextSecondary
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Set", color = TextPrimary, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = weight, onValueChange = { weight = it },
                    label = { Text("Weight (kg)") }, colors = fieldColors,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true, modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = reps, onValueChange = { reps = it },
                    label = { Text("Reps") }, colors = fieldColors,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true, modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = rpe, onValueChange = { rpe = it },
                    label = { Text("RPE (optional)") }, colors = fieldColors,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true, modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(onClick = {
                val w = weight.toDoubleOrNull() ?: return@TextButton
                val r = reps.toIntOrNull() ?: return@TextButton
                onSave(w, r, rpe.toDoubleOrNull())
            }) { Text("Add", color = Primary, fontWeight = FontWeight.Bold) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = TextSecondary) } },
        containerColor = Surface
    )
}
