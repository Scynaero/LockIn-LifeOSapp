package com.lockin.usecase.notes

import com.lockin.model.Note
import com.lockin.repository.NotesRepository

class NoteCrudUseCase(private val repository: NotesRepository) {

    fun createNote(content: String, habitId: String? = null, logId: String? = null): String {
        return repository.createNote(content, habitId, logId)
    }

    fun getActiveNotes(habitId: String? = null): List<Note> {
        return repository.getActiveNotes(habitId)
            .sortedWith(compareByDescending<Note> { it.isPinned }.thenByDescending { it.createdAt })
    }

    fun getNote(id: String): Note? {
        return repository.getNoteById(id)
    }

    fun updateContent(id: String, content: String) {
        repository.updateContent(id, content)
    }

    fun togglePin(id: String, isPinned: Boolean) {
        repository.togglePin(id, isPinned)
    }

    fun setReminder(id: String, reminderTime: String?) {
        repository.setReminder(id, reminderTime)
    }

    fun updateColor(id: String, color: String?) {
        repository.updateColor(id, color)
    }

    fun updateLocation(id: String, locationText: String) {
        repository.updateLocation(id, locationText)
    }

    /** Extract first line as note title, fallback to "Untitled" */
    fun extractTitle(content: String): String {
        val firstLine = content.lines().firstOrNull { it.isNotBlank() } ?: return "Untitled"
        return firstLine.take(60).trim()
    }

    /** Extract preview text (lines after title), truncated */
    fun extractPreview(content: String): String {
        val lines = content.lines().filter { it.isNotBlank() }
        if (lines.size <= 1) return ""
        return lines.drop(1).joinToString(" ").take(100).trim()
    }
}
