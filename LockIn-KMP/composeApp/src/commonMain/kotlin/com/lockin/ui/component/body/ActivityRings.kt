package com.lockin.ui.component.body

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.lockin.ui.theme.*

@Composable
fun ActivityRings(
    movePercent: Float,
    exercisePercent: Float,
    standPercent: Float,
    size: Dp = 200.dp,
    strokeWidth: Dp = 18.dp
) {
    val animMove = remember { Animatable(0f) }
    val animExercise = remember { Animatable(0f) }
    val animStand = remember { Animatable(0f) }

    LaunchedEffect(movePercent, exercisePercent, standPercent) {
        animMove.animateTo(movePercent, tween(1000))
        animExercise.animateTo(exercisePercent, tween(1000))
        animStand.animateTo(standPercent, tween(1000))
    }

    Box(modifier = Modifier.size(size)) {
        Canvas(modifier = Modifier.matchParentSize()) {
            val center = Offset(size.toPx() / 2, size.toPx() / 2)
            val strokePx = strokeWidth.toPx()
            val spacing = 4.dp.toPx()

            // Outer ring (Move)
            val moveRadius = (size.toPx() / 2) - strokePx / 2
            drawRing(center, moveRadius, strokePx, RingMove, animMove.value)

            // Middle ring (Exercise)
            val exerciseRadius = moveRadius - strokePx - spacing
            drawRing(center, exerciseRadius, strokePx, RingExercise, animExercise.value)

            // Inner ring (Stand)
            val standRadius = exerciseRadius - strokePx - spacing
            drawRing(center, standRadius, strokePx, RingStand, animStand.value)
        }
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawRing(
    center: Offset,
    radius: Float,
    strokeWidth: Float,
    color: Color,
    percent: Float
) {
    // Background track
    drawCircle(
        color = color.copy(alpha = 0.2f),
        radius = radius,
        center = center,
        style = Stroke(width = strokeWidth)
    )

    // Progress
    drawArc(
        color = color,
        startAngle = -90f,
        sweepAngle = (percent * 360f).coerceIn(0f, 360f),
        useCenter = false,
        topLeft = Offset(center.x - radius, center.y - radius),
        size = Size(radius * 2, radius * 2),
        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
    )
}
