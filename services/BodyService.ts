import { DatabaseService } from './DatabaseService';
import * as Crypto from 'expo-crypto';

export interface Exercise {
    id: string;
    name: string;
    target_muscle: string;
    secondary_muscles?: string[];
    equipment: string;
    category_icon?: string;
    is_custom: number;
}

export interface Workout {
    id: string;
    date: string;
    name: string;
    duration_sec: number;
    bodyweight?: number;
    status: 'active' | 'completed';
    timer_start?: string;
    is_timer_running?: number;
}

export interface WorkoutSet {
    id: string;
    workout_id: string;
    exercise_id: string;
    weight: number;
    reps: number;
    rpe?: number;
    is_completed?: number;
    type: 'normal' | 'warmup' | 'drop' | 'failure';
}

export interface SportsLog {
    id: string;
    activity_name: string;
    start_time: string;
    duration_min: number;
    calories: number;
    met_value: number;
}

export const BodyService = {
    // --- Exercises ---
    getExercises: async (): Promise<Exercise[]> => {
        const db = DatabaseService.getDB();
        return await db.getAllAsync<Exercise>('SELECT * FROM exercises ORDER BY name ASC');
    },

    createCustomExercise: async (exercise: {
        name: string;
        target_muscle: string;
        secondary_muscles: string[];
        equipment: string;
    }): Promise<string> => {
        const db = DatabaseService.getDB();
        const id = Crypto.randomUUID();
        const secondaryMusclesJson = JSON.stringify(exercise.secondary_muscles);
        await db.runAsync(
            'INSERT INTO exercises (id, name, target_muscle, secondary_muscles, equipment, is_custom) VALUES (?, ?, ?, ?, ?, ?)',
            [id, exercise.name, exercise.target_muscle, secondaryMusclesJson, exercise.equipment, 1]
        );
        return id;
    },

    // --- Workouts ---
    startWorkout: async (name?: string, date?: string): Promise<string> => {
        const db = DatabaseService.getDB();
        const id = Crypto.randomUUID();
        const finalDate = date ? new Date(date).toISOString() : new Date().toISOString();
        const status = 'active'; // Logic: if past date, maybe 'completed'? For now always active then user 'finishes' it.
        await db.runAsync(
            'INSERT INTO workouts (id, date, name, status, duration_sec, is_timer_running) VALUES (?, ?, ?, ?, 0, 0)',
            [id, finalDate, name || 'New Workout', status]
        );
        return id;
    },

    getActiveWorkout: async (): Promise<Workout | null> => {
        const db = DatabaseService.getDB();
        return await db.getFirstAsync<Workout>("SELECT * FROM workouts WHERE status = 'active' ORDER BY date DESC LIMIT 1");
    },

    getWorkoutsForDate: async (dateStr: string): Promise<Workout[]> => {
        // dateStr is YYYY-MM-DD
        const db = DatabaseService.getDB();
        return await db.getAllAsync<Workout>(
            "SELECT * FROM workouts WHERE date LIKE ? ORDER BY date DESC",
            [`${dateStr}%`]
        );
    },

    finishWorkout: async (id: string, durationSec: number, bodyweight?: number): Promise<void> => {
        const db = DatabaseService.getDB();
        await db.runAsync(
            'UPDATE workouts SET status = ?, duration_sec = ?, bodyweight = ?, is_timer_running = 0, timer_start = NULL WHERE id = ?',
            ['completed', durationSec, bodyweight || null, id]
        );
    },

    toggleWorkoutTimer: async (id: string, shouldRun: boolean): Promise<void> => {
        const db = DatabaseService.getDB();
        if (shouldRun) {
            // Start Timer
            await db.runAsync(
                'UPDATE workouts SET is_timer_running = 1, timer_start = ? WHERE id = ?',
                [new Date().toISOString(), id]
            );
        } else {
            // Pause Timer
            const workout = await db.getFirstAsync<{ timer_start: string, duration_sec: number }>(
                'SELECT timer_start, duration_sec FROM workouts WHERE id = ?',
                [id]
            );

            if (workout && workout.timer_start) {
                const start = new Date(workout.timer_start).getTime();
                const now = new Date().getTime();
                const sessionSec = Math.floor((now - start) / 1000);
                const totalSec = (workout.duration_sec || 0) + sessionSec;

                await db.runAsync(
                    'UPDATE workouts SET is_timer_running = 0, timer_start = NULL, duration_sec = ? WHERE id = ?',
                    [totalSec, id]
                );
            } else {
                // Just ensuring consistency if state was weird
                await db.runAsync('UPDATE workouts SET is_timer_running = 0 WHERE id = ?', [id]);
            }
        }
    },

    resetWorkoutTimer: async (id: string): Promise<void> => {
        const db = DatabaseService.getDB();
        await db.runAsync(
            'UPDATE workouts SET is_timer_running = 0, timer_start = NULL, duration_sec = 0 WHERE id = ?',
            [id]
        );
    },

    getWorkoutsValues: async (): Promise<Workout[]> => {
        const db = DatabaseService.getDB();
        return await db.getAllAsync<Workout>('SELECT * FROM workouts ORDER BY date DESC');
    },

    // --- Sets ---
    addSet: async (workoutId: string, exerciseId: string, weight: number, reps: number, rpe?: number, type: string = 'normal'): Promise<string> => {
        const db = DatabaseService.getDB();
        const id = Crypto.randomUUID();
        await db.runAsync(
            'INSERT INTO workout_sets (id, workout_id, exercise_id, weight, reps, rpe, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, workoutId, exerciseId, weight, reps, rpe || null, type]
        );
        return id;
    },

    getSetsForWorkout: async (workoutId: string): Promise<(WorkoutSet & { exercise_name: string })[]> => {
        const db = DatabaseService.getDB();
        return await db.getAllAsync<(WorkoutSet & { exercise_name: string })>(`
            SELECT s.*, e.name as exercise_name 
            FROM workout_sets s
            JOIN exercises e ON s.exercise_id = e.id
            WHERE s.workout_id = ?
            ORDER BY s.id ASC
        `, [workoutId]);
    },

    deleteSet: async (id: string): Promise<void> => {
        const db = DatabaseService.getDB();
        await db.runAsync('DELETE FROM workout_sets WHERE id = ?', [id]);
    },

    updateSet: async (setId: string, updates: { weight?: number, reps?: number, is_completed?: boolean }) => {
        const db = DatabaseService.getDB();
        const fields = [];
        const values = [];

        if (updates.weight !== undefined) {
            fields.push('weight = ?');
            values.push(updates.weight);
        }
        if (updates.reps !== undefined) {
            fields.push('reps = ?');
            values.push(updates.reps);
        }
        if (updates.is_completed !== undefined) {
            fields.push('is_completed = ?');
            values.push(updates.is_completed ? 1 : 0);
        }

        if (fields.length === 0) return;

        values.push(setId);
        // @ts-ignore
        await db.runAsync(`UPDATE workout_sets SET ${fields.join(', ')} WHERE id = ?`, values);
    },

    // --- Sports ---
    logSport: async (activityName: string, durationMin: number, calories: number, metValue: number, date?: string): Promise<string> => {
        const db = DatabaseService.getDB();
        const id = Crypto.randomUUID();
        // Use provided date or now. Maps to start_time.
        const startTime = date ? new Date(date).toISOString() : new Date().toISOString();

        await db.runAsync(
            'INSERT INTO sports_logs (id, activity_name, start_time, duration_min, calories, met_value) VALUES (?, ?, ?, ?, ?, ?)',
            [id, activityName, startTime, durationMin, calories, metValue]
        );
        return id;
    },

    deleteSportLog: async (id: string): Promise<void> => {
        const db = DatabaseService.getDB();
        await db.runAsync('DELETE FROM sports_logs WHERE id = ?', [id]);
    },

    getSportsLogs: async (dateStr?: string): Promise<any[]> => {
        const db = DatabaseService.getDB();
        if (dateStr) {
            // Filter by date string (start_time starts with YYYY-MM-DD)
            return await db.getAllAsync('SELECT * FROM sports_logs WHERE start_time LIKE ? ORDER BY start_time DESC', [`${dateStr}%`]);
        }
        return await db.getAllAsync('SELECT * FROM sports_logs ORDER BY start_time DESC');
    },

    // --- Meta & Weight ---
    updateHeight: async (heightCm: number): Promise<void> => {
        const db = DatabaseService.getDB();
        await db.runAsync('INSERT OR REPLACE INTO user_meta (key, value) VALUES (?, ?)', ['height_cm', heightCm.toString()]);
    },

    getHeight: async (): Promise<number | null> => {
        const db = DatabaseService.getDB();
        const result = await db.getFirstAsync<{ value: string }>("SELECT value FROM user_meta WHERE key = 'height_cm'");
        return result ? parseFloat(result.value) : null;
    },

    logWeight: async (weight: number, date: string) => {
        const db = DatabaseService.getDB();
        const id = Crypto.randomUUID();
        // Upsert for day?
        const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM weight_logs WHERE date = ?', [date]);
        if (existing) {
            await db.runAsync('UPDATE weight_logs SET weight = ? WHERE id = ?', [weight, existing.id]);
        } else {
            await db.runAsync('INSERT INTO weight_logs (id, weight, date) VALUES (?, ?, ?)', [id, weight, date]);
        }
    },

    getWeightHistory: async () => {
        const db = DatabaseService.getDB();
        return await db.getAllAsync<{ date: string, weight: number }>('SELECT date, weight FROM weight_logs ORDER BY date ASC LIMIT 30');
    },

    getLatestWeight: async () => {
        const db = DatabaseService.getDB();
        const res = await db.getFirstAsync<{ weight: number }>('SELECT weight FROM weight_logs ORDER BY date DESC LIMIT 1');
        return res?.weight || 70;
    },

    getRecentMuscles: async (dateStr: string): Promise<string[]> => {
        const db = DatabaseService.getDB();
        const result = await db.getAllAsync<{ target_muscle: string }>(`
            SELECT DISTINCT e.target_muscle 
            FROM workout_sets s
            JOIN workouts w ON s.workout_id = w.id
            JOIN exercises e ON s.exercise_id = e.id
            WHERE w.status IN ('active', 'completed')
            AND w.date LIKE ?
        `, [`${dateStr}%`]);
        return result.map(r => r.target_muscle);
    },

    getMusclesForRange: async (days: number = 7): Promise<string[]> => {
        const db = DatabaseService.getDB();

        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        const dateLimitStr = dateLimit.toISOString();

        const result = await db.getAllAsync<{ target_muscle: string }>(`
            SELECT DISTINCT e.target_muscle 
            FROM workout_sets s
            JOIN workouts w ON s.workout_id = w.id
            JOIN exercises e ON s.exercise_id = e.id
            WHERE w.status IN ('active', 'completed')
            AND w.date >= ?
        `, [dateLimitStr]);
        return result.map(r => r.target_muscle);
    },

    getWorkoutsForRange: async (days: number): Promise<Workout[]> => {
        const db = DatabaseService.getDB();
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        const dateLimitStr = dateLimit.toISOString();

        return await db.getAllAsync<Workout>(
            "SELECT * FROM workouts WHERE date >= ? ORDER BY date DESC",
            [dateLimitStr]
        );
    },

    getVolumeForRange: async (days: number): Promise<number> => {
        const db = DatabaseService.getDB();
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        const dateLimitStr = dateLimit.toISOString();

        const result = await db.getFirstAsync<{ volume: number }>(`
            SELECT SUM(s.weight * s.reps) as volume 
            FROM workout_sets s 
            JOIN workouts w ON s.workout_id = w.id 
            WHERE w.date >= ? AND s.is_completed = 1
        `, [dateLimitStr]);
        return result?.volume || 0;
    },

    getVolumeForDate: async (dateStr: string): Promise<number> => {
        const db = DatabaseService.getDB();
        const result = await db.getFirstAsync<{ volume: number }>(`
            SELECT SUM(s.weight * s.reps) as volume 
            FROM workout_sets s 
            JOIN workouts w ON s.workout_id = w.id 
            WHERE w.date LIKE ? AND s.is_completed = 1
        `, [`${dateStr}%`]);
        return result?.volume || 0;
    },

    getMuscleSplit: async (days: number): Promise<{ name: string, val: number, count: number }[]> => {
        const db = DatabaseService.getDB();

        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        const dateLimitStr = dateLimit.toISOString();

        const result = await db.getAllAsync<{ target_muscle: string, count: number }>(`
            SELECT e.target_muscle, COUNT(*) as count 
            FROM workout_sets s 
            JOIN exercises e ON s.exercise_id = e.id 
            JOIN workouts w ON s.workout_id = w.id 
            WHERE w.date >= ? AND s.is_completed = 1 
            GROUP BY e.target_muscle
        `, [dateLimitStr]);

        const GROUPS: Record<string, string[]> = {
            Legs: ['Quads', 'Hamstrings', 'Calves', 'Glutes', 'Tibialis', 'Legs'],
            Arms: ['Biceps', 'Triceps', 'Forearms', 'Arms'],
            Back: ['Lats', 'Traps', 'LowerBack', 'Back'],
            Chest: ['Chest'],
            Shoulders: ['Shoulders', 'Delts', 'Rotator Cuff'],
            Core: ['Abs', 'Obliques', 'Core']
        };

        const groupCounts: Record<string, number> = {};

        // Initialize counts
        Object.keys(GROUPS).forEach(k => groupCounts[k] = 0);
        groupCounts['Other'] = 0;

        let totalSets = 0;

        result.forEach(r => {
            const muscle = r.target_muscle;
            let found = false;
            for (const [group, members] of Object.entries(GROUPS)) {
                if (members.includes(muscle) || members.map(m => m.toLowerCase()).includes(muscle.toLowerCase())) {
                    groupCounts[group] += r.count;
                    found = true;
                    break;
                }
            }
            if (!found) groupCounts['Other'] += r.count;
            totalSets += r.count;
        });

        // Always return all groups
        return Object.entries(groupCounts)
            .filter(([name]) => name !== 'Other' || groupCounts['Other'] > 0) // Only hide 'Other' if empty
            .map(([name, count]) => ({
                name,
                count,
                val: totalSets > 0 ? parseFloat((count / totalSets).toFixed(2)) : 0
            }))
            .sort((a, b) => b.val - a.val);
    }
};
