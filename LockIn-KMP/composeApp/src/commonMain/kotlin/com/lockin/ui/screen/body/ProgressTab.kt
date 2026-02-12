package com.lockin.ui.screen.body

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
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
import com.lockin.model.MuscleSplit
import com.lockin.model.WeightLog
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.Surface
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextPrimary
import com.lockin.ui.theme.TextSecondary
import com.lockin.usecase.body.MuscleSplitUseCase
import com.lockin.repository.BodyRepository
import com.lockin.util.DateUtils
import org.koin.compose.koinInject

@Composable
fun ProgressTab() {
    val muscleSplitUseCase: MuscleSplitUseCase = koinInject()
    val bodyRepo: BodyRepository = koinInject()

    var muscleSplit by remember { mutableStateOf<List<MuscleSplit>>(emptyList()) }
    var weekVolume by remember { mutableStateOf(0.0) }
    var monthVolume by remember { mutableStateOf(0.0) }
    var todayMuscles by remember { mutableStateOf<List<String>>(emptyList()) }
    var weightHistory by remember { mutableStateOf<List<WeightLog>>(emptyList()) }
    var volumeHistory by remember { mutableStateOf<List<Pair<String, Double>>>(emptyList()) }

    LaunchedEffect(Unit) {
        muscleSplit = muscleSplitUseCase.getMuscleSplit(30)
        weekVolume = muscleSplitUseCase.getVolumeForRange(7)
        monthVolume = muscleSplitUseCase.getVolumeForRange(30)
        todayMuscles = muscleSplitUseCase.getMusclesForDate(DateUtils.getTodayDateString())
        weightHistory = bodyRepo.getWeightHistory()
        volumeHistory = muscleSplitUseCase.getVolumeHistory(30)
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Today's Muscles
        item {
            SectionLabel("MUSCLES HIT TODAY")
            Spacer(modifier = Modifier.height(4.dp))
            if (todayMuscles.isEmpty()) {
                Text("No workout today yet.", color = TextSecondary, fontSize = 13.sp)
            } else {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    todayMuscles.forEach { muscle ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Primary.copy(alpha = 0.2f))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                muscle.substringAfter("/").replaceFirstChar { it.uppercase() },
                                color = Primary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }

        // Volume Stats
        item {
            SectionLabel("VOLUME")
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    label = "7 Days",
                    value = "${(weekVolume / 1000).toInt()}k kg",
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    label = "30 Days",
                    value = "${(monthVolume / 1000).toInt()}k kg",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Volume Trend (simple bar chart)
        if (volumeHistory.isNotEmpty()) {
            item {
                SectionLabel("VOLUME TREND (30 DAYS)")
                Spacer(modifier = Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Surface)
                        .padding(16.dp)
                ) {
                    val maxVol = volumeHistory.maxOfOrNull { it.second } ?: 1.0
                    Row(
                        modifier = Modifier.fillMaxWidth().height(100.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        volumeHistory.takeLast(14).forEach { (_, vol) ->
                            val ratio = (vol / maxVol).toFloat().coerceIn(0f, 1f)
                            Box(
                                modifier = Modifier
                                    .width(6.dp)
                                    .height((ratio * 80 + 2).dp)
                                    .clip(RoundedCornerShape(topStart = 3.dp, topEnd = 3.dp))
                                    .background(if (vol > 0) Primary else SurfaceHighlight)
                            )
                        }
                    }
                }
            }
        }

        // Muscle Split
        if (muscleSplit.isNotEmpty()) {
            item {
                SectionLabel("MUSCLE SPLIT (30 DAYS)")
                Spacer(modifier = Modifier.height(4.dp))
            }

            items(muscleSplit) { split ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Surface)
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(split.name, color = TextPrimary, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
                    Text("${split.count} sets", color = TextSecondary, fontSize = 12.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    LinearProgressIndicator(
                        progress = { (split.value / 100f).toFloat().coerceIn(0f, 1f) },
                        modifier = Modifier.width(60.dp).height(6.dp).clip(RoundedCornerShape(3.dp)),
                        color = Primary,
                        trackColor = SurfaceHighlight
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("${split.value.toInt()}%", color = Primary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }

        // Weight Trend
        if (weightHistory.isNotEmpty()) {
            item {
                SectionLabel("WEIGHT TREND")
                Spacer(modifier = Modifier.height(4.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Surface)
                        .padding(16.dp)
                ) {
                    val latest = weightHistory.firstOrNull()
                    Text(
                        "${latest?.weight ?: "--"} kg",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text("Latest", color = TextSecondary, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    // Show last few entries
                    weightHistory.take(7).forEach { log ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(log.date, color = TextSecondary, fontSize = 12.sp)
                            Text("${log.weight} kg", color = TextPrimary, fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        color = TextSecondary,
        letterSpacing = 2.sp
    )
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Surface)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(value, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Primary)
        Text(label, color = TextSecondary, fontSize = 12.sp)
    }
}
