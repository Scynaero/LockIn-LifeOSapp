package com.lockin.repository

import com.lockin.db.LockinDatabase
import com.lockin.model.Habit
import com.lockin.model.HabitLog
import com.lockin.model.StreakFreeze
import com.lockin.model.UserXp
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn
import kotlinx.serialization.json.Json
import kotlin.math.floor
import kotlin.math.sqrt
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@OptIn(ExperimentalUuidApi::class)
class HabitRepository(private val database: LockinDatabase) {

    private val json = Json { ignoreUnknownKeys = true }

    fun getActiveHabits(dateStr: String): List<Habit> {
        val habits = database.habitsQueries.getActiveHabits().executeAsList()
        return habits.map { h ->
            val log = database.logsQueries.getLogForHabitOnDate(h.id, dateStr).executeAsOneOrNull()
            val freeze = database.streakFreezesQueries.getFreezeForHabitOnDate(h.id, dateStr).executeAsOneOrNull()

            // Compute recent 7-day history
            val today = LocalDate.parse(dateStr)
            val recentHistory = computeRecentHistory(h.id, today, h.created_at)

            Habit(
                id = h.id,
                name = h.name,
                type = h.type,
                unit = h.unit,
                goal = h.goal,
                frequency = h.frequency,
                color = h.color,
                icon = h.icon,
                freezeInventory = h.freeze_inventory.toInt(),
                streakState = h.streak_state,
                currentStreak = h.current_streak.toInt(),
                healthType = h.health_type,
                description = h.description,
                archived = h.archived != 0L,
                order = h.order_.toInt(),
                reminderTime = h.reminder_time,
                tags = h.tags,
                targetValue = h.target_value.toInt(),
                dailyLogs = h.daily_logs,
                archivedAt = h.archived_at,
                createdAt = h.created_at,
                iconColor = h.icon_color,
                completedToday = log != null,
                completedValue = log?.value_,
                frozenToday = freeze != null && log == null,
                recentHistory = recentHistory
            )
        }
    }

    fun getHabitById(id: String): Habit? {
        val h = database.habitsQueries.getHabitById(id).executeAsOneOrNull() ?: return null
        return Habit(
            id = h.id,
            name = h.name,
            type = h.type,
            unit = h.unit,
            goal = h.goal,
            frequency = h.frequency,
            color = h.color,
            icon = h.icon,
            freezeInventory = h.freeze_inventory.toInt(),
            streakState = h.streak_state,
            currentStreak = h.current_streak.toInt(),
            healthType = h.health_type,
            description = h.description,
            archived = h.archived != 0L,
            order = h.order_.toInt(),
            reminderTime = h.reminder_time,
            tags = h.tags,
            targetValue = h.target_value.toInt(),
            dailyLogs = h.daily_logs,
            archivedAt = h.archived_at,
            createdAt = h.created_at,
            iconColor = h.icon_color
        )
    }

    fun createHabit(
        name: String,
        type: String,
        unit: String,
        goal: Double,
        frequency: String,
        color: String,
        icon: String,
        description: String?,
        targetValue: Int,
        healthType: String?,
        startDate: String?
    ): String {
        val id = Uuid.random().toString()
        val maxOrder = database.habitsQueries.getMaxOrder().executeAsOneOrNull()?.MAX ?: 0
        val today = startDate ?: Clock.System.todayIn(TimeZone.currentSystemDefault()).toString()

        database.habitsQueries.insertHabit(
            id = id,
            name = name,
            type = type,
            unit = unit,
            goal = goal,
            frequency = frequency,
            color = color,
            icon = icon,
            freeze_inventory = 3,
            streak_state = "active",
            current_streak = 0,
            health_type = healthType,
            description = description,
            archived = 0,
            order_ = (maxOrder + 1),
            reminder_time = null,
            tags = null,
            target_value = targetValue.toLong(),
            daily_logs = null,
            archived_at = null,
            created_at = today,
            icon_color = null
        )
        return id
    }

    fun updateHabit(
        id: String,
        name: String,
        description: String?,
        color: String,
        icon: String,
        reminderTime: String?,
        frequency: String,
        iconColor: String?
    ) {
        database.habitsQueries.updateHabit(
            name = name,
            description = description,
            color = color,
            icon = icon,
            reminder_time = reminderTime,
            frequency = frequency,
            icon_color = iconColor,
            id = id
        )
    }

    fun updateHabitOrder(id: String, order: Int) {
        database.habitsQueries.updateHabitOrder(order_ = order.toLong(), id = id)
    }

