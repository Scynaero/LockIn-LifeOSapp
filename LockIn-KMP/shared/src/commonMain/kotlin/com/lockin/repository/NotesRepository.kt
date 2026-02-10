package com.lockin.repository

import com.lockin.db.LockinDatabase
import com.lockin.model.Note
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@OptIn(ExperimentalUuidApi::class)
class NotesRepository(private val database: LockinDatabase) {

    fun createNote(content: String, habitId: String? = null, logId: String? = null, reminderTime: String? = null): String {
        val id = Uuid.random().toString()
        val now = Clock.System.now().toString()
        database.notesQueries.insertNote(
            id = id,
            content = content,
            created_at = now,
            is_pinned = 0,
            habit_id = habitId,
            log_id = logId,
            reminder_time = reminderTime,
            is_deleted = 0,
            audio_uri = null,
            audio_duration = null,
            color = null,
            location_text = null
        )
        return id
    }

    fun getActiveNotes(habitId: String? = null): List<Note> {
        val notes = if (habitId != null) {
            database.notesQueries.getActiveNotesForHabit(habitId).executeAsList()
        } else {
            database.notesQueries.getActiveNotes().executeAsList()
        }
        return notes.map { mapNote(it) }
    }

    fun getArchivedNotes(): List<Note> {
        return database.notesQueries.getArchivedNotes().executeAsList().map { mapNote(it) }
    }

    fun getNoteById(id: String): Note? {
        val n = database.notesQueries.getNoteById(id).executeAsOneOrNull() ?: return null
        return mapNote(n)
    }

    fun updateContent(id: String, content: String) {
        database.notesQueries.updateNoteContent(content = content, id = id)
    }

    fun togglePin(id: String, isPinned: Boolean) {
        database.notesQueries.togglePin(is_pinned = if (isPinned) 1 else 0, id = id)
    }

    fun setReminder(id: String, reminderTime: String?) {
        database.notesQueries.setReminder(reminder_time = reminderTime, id = id)
    }

    fun updateAudio(id: String, audioUri: String?, audioDuration: Int?) {
        database.notesQueries.updateAudio(
            audio_uri = audioUri,
            audio_duration = audioDuration?.toLong(),
            id = id
        )
    }

    fun updateColor(id: String, color: String?) {
        database.notesQueries.updateColor(color = color, id = id)
    }

    fun updateLocation(id: String, locationText: String?) {
        database.notesQueries.updateLocation(location_text = locationText, id = id)
    }

    fun softDelete(id: String) {
        database.notesQueries.softDelete(id)
    }

    fun restore(id: String) {
        database.notesQueries.restore(id)
    }

    fun permanentDelete(id: String) {
        database.notesQueries.permanentDelete(id)
    }

    fun clearArchive() {
        database.notesQueries.clearArchive()
    }

    // --- Helper ---

    private fun mapNote(n: com.lockin.db.Notes): Note {
        return Note(
            id = n.id,
            content = n.content,
            createdAt = n.created_at,
            isPinned = n.is_pinned != 0L,
            habitId = n.habit_id,
            logId = n.log_id,
            reminderTime = n.reminder_time,
            isDeleted = n.is_deleted != 0L,
            audioUri = n.audio_uri,
            audioDuration = n.audio_duration?.toInt(),
            color = n.color,
            locationText = n.location_text
        )
    }
}
