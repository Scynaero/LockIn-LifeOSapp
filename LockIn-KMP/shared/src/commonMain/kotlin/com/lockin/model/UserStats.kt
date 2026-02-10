package com.lockin.model

data class UserStatsData(
    val id: String,
    val totalXp: Int = 0,
    val level: Int = 1,
    val currentStreak: Int = 0,
    val longestStreak: Int = 0,
    val totalWorkouts: Int = 0,
    val totalVolume: Double = 0.0
)
