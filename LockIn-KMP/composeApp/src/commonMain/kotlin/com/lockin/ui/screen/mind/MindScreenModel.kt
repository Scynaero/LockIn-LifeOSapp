package com.lockin.ui.screen.mind

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.lockin.model.Note
import com.lockin.usecase.notes.NoteArchiveUseCase
import com.lockin.usecase.notes.NoteCrudUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MindUiState(
    val activeNotes: List<Note> = emptyList(),
    val archivedNotes: List<Note> = emptyList(),
    val isLoading: Boolean = true
)

class MindScreenModel(
    private val noteCrudUseCase: NoteCrudUseCase,
    private val noteArchiveUseCase: NoteArchiveUseCase
) : ScreenModel {

    private val _state = MutableStateFlow(MindUiState())
    val state: StateFlow<MindUiState> = _state.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            val active = noteCrudUseCase.getActiveNotes() /// habitId null
            val archived = noteArchiveUseCase.getArchivedNotes()
            _state.update {
                it.copy(
                    activeNotes = active,
                    archivedNotes = archived,
                    isLoading = false
                )
            }
        }
    }

    fun createNote(content: String) {
        screenModelScope.launch {
            noteCrudUseCase.createNote(content)
            loadData()
        }
    }

    /** Creates a note and returns its ID immediately (for navigation) */
    fun createNoteAndReturn(content: String): String? {
        return try {
            val id = noteCrudUseCase.createNote(content)
            screenModelScope.launch { loadData() }
            id
        } catch (_: Exception) {
            null
        }
    }

    fun pinNote(id: String, isPinned: Boolean) {
        screenModelScope.launch {
            noteCrudUseCase.togglePin(id, isPinned)
            loadData()
        }
    }

    fun archiveNote(id: String) {
        screenModelScope.launch {
            noteArchiveUseCase.archiveNote(id)
            loadData()
        }
    }

    fun restoreNote(id: String) {
        screenModelScope.launch {
            noteArchiveUseCase.restoreNote(id)
            loadData()
        }
    }

    fun deleteNote(id: String) {
        screenModelScope.launch {
            noteArchiveUseCase.permanentDelete(id)
            loadData()
        }
    }

    fun updateNoteContent(id: String, content: String) {
        screenModelScope.launch {
            noteCrudUseCase.updateContent(id, content)
            loadData()
        }
    }
}
