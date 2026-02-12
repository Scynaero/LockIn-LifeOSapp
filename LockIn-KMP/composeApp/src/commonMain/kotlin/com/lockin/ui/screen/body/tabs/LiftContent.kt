package com.lockin.ui.screen.body.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lockin.ui.screen.body.BodyScreenModel
import com.lockin.ui.screen.body.BodyUiState
import com.lockin.ui.theme.*

@Composable
fun LiftContent(
    state: BodyUiState,
    viewModel: BodyScreenModel
) {
    if (state.activeWorkout == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Button(
                onClick = { viewModel.startWorkout() },
                colors = ButtonDefaults.buttonColors(containerColor = Primary)
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.Black)
                Spacer(Modifier.width(8.dp))
                Text("Start New Workout", color = Color.Black)
            }
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text(
                    state.activeWorkout.name ?: "Active Workout",
                    style = MaterialTheme.typography.headlineSmall,
                    color = TextPrimary
                )
            }

            items(state.workoutSets.groupBy { it.exerciseId }.toList()) { (exerciseId, sets) ->
                ExerciseCard(
                    exerciseName = sets.first().exerciseName ?: "Exercise",
                    sets = sets,
                    onAddSet = { viewModel.addSet(exerciseId, 0.0, 0) }
                )
            }

            item {
                Button(
                    onClick = { viewModel.finishWorkout() },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Secondary)
                ) {
                    Text("Finish Workout")
                }
            }
        }
    }
}

@Composable
fun ExerciseCard(
    exerciseName: String,
    sets: List<com.lockin.model.WorkoutSet>,
    onAddSet: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(exerciseName, style = MaterialTheme.typography.titleMedium, color = TextPrimary)
                IconButton(onClick = onAddSet) {
                    Icon(Icons.Default.Add, contentDescription = null, tint = Primary)
                }
            }

            sets.forEachIndexed { index, set ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("${index + 1}", color = TextSecondary)
                    Text("${set.weight} kg x ${set.reps}", color = TextPrimary)
                    Spacer(Modifier.weight(1f))
                    if (set.isCompleted) {
                        Text("DONE", color = Success, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }
    }
}
