package com.lockin.util

import kotlinx.datetime.*

object DateUtils {

    fun getTodayDateString(): String {
        return Clock.System.todayIn(TimeZone.currentSystemDefault()).toString()
    }

    fun getDateString(date: LocalDate): String {
        return date.toString() // "YYYY-MM-DD"
    }

    fun today(): LocalDate {
        return Clock.System.todayIn(TimeZone.currentSystemDefault())
    }

    fun yesterday(): LocalDate {
        return today().minus(1, DateTimeUnit.DAY)
    }

    fun parseDate(dateStr: String): LocalDate? {
        return try {
            LocalDate.parse(dateStr)
        } catch (e: Exception) {
            null
        }
    }

    fun getYearMonth(date: LocalDate): String {
        val month = date.monthNumber.toString().padStart(2, '0')
        return "${date.year}-$month"
    }

    fun getYearMonthFromString(dateStr: String): String {
        return dateStr.substring(0, 7) // "YYYY-MM"
    }

    fun getDayOfWeekName(date: LocalDate): String {
        return date.dayOfWeek.name.lowercase()
            .replaceFirstChar { it.uppercase() }
            .take(3) // "Mon", "Tue", etc.
    }

    fun getStartOfWeek(date: LocalDate): LocalDate {
        val dayOfWeek = date.dayOfWeek.ordinal // 0=Monday
        return LocalDate.fromEpochDays(date.toEpochDays() - dayOfWeek)
    }

    fun getWeekDates(referenceDate: LocalDate): List<LocalDate> {
        val monday = getStartOfWeek(referenceDate)
        return (0..6).map { monday.plus(it, DateTimeUnit.DAY) }
    }

    fun daysAgo(days: Int): LocalDate {
        return today().minus(days, DateTimeUnit.DAY)
    }

    fun formatMonthYear(month: Int, year: Int): String {
        val monthNames = listOf(
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        )
        return "${monthNames[month - 1]} $year"
    }

    fun isSameDay(date1: LocalDate, date2: LocalDate): Boolean {
        return date1 == date2
    }

    fun isToday(date: LocalDate): Boolean {
        return date == today()
    }
}
