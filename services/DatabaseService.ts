import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const db = SQLite.openDatabaseSync('lockin.db');

export const DatabaseService = {
  init: async () => {
    try {
      if (Platform.OS === 'web') {
        return;
      }

      // Enable Write-Ahead Logging to reduce locking
      await db.execAsync('PRAGMA journal_mode = WAL');
      await db.execAsync('PRAGMA foreign_keys = ON');

      // Habits Table (Schema 2.0)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS habits (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          type TEXT CHECK(type IN ('build', 'quit')) NOT NULL,
          unit TEXT NOT NULL,
          goal REAL NOT NULL,
          frequency TEXT NOT NULL,
          color TEXT NOT NULL,
          icon TEXT NOT NULL,
          freeze_inventory INTEGER DEFAULT 3,
          streak_state TEXT DEFAULT 'active' CHECK(streak_state IN ('active', 'frozen', 'broken')),
          current_streak INTEGER DEFAULT 0,
          health_type TEXT,
          description TEXT,
          archived INTEGER DEFAULT 0,
          "order" INTEGER DEFAULT 0,
          reminder_time TEXT,
          tags TEXT,
          target_value INTEGER DEFAULT 1,
          daily_logs TEXT
        );
      `);

      // Migrations for existing devices
      try {
        await db.execAsync('ALTER TABLE habits ADD COLUMN description TEXT;');
      } catch (e) { }

      try {
        await db.execAsync('ALTER TABLE habits ADD COLUMN reminder_time TEXT;');
      } catch (e) { }

      try {
        await db.execAsync('ALTER TABLE habits ADD COLUMN tags TEXT;');
      } catch (e) { }

      try {
        await db.execAsync('ALTER TABLE habits ADD COLUMN target_value INTEGER DEFAULT 1;');
      } catch (e) { }

      try {
        await db.execAsync('ALTER TABLE habits ADD COLUMN daily_logs TEXT;');
      } catch (e) { }

      // Logs Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS logs (
          id TEXT PRIMARY KEY NOT NULL,
          habit_id TEXT NOT NULL,
          date TEXT NOT NULL,
          value REAL NOT NULL,
          note TEXT,
          timestamp INTEGER,
          FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
        );
      `);

      // Streak Freezes Table (Schema 3.0)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS streak_freezes (
            id TEXT PRIMARY KEY NOT NULL,
            habit_id TEXT NOT NULL,
            date TEXT NOT NULL,
            used_at INTEGER,
            FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
        );
      `);

      // Notes Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT NOT NULL,
          is_pinned INTEGER DEFAULT 0,
          habit_id TEXT,
          log_id TEXT,
          reminder_time TEXT,
          is_deleted INTEGER DEFAULT 0,
          FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
        );
      `);

      try {
        await db.execAsync('ALTER TABLE notes ADD COLUMN reminder_time TEXT;');
      } catch (e) { }

      try {
        await db.execAsync('ALTER TABLE notes ADD COLUMN is_deleted INTEGER DEFAULT 0;');
      } catch (e) { }

      // Migration for is_deleted (re-checking for robustness, though already in CREATE TABLE and try-catch)
      // This block is likely intended for older schemas that might not have 'is_deleted'
      try {
        const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(notes)');
        const hasIsDeleted = tableInfo.some(col => col.name === 'is_deleted');
        if (!hasIsDeleted) {
          await db.runAsync('ALTER TABLE notes ADD COLUMN is_deleted INTEGER DEFAULT 0');
        }
      } catch (e) {
        console.warn("Migration for 'is_deleted' column on 'notes' table failed or not needed:", e);
      }

      // Migration for Voice, Theme, Location
      try {
        const tableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(notes)');
        const hasAudioUri = tableInfo.some(col => col.name === 'audio_uri');
        if (!hasAudioUri) {
          await db.runAsync('ALTER TABLE notes ADD COLUMN audio_uri TEXT');
          await db.runAsync('ALTER TABLE notes ADD COLUMN audio_duration INTEGER');
          await db.runAsync('ALTER TABLE notes ADD COLUMN color TEXT');
          await db.runAsync('ALTER TABLE notes ADD COLUMN location_text TEXT');
        }
      } catch (e) {
        console.warn("Migration for audio/theme/location columns on 'notes' table failed or not needed:", e);
      }

      // User Meta Table (for XP, Level, Milestones)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);

      // Expenses Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          date TEXT NOT NULL,
          note TEXT,
          is_recurring INTEGER DEFAULT 0
        );
      `);

      // Debts Table
      await db.execAsync(`
         CREATE TABLE IF NOT EXISTS debts (
          id TEXT PRIMARY KEY NOT NULL,
          person_name TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT CHECK(type IN ('owed_to_me', 'i_owe')) NOT NULL,
          status TEXT CHECK(status IN ('pending', 'paid')) DEFAULT 'pending',
          related_expense_id TEXT,
          date TEXT NOT NULL,
          FOREIGN KEY (related_expense_id) REFERENCES expenses (id) ON DELETE SET NULL
        );
      `);

      // Subscriptions Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          billing_cycle TEXT CHECK(billing_cycle IN ('monthly', 'yearly')) NOT NULL,
          next_billing_date TEXT NOT NULL
        );
      `);

      // --- Body Module Tables ---

      // Exercises Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS exercises (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          target_muscle TEXT NOT NULL,
          secondary_muscles TEXT,
          equipment TEXT NOT NULL,
          is_custom INTEGER DEFAULT 0
        );
      `);

      // Migration for secondary_muscles and data backfill
      try {
        const exerciseTableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(exercises)');
        if (!exerciseTableInfo.some(c => c.name === 'secondary_muscles')) {
          console.log('Adding secondary_muscles column...');
          await db.runAsync('ALTER TABLE exercises ADD COLUMN secondary_muscles TEXT');

          console.log('Backfilling exercise data...');
          const exercisesData = require('../assets/exercises.json');
          for (const exercise of exercisesData) {
            await db.runAsync(
              'UPDATE exercises SET secondary_muscles = ? WHERE id = ?',
              [JSON.stringify(exercise.secondary_muscles || []), exercise.id]
            );
          }
          console.log('Exercise data backfilled.');
        }
      } catch (e) {
        console.error('Migration for secondary_muscles failed:', e);
      }

      // Workouts Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS workouts (
          id TEXT PRIMARY KEY NOT NULL,
          date TEXT NOT NULL,
          name TEXT,
          duration_sec INTEGER DEFAULT 0,
          bodyweight REAL,
          status TEXT CHECK(status IN ('active', 'completed')) DEFAULT 'active',
          timer_start TEXT,
          is_timer_running INTEGER DEFAULT 0
        );
      `);

      // Migration for timer fields
      try {
        const workoutTableInfo = await db.getAllAsync<{ name: string }>('PRAGMA table_info(workouts)');
        if (!workoutTableInfo.some(c => c.name === 'timer_start')) {
          await db.runAsync('ALTER TABLE workouts ADD COLUMN timer_start TEXT');
          await db.runAsync('ALTER TABLE workouts ADD COLUMN is_timer_running INTEGER DEFAULT 0');
        }
      } catch (e) {
        console.error('Migration for workout timer failed:', e);
      }

      // Workout Sets Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS workout_sets (
          id TEXT PRIMARY KEY NOT NULL,
          workout_id TEXT NOT NULL,
          exercise_id TEXT NOT NULL,
          weight REAL NOT NULL,
          reps INTEGER NOT NULL,
          rpe REAL,
          is_completed INTEGER DEFAULT 0,
          type TEXT CHECK(type IN ('normal', 'warmup', 'drop', 'failure')) DEFAULT 'normal',
          FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE,
          FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
        );
      `);

      // Migration for is_completed
      try {
        await db.execAsync('ALTER TABLE workout_sets ADD COLUMN is_completed INTEGER DEFAULT 0;');
      } catch (e) { }

      // Sports Logs Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sports_logs(
        id TEXT PRIMARY KEY NOT NULL,
        activity_name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        duration_min INTEGER NOT NULL,
        calories REAL NOT NULL,
        met_value REAL NOT NULL
      );
      `);

      // Weight Logs Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS weight_logs (
          id TEXT PRIMARY KEY NOT NULL,
          weight REAL NOT NULL,
          date TEXT NOT NULL
        );
      `);

      // Seeding Exercises
      const exercisesData = require('../assets/exercises.json');
      const exercisesValues = await db.getAllAsync<{ count: number }>('SELECT count(*) as count FROM exercises');

      // Sync if we have more exercises in JSON than in DB (or if count is low)
      if (exercisesValues[0].count < exercisesData.length) {
        console.log(`Syncing exercises... DB: ${exercisesValues[0].count}, JSON: ${exercisesData.length}`);

        for (const exercise of exercisesData) {
          await db.runAsync(
            'INSERT OR IGNORE INTO exercises (id, name, target_muscle, secondary_muscles, equipment, is_custom) VALUES (?, ?, ?, ?, ?, ?)',
            [
              exercise.id,
              exercise.name,
              exercise.target_muscle,
              JSON.stringify(exercise.secondary_muscles || []),
              exercise.equipment,
              exercise.is_custom
            ]
          );
        }
        console.log('Exercises synced.');
      }

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  },

  getDB: () => db,
};
