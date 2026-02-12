package com.lockin.usecase.notes

import com.lockin.model.Note
import com.lockin.repository.NotesRepository

class NoteArchiveUseCase(private val repository: NotesRepository) {

    fun getArchivedNotes(): List<Note> {
        return repository.getArchivedNotes()
            .sortedByDescending { it.createdAt }
    }

    fun archiveNote(id: String) {
        repository.softDelete(id)
    }

    fun restoreNote(id: String) {
        repository.restore(id)
    }

    fun permanentDelete(id: String) {
        repository.permanentDelete(id)
    }

    fun clearArchive() {
        repository.clearArchive()
    }
}
