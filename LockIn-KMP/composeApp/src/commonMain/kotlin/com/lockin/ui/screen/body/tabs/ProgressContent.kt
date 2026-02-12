package com.lockin.ui.screen.body.tabs

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lockin.ui.component.body.ActivityRings
import com.lockin.ui.component.body.BodyHeatmap
import com.lockin.ui.screen.body.BodyScreenModel
import com.lockin.ui.screen.body.BodyUiState
import com.lockin.ui.theme.*

@Composable
fun ProgressContent(
    state: BodyUiState,
    viewModel: BodyScreenModel
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Section: Activity Rings
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceCard)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("DAILY TARGETS", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                Spacer(Modifier.height(16.dp))
                ActivityRings(
                    movePercent = 0.8f, // Mocked for now
                    exercisePercent = 0.6f,
                    standPercent = 0.9f
                )
            }
        }

        // Section: Heatmap
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SurfaceCard)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("MUSCLE INTENSITY", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
                Spacer(Modifier.height(16.dp))
                BodyHeatmap(muscleIntensity = state.heatmapData)
            }
        }

        // Section: BMI & Metrics
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            val bmiFormatted = ((state.bmi * 10).toInt() / 10.0).toString()
            MetricCard("BMI", bmiFormatted, Modifier.weight(1f))
            MetricCard("Weight", "${state.latestWeight}kg", Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun MetricCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = SurfaceCard)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
            Text(value, style = MaterialTheme.typography.headlineSmall, color = Primary, fontWeight = FontWeight.Bold)
        }
    }
}
