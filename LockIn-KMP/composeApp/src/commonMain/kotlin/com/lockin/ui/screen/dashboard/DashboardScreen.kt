package com.lockin.ui.screen.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockin.ui.component.LogValueModal
import com.lockin.ui.theme.Background
import com.lockin.ui.theme.TextPrimary
import com.lockin.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardScreenModel
) {
    val state by viewModel.state.collectAsState()
    val scrollState = rememberScrollState()

    if (state.logModalHabit != null) {
        LogValueModal(
            habit = state.logModalHabit,
            onDismiss = { viewModel.dismissLogModal() },
            onSave = { value -> viewModel.logHabitValue(state.logModalHabit!!.id, value) }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "DASHBOARD",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.0.sp
                        )
                        Text(
                            text = "Hello, Champion", // Could be dynamic
                            style = MaterialTheme.typography.titleMedium,
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { /* TODO: Notifications */ }) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Notifications",
                            tint = TextPrimary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Background
                )
            )
        },
        containerColor = Background
    ) { padding ->
        if (state.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(scrollState)
            ) {
                // XP & Active Habits
                QuickStatsSection(
                    userXp = state.userXp,
                    xpProgress = state.xpProgress,
                    activeHabitsCount = state.habits.size
                )

                // Daily Progress Ring
                DailyGoalProgress(stats = state.stats)

                // Heatmap (if data exists)
                if (state.heatmapData.isNotEmpty()) {
                    HeatmapView(heatmapData = state.heatmapData)
                }

                // Top Streaks
                StreakLeaderboard(bestStreaks = state.bestStreaks)

                // Today's Habits List
                HabitQuickActions(
                    habits = state.habits,
                    onToggleHabit = { id -> viewModel.toggleHabit(id) },
                    onLogValue = { habit -> viewModel.showLogModal(habit) }
                )
                
                Spacer(modifier = Modifier.height(80.dp)) // Bottom padding for FAB/Navbar
            }
        }
    }
}
