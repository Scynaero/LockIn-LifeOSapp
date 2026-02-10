package com.lockin.ui.component

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.lockin.ui.theme.SurfaceHighlight

data class RingSegment(
    val value: Float, // 0.0 to 1.0 (proportion of total)
    val color: Color
)

/**
 * A multi-segment progress ring.
 *
 * @param progress Overall completion (0.0 to 1.0) - determines how much of the ring is filled
 * @param segments Color segments of the filled portion (build/quit/frozen)
 * @param size Diameter of the ring
 * @param strokeWidth Width of the arc stroke
 */
@Composable
fun ProgressRing(
    progress: Float,
    segments: List<RingSegment> = emptyList(),
    size: Dp = 80.dp,
    strokeWidth: Dp = 8.dp,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier.size(size)) {
        val canvasSize = this.size.minDimension
        val stroke = strokeWidth.toPx()
        val radius = (canvasSize - stroke) / 2
        val topLeft = Offset(stroke / 2, stroke / 2)
        val arcSize = Size(canvasSize - stroke, canvasSize - stroke)

        // Background track
        drawArc(
            color = SurfaceHighlight,
            startAngle = -90f,
            sweepAngle = 360f,
            useCenter = false,
            topLeft = topLeft,
            size = arcSize,
            style = Stroke(width = stroke, cap = StrokeCap.Round)
        )

        // Filled segments
        val totalSweep = progress.coerceIn(0f, 1f) * 360f
        var currentAngle = -90f

        if (segments.isNotEmpty()) {
            segments.forEach { segment ->
                val segmentSweep = segment.value * totalSweep
                if (segmentSweep > 0f) {
                    drawArc(
                        color = segment.color,
                        startAngle = currentAngle,
                        sweepAngle = segmentSweep,
                        useCenter = false,
                        topLeft = topLeft,
                        size = arcSize,
                        style = Stroke(width = stroke, cap = StrokeCap.Round)
                    )
                    currentAngle += segmentSweep
                }
            }
        } else if (totalSweep > 0f) {
            // Single-color ring when no segments provided
            drawArc(
                color = Color(0xFFCCFF00),
                startAngle = -90f,
                sweepAngle = totalSweep,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(width = stroke, cap = StrokeCap.Round)
            )
        }
    }
}
