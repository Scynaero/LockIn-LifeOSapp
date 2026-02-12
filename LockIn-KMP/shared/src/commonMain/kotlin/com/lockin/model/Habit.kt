package com.lockin.model

data class Habit(
    val id: String,
    val name: String,
    val type: String, // "build" or "quit"
    val unit: String,
    val goal: Double,
    val frequency: String, // JSON: "daily" or ["Mon","Tue"]
    val color: String,
    val icon: String,
    val freezeInventory: Int = 3,
    val streakState: String = "active", // "active", "frozen", "broken"
    val currentStreak: Int = 0,
    val healthType: String? = null,
    val description: String? = null,
    val archived: Boolean = false,
    val order: Int = 0,
    val reminderTime: String? = null,
    val tags: String? = null,
    val targetValue: Int = 1,
    val dailyLogs: String? = null,
    val archivedAt: String? = null,
    val createdAt: String? = null,
    val iconColor: String? = null,

    // Virtual computed fields
    val completedToday: Boolean = false,
    val completedValue: Double? = null,
    val frozenToday: Boolean = false,
    val recentHistory: List<Int> = emptyList() // 7-day: 0=empty, 1=logged, 2=frozen
)

data class HabitLog(
    val id: String,
    val habitId: String,
    val date: String,
    val value: Double,
    val note: String? = null,
    val timestamp: Long? = null
)

data class StreakFreeze(
    val id: String,
    val habitId: String,
    val date: String,
    val usedAt: Long? = null
)

data class HabitStats(
    val currentStreak: Int = 0,
    val completionRate: Double = 0.0,
    val breakdown: HabitBreakdown = HabitBreakdown()
)

data class HabitBreakdown(
    val build: Int = 0,
    val quit: Int = 0,
    val frozen: Int = 0,
    val total: Int = 0
)

data class UserXp(
    val xp: Int = 0,
    val level: Int = 1
)
