package com.lockin.ui.component.body

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.unit.dp
import com.lockin.ui.theme.*

@Composable
fun BodyHeatmap(
    muscleIntensity: Map<String, Double>, // Muscle Name -> intensity (0.0 to 1.0)
    modifier: Modifier = Modifier.size(300.dp, 500.dp)
) {
    Box(modifier = modifier) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            // Background / Shadow
            // drawBodyOutline()

            // Muscles
            drawMuscle("chest", muscleIntensity["chest"] ?: 0.0)
            drawMuscle("abs", muscleIntensity["abs"] ?: 0.0)
            drawMuscle("bicep_l", muscleIntensity["bicep_l"] ?: 0.0)
            drawMuscle("bicep_r", muscleIntensity["bicep_r"] ?: 0.0)
            drawMuscle("quad_l", muscleIntensity["quad_l"] ?: 0.0)
            drawMuscle("quad_r", muscleIntensity["quad_r"] ?: 0.0)
            drawMuscle("shoulder_l", muscleIntensity["shoulder_l"] ?: 0.0)
            drawMuscle("shoulder_r", muscleIntensity["shoulder_r"] ?: 0.0)
        }
    }
}

private fun DrawScope.drawMuscle(name: String, intensity: Double) {
    val baseColor = Primary
    val color = if (intensity > 0) {
        baseColor.copy(alpha = 0.3f + (intensity.toFloat() * 0.7f))
    } else {
        SurfaceHighlight
    }

    // Glow for high intensity
    if (intensity > 0.8) {
        // drawGlow(name, color)
    }

    // Placeholder paths until SVG paths are provided
    val path = getMusclePath(name)
    drawPath(path, color)
}

private fun getMusclePath(name: String): Path {
    val path = Path()
    // Placeholder shapes for the logic structure
    when (name) {
        "chest" -> {
            path.moveTo(100f, 100f)
            path.lineTo(200f, 100f)
            path.lineTo(200f, 150f)
            path.lineTo(100f, 150f)
            path.close()
        }
        "abs" -> {
            path.moveTo(120f, 160f)
            path.lineTo(180f, 160f)
            path.lineTo(180f, 250f)
            path.lineTo(120f, 250f)
            path.close()
        }
        "bicep_l" -> {
            path.moveTo(80f, 120f)
            path.lineTo(100f, 120f)
            path.lineTo(100f, 180f)
            path.lineTo(80f, 180f)
            path.close()
        }
        "bicep_r" -> {
            path.moveTo(200f, 120f)
            path.lineTo(220f, 120f)
            path.lineTo(220f, 180f)
            path.lineTo(200f, 180f)
            path.close()
        }
        "quad_l" -> {
            path.moveTo(110f, 260f)
            path.lineTo(145f, 260f)
            path.lineTo(145f, 380f)
            path.lineTo(110f, 380f)
            path.close()
        }
        "quad_r" -> {
            path.moveTo(155f, 260f)
            path.lineTo(190f, 260f)
            path.lineTo(190f, 380f)
            path.lineTo(155f, 380f)
            path.close()
        }
    }
    return path
}
