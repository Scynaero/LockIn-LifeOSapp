import { DatabaseService } from './DatabaseService';
import * as Crypto from 'expo-crypto';

export interface UserStats {
    id: string;
    total_xp: number;
    level: number;
    current_streak: number;
    longest_streak: number;
    total_workouts: number;
    total_volume: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    xp_reward: number;
    icon: string;
    unlocked_at?: string;
    progress?: number;
    target?: number;
}

export const GamificationService = {
    // --- User Stats ---
    getUserStats: async (): Promise<UserStats> => {
        const db = DatabaseService.getDB();
        let stats = await db.getFirstAsync<UserStats>('SELECT * FROM user_stats LIMIT 1');

        if (!stats) {
            // Initialize default stats
            const id = Crypto.randomUUID();
            await db.runAsync(
                'INSERT INTO user_stats (id, total_xp, level, current_streak, longest_streak, total_workouts, total_volume) VALUES (?, 0, 1, 0, 0, 0, 0)',
                [id]
            );
            stats = { id, total_xp: 0, level: 1, current_streak: 0, longest_streak: 0, total_workouts: 0, total_volume: 0 };
        }

        return stats;
    },

    addXP: async (amount: number): Promise<{ leveledUp: boolean, newLevel: number }> => {
        const db = DatabaseService.getDB();
        const stats = await GamificationService.getUserStats();
        const newXP = stats.total_xp + amount;
        const oldLevel = stats.level;
        const newLevel = GamificationService.calculateLevel(newXP);

        await db.runAsync(
            'UPDATE user_stats SET total_xp = ?, level = ? WHERE id = ?',
            [newXP, newLevel, stats.id]
        );

        return { leveledUp: newLevel > oldLevel, newLevel };
    },

    calculateLevel: (xp: number): number => {
        // Level formula: Level = floor(sqrt(XP / 100)) + 1
        // Level 1: 0-99 XP
        // Level 2: 100-399 XP
        // Level 3: 400-899 XP
        // etc.
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    },

    getXPForNextLevel: (currentLevel: number): number => {
        // XP needed for next level = (level^2) * 100
        return (currentLevel * currentLevel) * 100;
    },

    // --- Achievements ---
    getAchievements: async (): Promise<Achievement[]> => {
        const db = DatabaseService.getDB();
        const achievements = await db.getAllAsync<Achievement>('SELECT * FROM achievements ORDER BY unlocked_at DESC');

        // Calculate progress for locked achievements
        const stats = await GamificationService.getUserStats();

        return achievements.map(a => ({
            ...a,
            progress: GamificationService.calculateAchievementProgress(a, stats),
            target: GamificationService.getAchievementTarget(a)
        }));
    },

    unlockAchievement: async (achievementId: string): Promise<void> => {
        const db = DatabaseService.getDB();
        const achievement = await db.getFirstAsync<Achievement>('SELECT * FROM achievements WHERE id = ?', [achievementId]);

        if (!achievement || achievement.unlocked_at) return;

        const now = new Date().toISOString();
        await db.runAsync('UPDATE achievements SET unlocked_at = ? WHERE id = ?', [now, achievementId]);

        // Award XP
        await GamificationService.addXP(achievement.xp_reward);
    },

    calculateAchievementProgress: (achievement: Achievement, stats: UserStats): number => {
        // This would be customized based on achievement type
        // For now, return 0 for locked, 100 for unlocked
        return achievement.unlocked_at ? 100 : 0;
    },

    getAchievementTarget: (achievement: Achievement): number => {
        // Return target value based on achievement type
        return 100; // Default
    },

    // --- Workout XP Calculation ---
    calculateWorkoutXP: (volume: number, duration: number): number => {
        // Base XP: 10 per workout
        // Volume bonus: 1 XP per 100kg
        // Duration bonus: 1 XP per 5 minutes
        const baseXP = 10;
        const volumeXP = Math.floor(volume / 100);
        const durationXP = Math.floor(duration / 300); // duration in seconds

        return baseXP + volumeXP + durationXP;
    },

    awardWorkoutXP: async (volume: number, duration: number): Promise<number> => {
        const xp = GamificationService.calculateWorkoutXP(volume, duration);
        await GamificationService.addXP(xp);

        // Update total workouts
        const db = DatabaseService.getDB();
        await db.runAsync('UPDATE user_stats SET total_workouts = total_workouts + 1, total_volume = total_volume + ? WHERE id = (SELECT id FROM user_stats LIMIT 1)', [volume]);

        return xp;
    },

    // --- Streaks ---
    updateStreak: async (currentStreak: number): Promise<void> => {
        const db = DatabaseService.getDB();
        const stats = await GamificationService.getUserStats();
        const longestStreak = Math.max(stats.longest_streak, currentStreak);

        await db.runAsync(
            'UPDATE user_stats SET current_streak = ?, longest_streak = ? WHERE id = ?',
            [currentStreak, longestStreak, stats.id]
        );
    }
};