    fun archiveHabit(id: String) {
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault()).toString()
        database.habitsQueries.archiveHabit(archived_at = today, id = id)
    }

    fun restoreHabit(id: String) {
        database.habitsQueries.restoreHabit(id)
    }

    fun deleteHabit(id: String) {
        database.habitsQueries.deleteHabit(id)
    }

    // --- Logs ---

    fun getLogForDate(habitId: String, date: String): HabitLog? {
        val log = database.logsQueries.getLogForHabitOnDate(habitId, date).executeAsOneOrNull()
            ?: return null
        return HabitLog(
            id = log.id,
            habitId = log.habit_id,
            date = log.date,
            value = log.value_,
            note = log.note,
            timestamp = log.timestamp
        )
    }

    fun getDistinctLogDates(habitId: String): Set<String> {
        return database.logsQueries.getDistinctLogDates(habitId).executeAsList().toSet()
    }

    fun insertLog(habitId: String, date: String, value: Double, note: String?) {
        val id = Uuid.random().toString()
        val timestamp = Clock.System.now().epochSeconds
        database.logsQueries.insertLog(
            id = id,
            habit_id = habitId,
            date = date,
            value_ = value,
            note = note,
            timestamp = timestamp
        )
    }

    fun deleteLogByDate(habitId: String, date: String) {
        database.logsQueries.deleteLogByHabitAndDate(habitId, date)
    }

    fun deleteAllLogsForHabit(habitId: String) {
        database.logsQueries.deleteAllLogsForHabit(habitId)
    }

    fun getLogCountForHabit(habitId: String): Long {
        return database.logsQueries.getLogCountForHabit(habitId).executeAsOne()
    }

    // --- Freezes ---

    fun getFreezeForDate(habitId: String, date: String): StreakFreeze? {
        val f = database.streakFreezesQueries.getFreezeForHabitOnDate(habitId, date)
            .executeAsOneOrNull() ?: return null
        return StreakFreeze(id = f.id, habitId = f.habit_id, date = f.date, usedAt = f.used_at)
    }

    fun getFreezeDates(habitId: String): Set<String> {
        return database.streakFreezesQueries.getFreezeDates(habitId).executeAsList().toSet()
    }

    fun getFreezesForHabit(habitId: String): List<StreakFreeze> {
        return database.streakFreezesQueries.getFreezesForHabit(habitId).executeAsList().map {
            StreakFreeze(id = it.id, habitId = it.habit_id, date = it.date, usedAt = it.used_at)
        }
    }

    fun insertFreeze(habitId: String, date: String) {
        val id = Uuid.random().toString()
        database.streakFreezesQueries.insertFreeze(
            id = id,
            habit_id = habitId,
            date = date,
            used_at = Clock.System.now().epochSeconds
        )
    }

    fun deleteFreezeByDate(habitId: String, date: String) {
        database.streakFreezesQueries.deleteFreezeByHabitAndDate(habitId, date)
    }

    fun deleteAllFreezesForHabit(habitId: String) {
        database.streakFreezesQueries.deleteAllFreezesForHabit(habitId)
    }

    // --- Streak ---

    fun updateStreak(habitId: String, streak: Int) {
        database.habitsQueries.updateStreak(current_streak = streak.toLong(), id = habitId)
    }

    fun updateStreakState(habitId: String, state: String) {
        database.habitsQueries.updateStreakState(streak_state = state, id = habitId)
    }

    // --- XP ---

    fun getUserXp(): UserXp {
        val xpStr = database.userMetaQueries.getValue("xp").executeAsOneOrNull() ?: "0"
        val xp = xpStr.toIntOrNull() ?: 0
        val level = floor(sqrt(xp.toDouble() / 100.0)).toInt() + 1
        return UserXp(xp = xp, level = level)
    }

    fun addXp(amount: Int): Int {
        val current = getUserXp().xp
        val newXp = maxOf(0, current + amount)
        database.userMetaQueries.upsert(key = "xp", value_ = newXp.toString())
        return newXp
    }

    // --- History ---

    fun getAllLogDates(): List<Triple<String, String, Double>> {
        return database.logsQueries.getAllLogDates().executeAsList().map {
            Triple(it.habit_id, it.date, it.value_)
        }
    }

    fun getAllHabits(): List<Habit> {
        return database.habitsQueries.getAllHabits().executeAsList().map { h ->
            Habit(
                id = h.id,
                name = h.name,
                type = h.type,
                unit = h.unit,
                goal = h.goal,
                frequency = h.frequency,
                color = h.color,
                icon = h.icon,
                freezeInventory = h.freeze_inventory.toInt(),
                streakState = h.streak_state,
                currentStreak = h.current_streak.toInt(),
                healthType = h.health_type,
                description = h.description,
                archived = h.archived != 0L,
                order = h.order_.toInt(),
                reminderTime = h.reminder_time,
                tags = h.tags,
                targetValue = h.target_value.toInt(),
                dailyLogs = h.daily_logs,
                archivedAt = h.archived_at,
                createdAt = h.created_at,
                iconColor = h.icon_color
            )
        }
    }

    fun getHabitHistory(habitId: String): Map<String, Int> {
        val logDates = getDistinctLogDates(habitId)
        val freezeDates = getFreezeDates(habitId)
        val result = mutableMapOf<String, Int>()
        logDates.forEach { result[it] = 1 }
        freezeDates.forEach { date ->
            if (date !in result) result[date] = 2
        }
        return result
    }

    // --- Private helpers ---

    private fun computeRecentHistory(
        habitId: String,
        referenceDate: LocalDate,
        createdAt: String?
    ): List<Int> {
        val result = mutableListOf<Int>()
        val createdDate = createdAt?.let { runCatching { LocalDate.parse(it) }.getOrNull() }

        // Get Monday of current week
        val dayOfWeek = referenceDate.dayOfWeek.ordinal // 0=Monday
        val monday = referenceDate.toEpochDays() - dayOfWeek

        for (i in 0..6) {
            val dayEpoch = monday + i
            val day = LocalDate.fromEpochDays(dayEpoch)
            val dateStr = day.toString()

            if (createdDate != null && day < createdDate) {
                result.add(0)
                continue
            }

            val log = database.logsQueries.getLogForHabitOnDate(habitId, dateStr).executeAsOneOrNull()
            val freeze = database.streakFreezesQueries.getFreezeForHabitOnDate(habitId, dateStr).executeAsOneOrNull()

            result.add(
                when {
                    log != null -> 1
                    freeze != null -> 2
                    else -> 0
                }
            )
        }
        return result
    }
}
