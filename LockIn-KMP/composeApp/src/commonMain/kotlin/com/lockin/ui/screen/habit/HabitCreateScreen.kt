package com.lockin.ui.screen.habit

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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
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
import com.lockin.repository.HabitRepository
import com.lockin.ui.theme.Background
import com.lockin.ui.theme.Error
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.Surface
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextPrimary
import com.lockin.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun HabitCreateScreen(
    habitRepo: HabitRepository,
    startDate: String? = null,
    onCreated: () -> Unit,
    onDismiss: () -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("build") } // "build" or "quit"
    var isEveryDay by remember { mutableStateOf(true) }
    var selectedDays by remember {
        mutableStateOf(setOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"))
    }
    var hasCustomGoal by remember { mutableStateOf(false) }
    var customGoal by remember { mutableStateOf("1") }
    var customUnit by remember { mutableStateOf("count") }

    val allDays = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = Primary,
        unfocusedBorderColor = SurfaceHighlight,
        focusedTextColor = TextPrimary,
        unfocusedTextColor = TextPrimary,
        cursorColor = Primary,
        focusedLabelColor = Primary,
        unfocusedLabelColor = TextSecondary
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "New Protocol",
                        style = MaterialTheme.typography.titleLarge,
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, "Close", tint = TextPrimary)
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
            Spacer(modifier = Modifier.height(8.dp))

            // Name
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Habit Name") },
                placeholder = { Text("e.g. Cold Plunge", color = TextSecondary) },
                modifier = Modifier.fillMaxWidth(),
                colors = fieldColors,
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Description
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Description (optional)") },
                placeholder = { Text("e.g. 3 minutes at 40°F", color = TextSecondary) },
                modifier = Modifier.fillMaxWidth(),
                colors = fieldColors,
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Frequency
            SectionLabel("FREQUENCY")
            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ChipButton(
                    text = "Every Day",
                    selected = isEveryDay,
                    onClick = {
                        isEveryDay = true
                        selectedDays = allDays.toSet()
                    }
                )
                ChipButton(
                    text = "Select Days",
                    selected = !isEveryDay,
                    onClick = { isEveryDay = false }
                )
            }

            if (!isEveryDay) {
                Spacer(modifier = Modifier.height(8.dp))
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    allDays.forEach { day ->
                        ChipButton(
                            text = day,
                            selected = day in selectedDays,
                            onClick = {
                                selectedDays = if (day in selectedDays && selectedDays.size > 1) {
                                    selectedDays - day
                                } else {
                                    selectedDays + day
                                }
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Custom Goal
            SectionLabel("CUSTOM GOAL")
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Track a specific target", color = TextSecondary)
                Switch(
                    checked = hasCustomGoal,
                    onCheckedChange = { hasCustomGoal = it },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Color.Black,
                        checkedTrackColor = Primary
                    )
                )
            }

            if (hasCustomGoal) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = customGoal,
                        onValueChange = { customGoal = it },
                        label = { Text("Target") },
                        modifier = Modifier.weight(1f),
                        colors = fieldColors,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = customUnit,
                        onValueChange = { customUnit = it },
                        label = { Text("Unit") },
                        modifier = Modifier.weight(1f),
                        colors = fieldColors,
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Type Selection
            SectionLabel("TYPE")
            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                TypeButton(
                    text = "BUILD",
                    selected = type == "build",
                    color = Primary,
                    onClick = { type = "build" },
                    modifier = Modifier.weight(1f)
                )
                TypeButton(
                    text = "QUIT",
                    selected = type == "quit",
                    color = Error,
                    onClick = { type = "quit" },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Submit
            Button(
                onClick = {
                    if (name.trim().isEmpty()) return@Button
                    val freq = if (isEveryDay) "\"daily\"" else selectedDays.joinToString(",", "[\"", "\"]") { "\"$it\"" }
                    val goal = if (hasCustomGoal) customGoal.toDoubleOrNull() ?: 1.0 else 1.0
                    val unit = if (hasCustomGoal) customUnit else "count"
                    val target = if (hasCustomGoal) goal.toInt().coerceAtLeast(1) else 1
                    val color = if (type == "build") "#CCFF00" else "#FF4545"
                    val icon = name.take(1)

                    habitRepo.createHabit(
                        name = name.trim(),
                        type = type,
                        unit = unit,
                        goal = goal,
                        frequency = freq,
                        color = color,
                        icon = icon,
                        description = description.ifBlank { null },
                        targetValue = target,
                        healthType = null,
                        startDate = startDate
                    )
                    onCreated()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Primary,
                    contentColor = Color.Black
                ),
                shape = RoundedCornerShape(16.dp),
                enabled = name.trim().isNotEmpty()
            ) {
                Text("INITIATE", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
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
private fun ChipButton(
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (selected) Primary else SurfaceHighlight)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Text(
            text = text,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = if (selected) Color.Black else TextSecondary
        )
    }
}

@Composable
private fun TypeButton(
    text: String,
    selected: Boolean,
    color: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(if (selected) color else SurfaceHighlight)
            .clickable(onClick = onClick)
            .padding(vertical = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            fontWeight = FontWeight.Bold,
            color = if (selected) Color.Black else TextSecondary,
            fontSize = 16.sp
        )
    }
}
