package com.lockin.ui.screen.body

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import com.lockin.model.SportsLog
import com.lockin.ui.theme.Error
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.Surface
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextPrimary
import com.lockin.ui.theme.TextSecondary
import com.lockin.usecase.body.SportsLoggingUseCase
import com.lockin.util.DateUtils
import org.koin.compose.koinInject

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LiveTab() {
    val sportsUseCase: SportsLoggingUseCase = koinInject()
    var sportsLogs by remember { mutableStateOf<List<SportsLog>>(emptyList()) }
    var showLogDialog by remember { mutableStateOf<Pair<String, Double>?>(null) } // name, met

    fun loadData() {
        sportsLogs = sportsUseCase.getSportsLogs(DateUtils.getTodayDateString())
    }

    LaunchedEffect(Unit) { loadData() }

    // Log Dialog
    showLogDialog?.let { (activity, met) ->
        SportLogDialog(
            activityName = activity,
            metValue = met,
            onSave = { duration ->
                sportsUseCase.logSport(activity, duration, met)
                showLogDialog = null
                loadData()
            },
            onDismiss = { showLogDialog = null }
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Quick Log Buttons
        item {
            Text("QUICK LOG", fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
            Spacer(modifier = Modifier.height(8.dp))
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SportsLoggingUseCase.COMMON_SPORTS.forEach { (name, met) ->
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Surface)
                            .clickable { showLogDialog = name to met }
                            .padding(horizontal = 16.dp, vertical = 12.dp)
                    ) {
                        Text(name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }
        }

        // Today's Total
        item {
            Spacer(modifier = Modifier.height(16.dp))
            val totalCals = sportsLogs.sumOf { it.calories }
            val totalMin = sportsLogs.sumOf { it.durationMin }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Surface)
                    .padding(20.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("${totalCals.toInt()}", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFF6B6B))
                    Text("kcal", color = TextSecondary, fontSize = 12.sp)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("$totalMin", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Primary)
                    Text("min", color = TextSecondary, fontSize = 12.sp)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("${sportsLogs.size}", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFF60A5FA))
                    Text("activities", color = TextSecondary, fontSize = 12.sp)
                }
            }
        }

        // Sports History
        if (sportsLogs.isNotEmpty()) {
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Text("TODAY'S ACTIVITIES", fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
            }

            items(sportsLogs) { log ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Surface)
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(log.activityName, color = TextPrimary, fontWeight = FontWeight.Bold)
                        Text("${log.durationMin} min | ${log.calories.toInt()} kcal", color = TextSecondary, fontSize = 12.sp)
                    }
                    IconButton(onClick = {
                        sportsUseCase.deleteSportsLog(log.id)
                        loadData()
                    }) {
                        Icon(Icons.Default.Delete, "Delete", tint = Error.copy(alpha = 0.7f))
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

@Composable
private fun SportLogDialog(
    activityName: String,
    metValue: Double,
    onSave: (Int) -> Unit,
    onDismiss: () -> Unit
) {
    var duration by remember { mutableStateOf("30") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(activityName, color = TextPrimary, fontWeight = FontWeight.Bold) },
        text = {
            Column {
                Text("MET: $metValue", color = TextSecondary, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = duration,
                    onValueChange = { duration = it },
                    label = { Text("Duration (minutes)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary, unfocusedBorderColor = SurfaceHighlight,
                        focusedTextColor = TextPrimary, unfocusedTextColor = TextPrimary,
                        cursorColor = Primary, focusedLabelColor = Primary, unfocusedLabelColor = TextSecondary
                    )
                )
            }
        },
        confirmButton = {
            TextButton(onClick = { duration.toIntOrNull()?.let { onSave(it) } }) {
                Text("Log", color = Primary, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = TextSecondary) } },
        containerColor = Surface
    )
}
