package com.lockin.ui.screen.dashboard

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockin.model.Habit
import com.lockin.ui.theme.Background
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.Surface
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextPrimary
import com.lockin.ui.theme.TextSecondary

@Composable
fun HabitQuickActions(
    habits: List<Habit>,
    onToggleHabit: (String) -> Unit,
    onLogValue: (Habit) -> Unit
) {
    if (habits.isEmpty()) return

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "TODAY'S HABITS",
            style = MaterialTheme.typography.labelSmall,
            color = TextSecondary,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 4.dp)
        )

        habits.forEach { habit ->
            HabitItem(
                habit = habit,
                onToggle = { onToggleHabit(habit.id) },
                onLogValue = { onLogValue(habit) }
            )
        }
    }
}

@Composable
private fun HabitItem(
    habit: Habit,
    onToggle: () -> Unit,
    onLogValue: () -> Unit
) {
    val isCompleted = habit.completedToday || (habit.completedValue ?: 0.0) >= habit.targetValue.toDouble()
    
    val backgroundColor = if (isCompleted) Surface.copy(alpha = 0.5f) else Surface
    val contentColor = if (isCompleted) TextSecondary else TextPrimary

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(backgroundColor)
            .clickable { 
                if (habit.targetValue > 1) onLogValue() else onToggle()
            }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Icon
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(hexToColor(habit.color).copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = habit.icon.take(1),
                fontSize = 20.sp
            )
        }

        Spacer(modifier = Modifier.width(16.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = habit.name,
                style = MaterialTheme.typography.titleMedium,
                color = contentColor,
                fontWeight = FontWeight.Bold
            )
            
            if (habit.targetValue > 1) {
                Spacer(modifier = Modifier.height(4.dp))
                val current = habit.completedValue?.toInt() ?: 0
                Text(
                    text = "$current / ${habit.targetValue} ${habit.unit}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            } else if (habit.currentStreak > 0) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${habit.currentStreak} day streak",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (isCompleted) TextSecondary else Primary
                )
            }
        }

        // Action Button
        val buttonColor by animateColorAsState(
            if (isCompleted) Primary else SurfaceHighlight
        )
        
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(buttonColor)
                .clickable {
                     if (habit.targetValue > 1) onLogValue() else onToggle()
                },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (habit.targetValue > 1 && !isCompleted) Icons.Default.Add else Icons.Default.Check,
                contentDescription = if (isCompleted) "Completed" else "Check",
                tint = if (isCompleted) Background else TextSecondary,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

private fun hexToColor(hex: String): Color {
    return try {
        val colorString = hex.removePrefix("#")
        val colorLong = colorString.toLong(16)
        if (colorString.length == 6) {
            Color(colorLong or 0xFF000000)
        } else {
            Color(colorLong)
        }
    } catch (e: Exception) {
        Primary // Fallback
    }
}
