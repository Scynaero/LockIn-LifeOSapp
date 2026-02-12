package com.lockin.ui.component

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockin.ui.theme.Frozen
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextSecondary
import com.lockin.util.DateUtils
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus

/**
 * 364-day heatmap grid showing "perfect days"
 * Green = logged (value 1), Blue = frozen (value 2), Gray = no data
 *
 * Layout: 7 rows (Mon-Sun) x 52 columns (weeks)
 * Scrollable horizontally, latest dates on the right
 */
@Composable
fun Heatmap(
    data: Map<String, Int>,
    modifier: Modifier = Modifier
) {
    val today = DateUtils.today()
    val cellSize = 12f
    val cellGap = 3f
    val totalDays = 364
    val columns = 52
    val rows = 7

    // Calculate the start date (364 days ago, aligned to Monday)
    val startDate = today.minus(totalDays - 1, DateTimeUnit.DAY)
    val startDayOfWeek = startDate.dayOfWeek.ordinal // 0=Monday

    Column(modifier = modifier.padding(vertical = 16.dp)) {
        Text(
            text = "CONSISTENCY MAP",
            style = MaterialTheme.typography.labelSmall,
            color = TextSecondary,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState())
        ) {
            val totalWidth = columns * (cellSize + cellGap)
            val totalHeight = rows * (cellSize + cellGap)

            Canvas(
                modifier = Modifier
                    .width((totalWidth + 8).dp)
                    .height((totalHeight + 4).dp)
            ) {
                var dayIndex = 0
                for (col in 0 until columns) {
                    for (row in 0 until rows) {
                        // Skip cells before start date in the first column
                        if (col == 0 && row < startDayOfWeek) {
                            continue
                        }

                        if (dayIndex >= totalDays) break

                        val date = addDays(startDate, dayIndex)
                        val dateStr = date.toString()
                        val value = data[dateStr] ?: 0

                        val color = when (value) {
                            1 -> Primary.copy(alpha = 0.8f)   // Green - logged
                            2 -> Frozen.copy(alpha = 0.6f)    // Blue - frozen
                            else -> SurfaceHighlight           // Gray - empty
                        }

                        val x = col * (cellSize + cellGap)
                        val y = row * (cellSize + cellGap)

                        drawRoundRect(
                            color = color,
                            topLeft = Offset(x.dp.toPx(), y.dp.toPx()),
                            size = Size(cellSize.dp.toPx(), cellSize.dp.toPx()),
                            cornerRadius = CornerRadius(2.dp.toPx())
                        )

                        dayIndex++
                    }
                }
            }
        }

        // Legend
        Spacer(modifier = Modifier.height(8.dp))
        Row {
            LegendItem(color = Primary.copy(alpha = 0.8f), label = "Completed")
            Spacer(modifier = Modifier.width(16.dp))
            LegendItem(color = Frozen.copy(alpha = 0.6f), label = "Frozen")
            Spacer(modifier = Modifier.width(16.dp))
            LegendItem(color = SurfaceHighlight, label = "Missed")
        }
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Row {
        Canvas(modifier = Modifier.width(12.dp).height(12.dp)) {
            drawRoundRect(
                color = color,
                cornerRadius = CornerRadius(2.dp.toPx())
            )
        }
        Spacer(modifier = Modifier.width(4.dp))
        Text(
            text = label,
            fontSize = 10.sp,
            color = TextSecondary
        )
    }
}

private fun addDays(base: LocalDate, days: Int): LocalDate {
    var result = base
    repeat(days) { result = result.plus(1, DateTimeUnit.DAY) }
    return result
}
