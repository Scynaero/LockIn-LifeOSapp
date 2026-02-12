package com.lockin.ui.screen.mind

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.lockin.ui.theme.Background
import com.lockin.ui.theme.Error
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.TextPrimary
import com.lockin.ui.theme.TextSecondary

data class NoteDetailScreen(val noteId: String) : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<MindScreenModel>()
        val state by screenModel.state.collectAsState()
        val navigator = LocalNavigator.currentOrThrow

        val note = state.activeNotes.find { it.id == noteId }
            ?: state.archivedNotes.find { it.id == noteId }

        var editedContent by remember(noteId) {
            mutableStateOf(note?.content ?: "")
        }

        // Auto-save on dispose (navigate away)
        DisposableEffect(noteId) {
            onDispose {
                if (editedContent != note?.content) {
                    screenModel.updateNoteContent(noteId, editedContent)
                }
            }
        }

        Scaffold(
            containerColor = Background,
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            note?.createdAt?.take(10) ?: "",
                            color = TextSecondary,
                            fontSize = 13.sp
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = {
                            // Save before navigating back
                            if (editedContent != note?.content) {
                                screenModel.updateNoteContent(noteId, editedContent)
                            }
                            navigator.pop()
                        }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = TextPrimary)
                        }
                    },
                    actions = {
                        // Pin / Unpin
                        IconButton(onClick = {
                            if (note != null) screenModel.pinNote(note.id, !note.isPinned)
                        }) {
                            Icon(
                                Icons.Default.PushPin,
                                contentDescription = if (note?.isPinned == true) "Unpin" else "Pin",
                                tint = if (note?.isPinned == true) Primary else TextSecondary
                            )
                        }
                        // Archive
                        IconButton(onClick = {
                            if (note != null) {
                                screenModel.archiveNote(note.id)
                                navigator.pop()
                            }
                        }) {
                            Icon(Icons.Default.Archive, "Archive", tint = TextSecondary)
                        }
                        // Delete
                        IconButton(onClick = {
                            if (note != null) {
                                screenModel.deleteNote(note.id)
                                navigator.pop()
                            }
                        }) {
                            Icon(Icons.Default.Delete, "Delete", tint = Error)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Background)
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .imePadding()
            ) {
                if (note != null) {
                    BasicTextField(
                        value = editedContent,
                        onValueChange = { editedContent = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .padding(horizontal = 20.dp, vertical = 8.dp),
                        textStyle = TextStyle(
                            color = TextPrimary,
                            fontSize = 16.sp,
                            lineHeight = 24.sp
                        ),
                        cursorBrush = SolidColor(Primary),
                        decorationBox = { innerTextField ->
                            if (editedContent.isEmpty()) {
                                Text(
                                    "Start writing...",
                                    color = TextSecondary,
                                    fontSize = 16.sp
                                )
                            }
                            innerTextField()
                        }
                    )
                } else {
                    // Note not found
                    Text(
                        "Note not found",
                        color = TextSecondary,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }
    }
}
