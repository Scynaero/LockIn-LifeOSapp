import { DatabaseService } from './DatabaseService';
import * as Crypto from 'expo-crypto';
import { DateUtils } from '../utils/DateUtils';

export interface Habit {
    id: string;
    name: string;
    type: 'build' | 'quit';
    unit: string;
    goal: number;
    frequency: any; // JSON string of days or 'daily'
    color: string;
    icon: string;
    freeze_inventory: number;
    streak_state: 'active' | 'frozen' | 'broken';
    current_streak: number;
    health_type?: string;
    description?: string;
    archived: boolean;
    order: number;
    reminder_time?: string;
    tags?: string;
    target_value: number;
    daily_logs?: string;
    completed_today: boolean; // Virtual field
    completed_value?: number; // Virtual field
    frozen_today?: boolean; // Virtual field
    archived_at?: string;
    created_at?: string;
}

export const HabitService = {
    createHabit: async (
        name: string,
        type: 'build' | 'quit',
        unit: string,
        goal: number,
        frequency: string[] | 'daily',
        color: string,
        icon: string,
        description?: string,
        target_value: number = 1,
        health_type?: string,
        startDate?: string
    ) => {
        const db = DatabaseService.getDB();
        const id = Crypto.randomUUID();
        const freqString = JSON.stringify(frequency);

        // Get max order
        const maxOrderRes = await db.getFirstAsync<{ maxOrd: number }>('SELECT MAX("order") as maxOrd FROM habits');
        const nextOrder = (maxOrderRes?.maxOrd ?? 0) + 1;

        // Use provided startDate or default to today
        const created_at = startDate || DateUtils.getTodayDateString();

        await db.runAsync(
            `INSERT INTO habits (id, name, type, unit, goal, frequency, color, icon, description, freeze_inventory, streak_state, current_streak, archived, "order", target_value, created_at, health_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 3, 'active', 0, 0, ?, ?, ?, ?)`,
            [id, name, type, unit, goal, freqString, color, icon, description || null, nextOrder, target_value, created_at, health_type || null]
        );

        return id;
    },

    updateHabit: async (habitId: string, updates: Partial<Habit> & { icon_color?: string }) => {
        const db = DatabaseService.getDB();

        const fields: string[] = [];
        const values: any[] = [];

        if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
        if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
        if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
        if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }
        if ((updates as any).icon_color !== undefined) { fields.push('icon_color = ?'); values.push((updates as any).icon_color); }
        if (updates.reminder_time !== undefined) { fields.push('reminder_time = ?'); values.push(updates.reminder_time); }
        if (updates.frequency !== undefined) { fields.push('frequency = ?'); values.push(JSON.stringify(updates.frequency)); }
        if (updates.archived !== undefined) { fields.push('archived = ?'); values.push(updates.archived ? 1 : 0); }
        if (updates.archived_at !== undefined) { fields.push('archived_at = ?'); values.push(updates.archived_at); }

        if (fields.length === 0) return;

        values.push(habitId);

        await db.runAsync(
            `UPDATE habits SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    },

    updateHabitOrders: async (orderedHabits: { id: string }[]) => {
        const db = DatabaseService.getDB();
        // Batch update order
        for (let i = 0; i < orderedHabits.length; i++) {
            await db.runAsync('UPDATE habits SET "order" = ? WHERE id = ?', [i, orderedHabits[i].id]);
        }
    },

    reorderHabit: async (habitId: string, direction: 'up' | 'down') => {
        const db = DatabaseService.getDB();

        // 1. Get all active habits sorted by order
        const allHabits = await db.getAllAsync<{ id: string, "order": number }>('SELECT id, "order" FROM habits WHERE archived = 0 ORDER BY "order" ASC');

        const index = allHabits.findIndex(h => h.id === habitId);
        if (index === -1) return;

        const current = allHabits[index];
        let targetIndex = -1;

        if (direction === 'up') {
            if (index > 0) targetIndex = index - 1;
        } else {
            if (index < allHabits.length - 1) targetIndex = index + 1;
        }

        if (targetIndex !== -1) {
            const target = allHabits[targetIndex];

            // Swap orders
            await db.runAsync('UPDATE habits SET "order" = ? WHERE id = ?', [target.order, current.id]);
            await db.runAsync('UPDATE habits SET "order" = ? WHERE id = ?', [current.order, target.id]);
        }
    },

    migrateColors: async () => {
        const db = DatabaseService.getDB();
        try { await db.runAsync('ALTER TABLE habits ADD COLUMN archived_at TEXT'); } catch (e) { }
        try { await db.runAsync('ALTER TABLE habits ADD COLUMN created_at TEXT'); } catch (e) { }
        try { await db.runAsync('ALTER TABLE habits ADD COLUMN icon_color TEXT'); } catch (e) { }

        await db.runAsync("UPDATE habits SET color = '#CCFF00' WHERE type = 'build' AND color != '#CCFF00'");
        await db.runAsync("UPDATE habits SET color = '#FF4545' WHERE type = 'quit' AND color != '#FF4545'");

        // Backfill created_at if null (Default to today so we don't assume past existence for fresh installs)
        await db.runAsync('UPDATE habits SET created_at = ? WHERE created_at IS NULL', [DateUtils.getTodayDateString()]);
    },

    getHabits: async (date?: string): Promise<Habit[]> => {
        const db = DatabaseService.getDB();

        // Auto-Freeze Gaps (Unlimited Policy)
        const requestDate = date || DateUtils.getTodayDateString();
        if (requestDate === DateUtils.getTodayDateString()) {
            const activeForCheck = await db.getAllAsync<{ id: string }>('SELECT id FROM habits WHERE archived = 0');
            for (const h of activeForCheck) {
                await HabitService.autoFreezeGaps(h.id);
            }
        }

        const targetDate = requestDate;

        // Show habits that have been created on or before the target date
        // AND are either active OR archived after the target date
        const result = await db.getAllAsync<Habit & { target_log_id: string, target_log_value: number, target_freeze_id: string }>(`
            SELECT h.*, l.id as target_log_id, l.value as target_log_value, f.id as target_freeze_id
            FROM habits h
            LEFT JOIN logs l ON h.id = l.habit_id AND l.date = ?
            LEFT JOIN streak_freezes f ON h.id = f.habit_id AND f.date = ?
            WHERE (h.created_at <= ?)
              AND (h.archived = 0 OR (h.archived = 1 AND h.archived_at > ?))
            ORDER BY h."order" ASC
        `, [targetDate, targetDate, targetDate, targetDate]);

        const habits = await Promise.all(result.map(async h => ({
            ...h,
            archived: Boolean(h.archived),
            frequency: JSON.parse(h.frequency as any),
            completed_today: !!h.target_log_id,
            completed_value: h.target_log_value || 0,
            frozen_today: !!h.target_freeze_id,
            // Virtual Streak: Use DB value if today, else calculate
            current_streak: targetDate === DateUtils.getTodayDateString()
                ? h.current_streak
                : await HabitService.calculateStreakForDate(h.id, targetDate),
            recent_history: await HabitService.getRecentHistory(h.id, targetDate, h.created_at || targetDate)
        })));

        return habits;
    },

    logCompletion: async (habitId: string, date: string, value: number, note?: string) => {
        const db = DatabaseService.getDB();
        const id = Crypto.randomUUID();
        const timestamp = Date.now();

        // Check if already logged for this date
        const existing = await db.getFirstAsync<{ id: string, value: number }>('SELECT id, value FROM logs WHERE habit_id = ? AND date = ?', [habitId, date]);

        if (existing) {
            // Logic: If it exists, and user taps again, are we adding progress or toggling off?
            // "Widget" Logic:
            // If target_value == 1 (Boolean habit): Toggle Off.
            // If target_value > 1 (Quantitative): Add value?
            // For now, consistent toggle behavior for boolean.

            // Fetch habit to check target value
            const habit = await db.getFirstAsync<{ target_value: number }>('SELECT target_value FROM habits WHERE id = ?', [habitId]);
            const target = habit?.target_value || 1;

            if (target === 1) {
                // Boolean toggle off
                await db.runAsync('DELETE FROM logs WHERE id = ?', [existing.id]);
                // Remove XP? Maybe complex to track. Let's strictly add XP on complete, maybe remove on toggle off?
                // For simplicity, we won't deduct XP to avoid negative reinforcement anxiety,
                // OR we deduct to prevent farming. Let's deduct.
                await HabitService.addXP(-10);
            } else {
                // Quantitative: Add to existing? Or remove if full?
                // For MVP reliability, let's treat "tap" on home as "Toggle Complete/Incomplete"
                // If logs exist, delete all for today.
                await db.runAsync('DELETE FROM logs WHERE habit_id = ? AND date = ?', [habitId, date]);
                await HabitService.addXP(-10);
            }
        } else {
            // Create log
            // For quantitative, we log the FULL GOAL value on a simple tap.
            await db.runAsync(
                `INSERT INTO logs (id, habit_id, date, value, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
                [id, habitId, date, value, note || null, timestamp]
            );

            // Auto-remove any freeze record for this date since it's now completed
            await db.runAsync('DELETE FROM streak_freezes WHERE habit_id = ? AND date = ?', [habitId, date]);

            await HabitService.addXP(10);
        }

        // recalculate streak
        await HabitService.calculateStreak(habitId);
    },

    archiveHabit: async (habitId: string) => {
        // "Archive" with timestamp
        await HabitService.updateHabit(habitId, {
            archived: true,
            archived_at: new Date().toISOString().split('T')[0]
        });
    },

    deleteHabit: async (habitId: string) => {
        const db = DatabaseService.getDB();
        await db.runAsync('DELETE FROM logs WHERE habit_id = ?', [habitId]);
        await db.runAsync('DELETE FROM habits WHERE id = ?', [habitId]);
    },

    getArchivedHabits: async (): Promise<Habit[]> => {
        const db = DatabaseService.getDB();
        const result = await db.getAllAsync<Habit>('SELECT * FROM habits WHERE archived = 1 ORDER BY archived_at DESC');
        return result.map(h => ({
            ...h,
            archived: Boolean(h.archived),
            frequency: typeof h.frequency === 'string' ? JSON.parse(h.frequency) : h.frequency,
            completed_today: false
        }));
    },

    restoreHabit: async (habitId: string) => {
        const db = DatabaseService.getDB();
        await db.runAsync('UPDATE habits SET archived = 0, archived_at = NULL WHERE id = ?', [habitId]);
    },

    resetAllData: async () => {
        const db = DatabaseService.getDB();
        // Option 1: Delete all logs (preserve habits)
        await db.runAsync('DELETE FROM logs');
        // Option 2: Reset streaks
        await db.runAsync('UPDATE habits SET current_streak = 0, streak_state = "active"');
    },


    resetHabitProgress: async (habitId: string) => {
        const db = DatabaseService.getDB();
        await db.runAsync('DELETE FROM logs WHERE habit_id = ?', [habitId]);
        await db.runAsync('UPDATE habits SET current_streak = 0, streak_state = "active" WHERE id = ?', [habitId]);
    },

    // Auto-fill missing days with freezes (Unlimited Strategy)
    autoFreezeGaps: async (habitId: string) => {
        const db = DatabaseService.getDB();
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = DateUtils.getDateString(yesterdayDate);

        // Get Habit Info (Created At)
        const habit = await db.getFirstAsync<{ created_at: string }>('SELECT created_at FROM habits WHERE id = ?', [habitId]);
        if (!habit || !habit.created_at) return; // Can't calc gaps without creation date logic

        // 1. Get all history
        const logs = await db.getAllAsync<{ date: string }>('SELECT date FROM logs WHERE habit_id = ?', [habitId]);
        const freezes = await db.getAllAsync<{ date: string }>('SELECT date FROM streak_freezes WHERE habit_id = ?', [habitId]);

        const historyDates = new Set([...logs.map(l => l.date), ...freezes.map(f => f.date)]);
        const sorted = Array.from(historyDates).sort((a, b) => b.localeCompare(a));

        let lastActive = sorted.length > 0 ? sorted[0] : habit.created_at;

        // Safety: If lastActive is somehow BEFORE created_at (legacy data?), clamp it.
        // REVERTED: Do NOT clamp. Use the earliest history point if it exists. 
        // Only use created_at if NO history exists.
        // if (lastActive < habit.created_at) lastActive = habit.created_at;

        if (lastActive >= yesterday) return;

        let curr = new Date(lastActive);
        curr.setDate(curr.getDate() + 1);

        const gaps: string[] = [];
        const values: any[] = [];
        // Safety Limit: Don't fill more than 365 days
        let safety = 0;

        while (DateUtils.getDateString(curr) <= yesterday && safety < 365) {
            const dateStr = DateUtils.getDateString(curr);
            // Double check creation constraint (though logic above handles it)
            if (dateStr > habit.created_at && !historyDates.has(dateStr)) {
                gaps.push('(?, ?, ?, ?)');
                values.push(Crypto.randomUUID(), habitId, dateStr, Date.now());
            }
            curr.setDate(curr.getDate() + 1);
            safety++;
        }

        if (gaps.length > 0) {
            // Bulk Insert to prevent DB locking from loop
            const query = `INSERT INTO streak_freezes (id, habit_id, date, used_at) VALUES ${gaps.join(', ')}`;
            await db.runAsync(query, values);

            await db.runAsync('UPDATE habits SET streak_state = "frozen" WHERE id = ?', [habitId]);
            await HabitService.calculateStreak(habitId);
        }
    },

    freezeDate: async (habitId: string, date: string) => {
        const db = DatabaseService.getDB();
        // Check existence
        const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM logs WHERE habit_id = ? AND date = ?', [habitId, date]);
        if (existing) {
            await db.runAsync('DELETE FROM logs WHERE id = ?', [existing.id]); // Overwrite log
        }

        const existingFreeze = await db.getFirstAsync<{ id: string }>('SELECT id FROM streak_freezes WHERE habit_id = ? AND date = ?', [habitId, date]);
        if (!existingFreeze) {
            const freezeId = Crypto.randomUUID();
            await db.runAsync('INSERT INTO streak_freezes (id, habit_id, date, used_at) VALUES (?, ?, ?, ?)', [freezeId, habitId, date, Date.now()]);
        } else {
            // Toggle off?
            await db.runAsync('DELETE FROM streak_freezes WHERE id = ?', [existingFreeze.id]);
        }
        await HabitService.calculateStreak(habitId);
    },

    deleteFreezeRecord: async (habitId: string, date: string) => {
        const db = DatabaseService.getDB();
        await db.runAsync('DELETE FROM streak_freezes WHERE habit_id = ? AND date = ?', [habitId, date]);
        await HabitService.calculateStreak(habitId);
    },

    // Strict Streak Calculation (Fixes 29 days bug & Freeze Loop)
    calculateStreak: async (habitId: string) => {
        const db = DatabaseService.getDB();

        // Get logs
        const logsRes = await db.getAllAsync<{ date: string }>('SELECT DISTINCT date FROM logs WHERE habit_id = ?', [habitId]);
        // Get freezes
        const freezesRes = await db.getAllAsync<{ date: string }>('SELECT date FROM streak_freezes WHERE habit_id = ?', [habitId]);

        const logDates = new Set(logsRes.map(l => l.date));
        const validDates = new Set([...logsRes.map(l => l.date), ...freezesRes.map(f => f.date)]);
        const sortedDates = Array.from(validDates).sort((a, b) => b.localeCompare(a)); // Descending

        if (sortedDates.length === 0) {
            await db.runAsync('UPDATE habits SET current_streak = 0 WHERE id = ?', [habitId]);
            return;
        }

        let streak = 0;
        const today = DateUtils.getTodayDateString();
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = DateUtils.getDateString(yesterdayDate);

        const lastDate = sortedDates[0];
        let currentDateToCheck: Date;

        if (lastDate === today) {
            currentDateToCheck = new Date(); // Start checking from Today
        } else if (lastDate === yesterday) {
            currentDateToCheck = new Date();
            currentDateToCheck.setDate(currentDateToCheck.getDate() - 1); // Start checking from Yesterday
        } else {
            // Broken
            await db.runAsync('UPDATE habits SET current_streak = 0 WHERE id = ?', [habitId]);
            return;
        }

        // Loop
        while (true) {
            const expectedDate = DateUtils.getDateString(currentDateToCheck);
            if (validDates.has(expectedDate)) {
                // Only increment if it's a REAL log
                if (logDates.has(expectedDate)) {
                    streak++;
                }
                // If it's a freeze, we maintain continuity but don't increment
                currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
            } else {
                break;
            }
        }

        await db.runAsync(
            'UPDATE habits SET current_streak = ? WHERE id = ?',
            [streak, habitId]
        );
    },

    // Recalculate ALL streaks (Run on startup to fix legacy data)
    recalculateAllStreaks: async () => {
        const db = DatabaseService.getDB();
        const habits = await db.getAllAsync<{ id: string }>('SELECT id FROM habits WHERE archived = 0');
        for (const h of habits) {
            await HabitService.calculateStreak(h.id);
        }
    },

    // Strict "Perfect Day" Heatmap Logic
    // Individual Habit Heatmap (For Detail Screen)
    // Individual Habit History (Detailed)
    getHabitHistory: async (habitId: string): Promise<{ date: string; value: number; used_at?: number }[]> => {
        const db = DatabaseService.getDB();

        // Get Logs (Value 1)
        const logs = await db.getAllAsync<{ date: string, timestamp: number }>(
            'SELECT date, timestamp FROM logs WHERE habit_id = ?',
            [habitId]
        );

        // Get Freezes (Value 2) with used_at
        const freezes = await db.getAllAsync<{ date: string, used_at: number }>(
            'SELECT date, used_at FROM streak_freezes WHERE habit_id = ?',
            [habitId]
        );

        const history: { date: string; value: number; used_at?: number }[] = [];

        // Priority: Logs overwrite Freezes if they exist on the same day (technically shouldn't happen with current logic, but safe to handle)
        // We can just merge.

        const logDates = new Set(logs.map(l => l.date));

        logs.forEach(l => {
            history.push({ date: l.date, value: 1, used_at: l.timestamp });
        });

        freezes.forEach(f => {
            if (!logDates.has(f.date)) {
                history.push({ date: f.date, value: 2, used_at: f.used_at });
            }
        });

        // Sort by date descending
        return history.sort((a, b) => b.date.localeCompare(a.date));
    },

    getHeatmapData: async (): Promise<Record<string, number>> => {
        const db = DatabaseService.getDB();

        // 1. Get all habits with timelines
        const allHabits = await db.getAllAsync<{ id: string, created_at: string, archived: number, archived_at: string }>(
            'SELECT id, created_at, archived, archived_at FROM habits'
        );

        if (allHabits.length === 0) return {};

        // 2. Get activity counts (Logs & Freezes)
        // Group by Date.
        // We really need to know: For each date, did we log or freeze?
        // And was it enough to cover "Total Due" for THAT date?

        const logs = await db.getAllAsync<{ date: string, count: number }>(`
            SELECT date, COUNT(DISTINCT habit_id) as count FROM logs GROUP BY date
        `);
        const freezes = await db.getAllAsync<{ date: string, count: number }>(`
            SELECT date, COUNT(DISTINCT habit_id) as count FROM streak_freezes GROUP BY date
        `);

        // Consolidate activity dates
        const activityDates = new Set([...logs.map(l => l.date), ...freezes.map(f => f.date)]);

        // Map logs for quick lookup (to distinguish Blue vs Green)
        const logMap: Record<string, number> = {};
        logs.forEach(l => { logMap[l.date] = l.count; });

        // Map combined unique participation per date
        // Note: logs.count is unique habits logged. freezes.count is unique habits frozen.
        // Overlaps? `SELECT date, COUNT(DISTINCT habit_id) FROM (UNION)` is better for "Total Complete".
        const totalActivity = await db.getAllAsync<{ date: string, count: number }>(`
            SELECT date, COUNT(DISTINCT habit_id) as count 
            FROM (
                SELECT habit_id, date FROM logs
                UNION
                SELECT habit_id, date FROM streak_freezes
            )
            GROUP BY date
        `);

        const activityMap: Record<string, number> = {};
        totalActivity.forEach(a => { activityMap[a.date] = a.count; });

        const map: Record<string, number> = {};

        activityDates.forEach(date => {
            // Calculate Denominator for THIS date
            const dueHabits = allHabits.filter(h => {
                const created = h.created_at || '2024-01-01'; // Robust fallback
                const isActive = (!h.archived || (h.archived && h.archived_at > date));
                return (date >= created) && isActive;
            });

            const totalDue = dueHabits.length;

            if (totalDue > 0) {
                const doneCount = activityMap[date] || 0;

                if (doneCount >= totalDue) {
                    // Perfect Day. Color?
                    const logsCount = logMap[date] || 0;
                    if (logsCount === 0) {
                        map[date] = 2; // All Frozen (Blue)
                    } else {
                        map[date] = 1; // Mixed/Logged (Green)
                    }
                }
            }
        });

        return map;
    },

    // Generic Streak Calculator for ANY date (Read-Only, does not write to DB)
    calculateStreakForDate: async (habitId: string, referenceDate: string): Promise<number> => {
        const db = DatabaseService.getDB();
        const logsRes = await db.getAllAsync<{ date: string }>('SELECT DISTINCT date FROM logs WHERE habit_id = ? AND date <= ?', [habitId, referenceDate]);
        const freezesRes = await db.getAllAsync<{ date: string }>('SELECT date FROM streak_freezes WHERE habit_id = ? AND date <= ?', [habitId, referenceDate]);

        const logDates = new Set(logsRes.map(l => l.date));
        const validDates = new Set([...logsRes.map(l => l.date), ...freezesRes.map(f => f.date)]);
        const sortedDates = Array.from(validDates).sort((a, b) => b.localeCompare(a));

        if (sortedDates.length === 0) return 0;

        let streak = 0;
        let currentDateToCheck = new Date(referenceDate);
        const refStr = referenceDate;

        // Initial Check
        const lastDate = sortedDates[0];

        if (lastDate === refStr) {
            // Start checking from reference (Today)
        } else {
            const yCheck = new Date(referenceDate);
            yCheck.setDate(yCheck.getDate() - 1);
            const yStr = DateUtils.getDateString(yCheck);

            if (lastDate === yStr) {
                currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
            } else {
                return 0;
            }
        }

        while (true) {
            const expectedDate = DateUtils.getDateString(currentDateToCheck);
            if (validDates.has(expectedDate)) {
                if (logDates.has(expectedDate)) {
                    streak++;
                }
                currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    },

    getStats: async (date?: string): Promise<{ currentStreak: number, completionRate: number, breakdown: { build: number, quit: number, frozen: number, total: number } }> => {
        const db = DatabaseService.getDB();
        const targetDate = date || DateUtils.getTodayDateString();

        // 1. Get Denominator (Active Habits for this date, respecting creation)
        const habits = await db.getAllAsync<{ id: string, type: string }>(`
            SELECT id, type FROM habits 
            WHERE (created_at <= ?) AND (archived = 0 OR (archived = 1 AND archived_at > ?))
        `, [targetDate, targetDate]);

        const totalHabits = habits.length;
        if (totalHabits === 0) return { currentStreak: 0, completionRate: 0, breakdown: { build: 0, quit: 0, frozen: 0, total: 0 } };

        const validHabitIds = new Set(habits.map(h => h.id));

        // Logs
        const logs = await db.getAllAsync<{ type: string, habit_id: string }>(`
            SELECT DISTINCT h.type, l.habit_id
            FROM logs l 
            JOIN habits h ON l.habit_id = h.id 
            WHERE l.date = ?
        `, [targetDate]);

        // Freezes
        const freezes = await db.getAllAsync<{ habit_id: string }>(`
            SELECT DISTINCT habit_id FROM streak_freezes WHERE date = ?
        `, [targetDate]);

        let build = 0;
        let quit = 0;
        const loggedIds = new Set<string>();

        logs.forEach(l => {
            if (validHabitIds.has(l.habit_id)) {
                loggedIds.add(l.habit_id);
                if (l.type === 'build') build++;
                else quit++;
            }
        });

        let frozenCount = 0;
        freezes.forEach(f => {
            if (validHabitIds.has(f.habit_id) && !loggedIds.has(f.habit_id)) {
                frozenCount++;
            }
        });

        const totalDone = build + quit + frozenCount;
        // Clamp totalDone to totalHabits (just in case)
        const effectiveTotalDone = Math.min(totalDone, totalHabits);

        const rate = Math.round((effectiveTotalDone / totalHabits) * 100);

        // Global Streak
        const heatmap = await HabitService.getHeatmapData();
        let streak = 0;
        const checkDate = new Date(targetDate);
        const dateStr = checkDate.toISOString().split('T')[0];

        // Current Day Check
        if ((heatmap[dateStr] || 0) > 0) {
            streak = 1;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            checkDate.setDate(checkDate.getDate() - 1);
            const yStr = DateUtils.getDateString(checkDate);
            if ((heatmap[yStr] || 0) > 0) {
                // continued from yesterday
            } else {
                return { currentStreak: 0, completionRate: rate, breakdown: { build, quit, frozen: frozenCount, total: totalHabits } };
            }
        }

        // Backward Loop
        for (let i = 0; i < 365; i++) {
            const d = DateUtils.getDateString(checkDate);
            if ((heatmap[d] || 0) > 0) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return {
            currentStreak: streak,
            completionRate: rate,
            breakdown: {
                build,
                quit,
                frozen: frozenCount,
                total: totalHabits
            }
        };
    },

    // --- Gamification ---
    getUserXP: async (): Promise<{ xp: number, level: number }> => {
        const db = DatabaseService.getDB();
        const xpRes = await db.getFirstAsync<{ value: string }>('SELECT value FROM user_meta WHERE key = ?', ['xp']);
        const xp = parseInt(xpRes?.value || '0');

        // Level Formula: Level = Floor(Sqrt(XP / 100)) + 1
        // XP Needed for Level L: 100 * (L-1)^2
        // Level 1: 0-99
        // Level 2: 100-399
        // Level 3: 400-899
        const level = Math.floor(Math.sqrt(xp / 100)) + 1;

        return { xp, level };
    },

    addXP: async (amount: number) => {
        const db = DatabaseService.getDB();
        const current = await HabitService.getUserXP();
        const newXP = current.xp + amount;

        await db.runAsync(`
            INSERT INTO user_meta (key, value) VALUES ('xp', ?)
            ON CONFLICT(key) DO UPDATE SET value = ?
        `, [newXP.toString(), newXP.toString()]);

        return newXP;
    },

    // --- Weekly History helper ---
    getRecentHistory: async (habitId: string, referenceDate: string, createdAt: string): Promise<number[]> => { // 0=None, 1=Done, 2=Frozen
        const db = DatabaseService.getDB();
        const history: number[] = [];

        // Calculate the start of the week (Monday) for the reference date
        // This aligns with the CalendarStrip component
        const refDate = new Date(referenceDate);
        const dayOfWeek = refDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust so Monday = 0
        const weekStart = new Date(refDate);
        weekStart.setDate(refDate.getDate() - daysFromMonday);

        // Get the 7 days of the week (Mon-Sun)
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(weekStart);
            checkDate.setDate(weekStart.getDate() + i);
            const dStr = DateUtils.getDateString(checkDate);

            // If this date is before the habit was created, show as empty
            if (dStr < createdAt) {
                history.push(0);
                continue;
            }

            // Check Log
            const log = await db.getFirstAsync('SELECT id FROM logs WHERE habit_id = ? AND date = ?', [habitId, dStr]);
            if (log) {
                history.push(1); // Done
            } else {
                // Check Freeze
                const freeze = await db.getFirstAsync('SELECT id FROM streak_freezes WHERE habit_id = ? AND date = ?', [habitId, dStr]);
                if (freeze) {
                    history.push(2); // Frozen
                } else {
                    history.push(0); // Missed/Nothing
                }
            }
        }
        return history;
    },

    // HealthKit Integration Methods
    getHealthKitHabits: async (): Promise<Habit[]> => {
        const db = DatabaseService.getDB();
        const habits = await db.getAllAsync<Habit>(
            'SELECT * FROM habits WHERE health_type IS NOT NULL AND archived = 0'
        );
        return habits;
    },

    syncHealthKitData: async (date?: string): Promise<{ synced: number, errors: string[] }> => {
        const { getHealthKitService } = require('./MockHealthKitService');
        const HealthKit = getHealthKitService();

        const targetDate = date || DateUtils.getTodayDateString();
        const healthHabits = await HabitService.getHealthKitHabits();

        let syncedCount = 0;
        const errors: string[] = [];

        for (const habit of healthHabits) {
            try {
                const db = DatabaseService.getDB();
                const existingLog = await db.getFirstAsync<{ id: string, value: number }>(
                    'SELECT id, value FROM logs WHERE habit_id = ? AND date = ?',
                    [habit.id, targetDate]
                );

                if (existingLog && existingLog.value > 0) {
                    continue;
                }

                let healthValue = 0;
                switch (habit.health_type) {
                    case 'steps':
                        healthValue = await HealthKit.getSteps(targetDate);
                        break;
                    case 'sleep':
                        const sleepMinutes = await HealthKit.getSleepMinutes(targetDate);
                        healthValue = sleepMinutes / 60;
                        break;
                    case 'water':
                        healthValue = await HealthKit.getWater(targetDate);
                        break;
                    case 'calories':
                        healthValue = await HealthKit.getActiveCalories?.(targetDate) || 0;
                        break;
                    case 'workout':
                        healthValue = await HealthKit.getWorkoutMinutes?.(targetDate) || 0;
                        break;
                    default:
                        continue;
                }

                if (healthValue >= habit.goal) {
                    if (existingLog) {
                        await db.runAsync(
                            'UPDATE logs SET value = ? WHERE id = ?',
                            [healthValue, existingLog.id]
                        );
                    } else {
                        const logId = Crypto.randomUUID();
                        await db.runAsync(
                            'INSERT INTO logs (id, habit_id, date, value, timestamp) VALUES (?, ?, ?, ?, ?)',
                            [logId, habit.id, targetDate, healthValue, Date.now()]
                        );
                    }
                    syncedCount++;
                }
            } catch (error) {
                errors.push(`${habit.name}: ${error}`);
                console.error(`[HealthKit Sync] Error syncing ${habit.name}:`, error);
            }
        }

        console.log(`[HealthKit Sync] Synced ${syncedCount} habits, ${errors.length} errors`);
        return { synced: syncedCount, errors };
    }
};
