package com.lockin.usecase.habit

import com.lockin.model.UserXp
import com.lockin.repository.HabitRepository

/**
 * XP & Leveling System (matches HabitService.ts:686-711)
 *
 * Level Formula: Level = Floor(Sqrt(XP / 100)) + 1
 * XP Needed for Level L: 100 * (L-1)^2
 *
 * Level progression:
 * - Level 1: 0-99 XP
 * - Level 2: 100-399 XP
 * - Level 3: 400-899 XP
 * - Level 4: 900-1599 XP
 * - Level 5: 1600-2499 XP
 *
 * XP is awarded/deducted:
 * - +10 XP for completing a habit
 * - -10 XP for un-completing (toggle off)
 * - XP never goes below 0
 */
class XpLevelingUseCase(private val habitRepo: HabitRepository) {

    /**
     * Get current XP and computed level.
     */
    fun getUserXp(): UserXp {
        return habitRepo.getUserXp()
    }

    /**
     * Add (or subtract) XP.
     * XP never goes below 0.
     *
     * @param amount Positive to add, negative to deduct
     * @return The new XP total
     */
    fun addXp(amount: Int): Int {
        return habitRepo.addXp(amount)
    }

    /**
     * Get the XP required to reach a specific level.
     * Formula: XP_needed = 100 * (level - 1)^2
     */
    fun xpForLevel(level: Int): Int {
        return 100 * (level - 1) * (level - 1)
    }

    /**
     * Get progress towards the next level as a percentage (0.0 to 1.0).
     */
    fun getProgressToNextLevel(): Float {
        val userXp = getUserXp()
        val currentLevelXp = xpForLevel(userXp.level)
        val nextLevelXp = xpForLevel(userXp.level + 1)
        val range = nextLevelXp - currentLevelXp
        if (range <= 0) return 1f
        val progress = userXp.xp - currentLevelXp
        return (progress.toFloat() / range.toFloat()).coerceIn(0f, 1f)
    }
}
