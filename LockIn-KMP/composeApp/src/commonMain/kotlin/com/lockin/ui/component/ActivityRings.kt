package com.lockin.ui.component

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockin.ui.theme.RingExercise
import com.lockin.ui.theme.RingMove
import com.lockin.ui.theme.RingStand
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextPrimary
import com.lockin.ui.theme.TextSecondary

/**
 * Three concentric activity rings (Move / Exercise / Stand) inspired by Apple Fitness.
 *
 * @param moveProgress  0.0..1.0+  (calories progress, can exceed 1 for overshoot)
 * @param exerciseProgress 0.0..1.0+
 * @param standProgress 0.0..1.0+
 */
@Composable
fun ActivityRings(
    moveProgress: Float,
    exerciseProgress: Float,
    standProgress: Float,
    modifier: Modifier = Modifier,
    size: Dp = 140.dp,
    ringWidth: Dp = 14.dp,
    showLabels: Boolean = true
) {
    val animProgress = remember { Animatable(0f) }
    LaunchedEffect(moveProgress, exerciseProgress, standProgress) {
        animProgress.snapTo(0f)
        animProgress.animateTo(1f, animationSpec = tween(durationMillis = 1000))
    }

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier.size(size),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.size(size)) {
                val strokePx = ringWidth.toPx()
                val gap = strokePx + 4.dp.toPx()

                // Draw three rings from outermost to innermost
                data class RingSpec(val progress: Float, val color: androidx.compose.ui.graphics.Color)

                val rings = listOf(
                    RingSpec(moveProgress, RingMove),
                    RingSpec(exerciseProgress, RingExercise),
                    RingSpec(standProgress, RingStand)
                )

                rings.forEachIndexed { index, ring ->
                    val inset = strokePx / 2f + index * gap
                    val arcSize = Size(
                        this.size.width - inset * 2,
                        this.size.height - inset * 2
                    )
                    val topLeft = Offset(inset, inset)

                    // Background track
                    drawArc(
                        color = ring.color.copy(alpha = 0.15f),
                        startAngle = -90f,
                        sweepAngle = 360f,
                        useCenter = false,
                        topLeft = topLeft,
                        size = arcSize,
                        style = Stroke(width = strokePx, cap = StrokeCap.Round)
                    )

                    // Foreground progress
                    val sweep = (ring.progress.coerceAtMost(1.5f) * 360f * animProgress.value)
                    if (sweep > 0f) {
                        drawArc(
                            color = ring.color,
                            startAngle = -90f,
                            sweepAngle = sweep,
                            useCenter = false,
                            topLeft = topLeft,
                            size = arcSize,
                            style = Stroke(width = strokePx, cap = StrokeCap.Round)
                        )
                    }
                }
            }
        }

        if (showLabels) {
            Spacer(modifier = Modifier.width(16.dp))
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                RingLabel("Move", "${(moveProgress * 100).toInt()}%", RingMove)
                RingLabel("Exercise", "${(exerciseProgress * 100).toInt()}%", RingExercise)
                RingLabel("Stand", "${(standProgress * 100).toInt()}%", RingStand)
            }
        }
    }
}

@Composable
private fun RingLabel(
    label: String,
    value: String,
    color: androidx.compose.ui.graphics.Color
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Canvas(modifier = Modifier.size(8.dp)) {
            drawCircle(color = color)
        }
        Spacer(modifier = Modifier.width(6.dp))
        Text(text = label, fontSize = 12.sp, color = TextSecondary)
        Spacer(modifier = Modifier.width(4.dp))
        Text(text = value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
    }
}
