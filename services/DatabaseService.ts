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

      // User Meta Table (for XP, Level, Milestones)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user_meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  },

  getDB: () => db,
};
