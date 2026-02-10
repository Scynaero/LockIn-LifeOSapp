package com.lockin.ui.component

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
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.Surface
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextSecondary
import com.lockin.util.DateUtils
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.minus
import kotlinx.datetime.plus

@Composable
fun CalendarStrip(
    selectedDate: LocalDate,
    onSelectDate: (LocalDate) -> Unit,
    modifier: Modifier = Modifier
) {
    val weekDates = DateUtils.getWeekDates(selectedDate)
    val today = DateUtils.today()
    val monthYear = DateUtils.formatMonthYear(selectedDate)

    Column(modifier = modifier.fillMaxWidth().padding(bottom = 16.dp)) {
        // Month/Year header with navigation arrows
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = {
                    onSelectDate(selectedDate.minus(7, DateTimeUnit.DAY))
                },
                modifier = Modifier.size(32.dp)
            ) {
                Text(
                    text = "<",
                    color = TextSecondary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Text(
                text = monthYear,
                style = MaterialTheme.typography.titleSmall,
                color = Color.White,
                fontWeight = FontWeight.Bold
            )

            IconButton(
                onClick = {
                    onSelectDate(selectedDate.plus(7, DateTimeUnit.DAY))
                },
                modifier = Modifier.size(32.dp)
            ) {
                Text(
                    text = ">",
                    color = TextSecondary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Day cells
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            weekDates.forEach { date ->
                val isSelected = date == selectedDate
                val isToday = date == today
                val dayName = getDayAbbr(date.dayOfWeek)

                DayCell(
                    dayName = dayName,
                    dayNumber = date.dayOfMonth.toString(),
                    isSelected = isSelected,
                    isToday = isToday,
                    onClick = { onSelectDate(date) }
                )
            }
        }
    }
}

@Composable
private fun DayCell(
    dayName: String,
    dayNumber: String,
    isSelected: Boolean,
    isToday: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(
                when {
                    isSelected -> Primary
                    else -> Color.Transparent
                }
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = dayName,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = when {
                isSelected -> Color.Black
                else -> TextSecondary
            },
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = dayNumber,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = when {
                isSelected -> Color.Black
                else -> Color.White
            },
            textAlign = TextAlign.Center
        )

        // Today indicator dot
        if (isToday && !isSelected) {
            Spacer(modifier = Modifier.height(2.dp))
            Box(
                modifier = Modifier
                    .size(4.dp)
                    .clip(CircleShape)
                    .background(Primary)
            )
        }
    }
}

private fun getDayAbbr(dayOfWeek: DayOfWeek): String = when (dayOfWeek) {
    DayOfWeek.MONDAY -> "Mon"
    DayOfWeek.TUESDAY -> "Tue"
    DayOfWeek.WEDNESDAY -> "Wed"
    DayOfWeek.THURSDAY -> "Thu"
    DayOfWeek.FRIDAY -> "Fri"
    DayOfWeek.SATURDAY -> "Sat"
    DayOfWeek.SUNDAY -> "Sun"
    else -> ""
}
