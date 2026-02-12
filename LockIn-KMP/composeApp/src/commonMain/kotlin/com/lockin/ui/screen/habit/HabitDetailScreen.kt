package com.lockin.ui.screen.habit

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.AcUnit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockin.model.Habit
import com.lockin.model.StreakFreeze
import com.lockin.repository.HabitRepository
import com.lockin.ui.component.Heatmap
import com.lockin.ui.component.LogValueModal
import com.lockin.ui.component.ProgressRing
import com.lockin.ui.theme.Background
import com.lockin.ui.theme.Error
import com.lockin.ui.theme.Frozen
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.Surface
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextPrimary
import com.lockin.ui.theme.TextSecondary
import com.lockin.usecase.habit.CalculateStreakUseCase
import com.lockin.usecase.habit.LogCompletionUseCase

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HabitDetailScreen(
    habitId: String,
    viewDate: String,
    habitRepo: HabitRepository,
    logCompletionUseCase: LogCompletionUseCase,
    calculateStreakUseCase: CalculateStreakUseCase,
    onBack: () -> Unit
) {
    var habit by remember { mutableStateOf<Habit?>(null) }
    var heatmapData by remember { mutableStateOf<Map<String, Int>>(emptyMap()) }
    var freezeHistory by remember { mutableStateOf<List<StreakFreeze>>(emptyList()) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showLogModal by remember { mutableStateOf(false) }

    fun loadData() {
        habit = habitRepo.getHabitById(habitId)
        heatmapData = habitRepo.getHabitHistory(habitId)
        freezeHistory = habitRepo.getFreezesForHabit(habitId)
    }

    LaunchedEffect(habitId) { loadData() }

    val h = habit ?: return

    if (showLogModal) {
        LogValueModal(
            habit = h,
            onDismiss = { showLogModal = false },
            onSave = { value ->
                logCompletionUseCase.logValue(habitId, viewDate, value)
                showLogModal = false
                loadData()
            }
        )
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Habit?", color = TextPrimary) },
            text = { Text("This will permanently delete this habit and all its data.", color = TextSecondary) },
            confirmButton = {
                TextButton(onClick = {
                    habitRepo.deleteHabit(habitId)
                    showDeleteDialog = false
                    onBack()
                }) {
                    Text("Delete", color = Error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            },
            containerColor = Surface
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Habit Detail", color = TextPrimary, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Background)
            )
        },
        containerColor = Background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Header: Icon + Name + Type + Streak
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Surface)
                    .padding(20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(hexToColor(h.color).copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(h.icon.take(1), fontSize = 28.sp)
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(h.name, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(if (h.type == "build") Primary else Error)
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                h.type.uppercase(),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.Black
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("${h.currentStreak} day streak", color = TextSecondary, fontSize = 13.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Quantitative progress (if applicable)
            if (h.targetValue > 1) {
                val current = h.completedValue ?: 0.0
                val progress = (current / h.targetValue).toFloat().coerceIn(0f, 1f)

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Surface)
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        ProgressRing(progress = progress, size = 56.dp, strokeWidth = 5.dp)
                        Text(
                            "${(progress * 100).toInt()}%",
                            fontSize = 12.sp,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text("${current.toLong()} / ${h.targetValue} ${h.unit}", color = Primary, fontWeight = FontWeight.Bold)
                        Text("Today's progress", color = TextSecondary, fontSize = 12.sp)
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Recent History (7-day dots)
            if (h.recentHistory.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Surface)
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    val dayLabels = listOf("M", "T", "W", "T", "F", "S", "S")
                    h.recentHistory.forEachIndexed { index, value ->
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when (value) {
                                            1 -> Color(0xFF22C55E)
                                            2 -> Frozen
                                            else -> SurfaceHighlight
                                        }
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                if (value == 1) Text("✓", color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                if (value == 2) Text("*", color = Color.White, fontSize = 14.sp)
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                dayLabels.getOrElse(index) { "" },
                                fontSize = 10.sp,
                                color = TextSecondary
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Heatmap
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Surface)
                    .padding(16.dp)
            ) {
                Heatmap(data = heatmapData, modifier = Modifier.fillMaxWidth())
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Freeze History
            if (freezeHistory.isNotEmpty()) {
                Text(
                    "FREEZE HISTORY",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextSecondary,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                freezeHistory.take(10).forEach { freeze ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(freeze.date, color = TextPrimary, fontSize = 14.sp)
                        Text("Frozen", color = Frozen, fontSize = 12.sp)
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Toggle/Log button
                Button(
                    onClick = {
                        if (h.targetValue > 1) {
                            showLogModal = true
                        } else {
                            logCompletionUseCase.execute(habitId, viewDate)
                            loadData()
                        }
                    },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (h.completedToday) SurfaceHighlight else Primary,
                        contentColor = if (h.completedToday) TextSecondary else Color.Black
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        if (h.completedToday) "Undo" else "Complete",
                        fontWeight = FontWeight.Bold
                    )
                }

                // Freeze button
                OutlinedButton(
                    onClick = {
                        logCompletionUseCase.freezeDate(habitId, viewDate)
                        loadData()
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.AcUnit, null, tint = Frozen, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Freeze", color = Frozen)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Archive
                OutlinedButton(
                    onClick = {
                        if (h.archived) habitRepo.restoreHabit(habitId) else habitRepo.archiveHabit(habitId)
                        loadData()
                    },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Archive, null, tint = TextSecondary, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(if (h.archived) "Restore" else "Archive", color = TextSecondary)
                }

                // Delete
                OutlinedButton(
                    onClick = { showDeleteDialog = true },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Delete, null, tint = Error, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Delete", color = Error)
                }
            }

            Spacer(modifier = Modifier.height(48.dp))
        }
    }
}

private fun hexToColor(hex: String): Color {
    return try {
        val s = hex.removePrefix("#")
        Color(s.toLong(16) or if (s.length == 6) 0xFF000000 else 0)
    } catch (e: Exception) {
        Primary
    }
}
