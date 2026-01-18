import { DatabaseService } from './DatabaseService';
import * as Crypto from 'expo-crypto';

export interface Note {
    id: string;
    content: string;
    created_at: string;
    is_pinned: number; // 0 or 1
    habit_id?: string | null;
    log_id?: string | null;
    reminder_time?: string | null;
    is_deleted?: number; // 0 or 1
    audio_uri?: string | null;
    audio_duration?: number | null;
    color?: string | null;
    location_text?: string | null;
}

export const NotesService = {
    async createNote(content: string, habitId?: string, logId?: string, reminderTime?: string | null): Promise<Note> {
        const db = DatabaseService.getDB();
        const id = Crypto.randomUUID();
        const createdAt = new Date().toISOString();

        await db.runAsync(
            'INSERT INTO notes (id, content, created_at, is_pinned, habit_id, log_id, is_deleted, reminder_time) VALUES (?, ?, ?, 0, ?, ?, 0, ?)',
            [id, content, createdAt, habitId || null, logId || null, reminderTime || null]
        );

        return {
            id,
            content,
            created_at: createdAt,
            is_pinned: 0,
            habit_id: habitId,
            log_id: logId,
            reminder_time: reminderTime || null,
            is_deleted: 0,
            audio_uri: null,
            audio_duration: null,
            color: null,
            location_text: null
        };
    },

    async updateNoteAudio(id: string, uri: string, duration: number): Promise<void> {
        const db = DatabaseService.getDB();
        await db.runAsync('UPDATE notes SET audio_uri = ?, audio_duration = ? WHERE id = ?', [uri, duration, id]);
    },

    async updateNoteColor(id: string, color: string): Promise<void> {
        const db = DatabaseService.getDB();
        await db.runAsync('UPDATE notes SET color = ? WHERE id = ?', [color, id]);
    },

    async updateNoteLocation(id: string, location: string): Promise<void> {
        const db = DatabaseService.getDB();
        await db.runAsync('UPDATE notes SET location_text = ? WHERE id = ?', [location, id]);
    },

    async getNotes(filters?: { habitId?: string | null }): Promise<Note[]> {
        const db = DatabaseService.getDB();
        let query = 'SELECT * FROM notes WHERE is_deleted = 0';
        let params: (string | number | null)[] = [];

        if (filters) {
            if (filters.habitId !== undefined) {
                if (filters.habitId === null) {
                    query += ' AND habit_id IS NULL';
                } else {
                    query += ' AND habit_id = ?';
                    params.push(filters.habitId);
                }
            }
        }

        query += ' ORDER BY is_pinned DESC, created_at DESC';

        return await db.getAllAsync<Note>(query, params);
    },

    async getArchivedNotes(): Promise<Note[]> {
        const db = DatabaseService.getDB();
        return await db.getAllAsync<Note>('SELECT * FROM notes WHERE is_deleted = 1 ORDER BY created_at DESC');
    },

    async updateNote(id: string, content: string): Promise<void> {
        const db = DatabaseService.getDB();
        await db.runAsync('UPDATE notes SET content = ? WHERE id = ?', [content, id]);
    },

    async togglePin(id: string, currentStatus: number): Promise<void> {
        const db = DatabaseService.getDB();
        const newStatus = currentStatus === 1 ? 0 : 1;
        await db.runAsync('UPDATE notes SET is_pinned = ? WHERE id = ?', [newStatus, id]);
    },

    async deleteNote(id: string): Promise<void> {
        const db = DatabaseService.getDB();
        // Soft delete
        await db.runAsync('UPDATE notes SET is_deleted = 1, is_pinned = 0 WHERE id = ?', [id]);
    },

    async restoreNote(id: string): Promise<void> {
        const db = DatabaseService.getDB();
        await db.runAsync('UPDATE notes SET is_deleted = 0 WHERE id = ?', [id]);
    },

    async permanentlyDeleteNote(id: string): Promise<void> {
        const db = DatabaseService.getDB();
        await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
    },

    async clearArchive(): Promise<void> {
        const db = DatabaseService.getDB();
        await db.runAsync('DELETE FROM notes WHERE is_deleted = 1');
    },

    async setReminder(id: string, reminderTime: string | null): Promise<void> {
        const db = DatabaseService.getDB();
        await db.runAsync('UPDATE notes SET reminder_time = ? WHERE id = ?', [reminderTime, id]);
    }
};
