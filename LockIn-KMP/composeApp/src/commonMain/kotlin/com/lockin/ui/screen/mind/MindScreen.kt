package com.lockin.ui.screen.mind

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.lockin.ui.theme.Background
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.PrimaryDim
import com.lockin.ui.theme.Surface
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextPrimary
import com.lockin.ui.theme.TextSecondary
import com.lockin.usecase.notes.NoteCrudUseCase
import org.koin.compose.koinInject

class MindScreen : Screen {
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<MindScreenModel>()
        val state by screenModel.state.collectAsState()
        val navigator = LocalNavigator.currentOrThrow
        val noteCrud: NoteCrudUseCase = koinInject()

        val pinnedNotes = state.activeNotes.filter { it.isPinned }
        val unpinnedNotes = state.activeNotes.filter { !it.isPinned }

        Scaffold(
            containerColor = Background,
            floatingActionButton = {
                FloatingActionButton(
                    onClick = {
                        val id = screenModel.createNoteAndReturn("")
                        if (id != null) {
                            navigator.push(NoteDetailScreen(id))
                        }
                    },
                    containerColor = Primary,
                    contentColor = Color.Black,
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.Add, contentDescription = "New Note")
                }
            }
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Header
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 16.dp, bottom = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "MIND",
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = Primary,
                            letterSpacing = (-2).sp
                        )
                        // Archive button
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(SurfaceHighlight)
                                .clickable { navigator.push(ArchiveScreenWrapper()) }
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Archive, "Archive", tint = TextSecondary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                "${state.archivedNotes.size}",
                                fontSize = 13.sp,
                                color = TextSecondary,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }

                // Pinned Section
                if (pinnedNotes.isNotEmpty()) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                        ) {
                            Icon(Icons.Default.PushPin, null, tint = Primary, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("PINNED", fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                        }
                    }
                    item {
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            contentPadding = PaddingValues(end = 8.dp)
                        ) {
                            items(pinnedNotes, key = { it.id }) { note ->
                                val title = noteCrud.extractTitle(note.content)
                                val bgColor = note.color?.let { parseNoteColor(it) } ?: Surface
                                Box(
                                    modifier = Modifier
                                        .width(150.dp)
                                        .height(100.dp)
                                        .clip(RoundedCornerShape(14.dp))
                                        .background(bgColor)
                                        .clickable { navigator.push(NoteDetailScreen(note.id)) }
                                        .padding(12.dp)
                                ) {
                                    Column {
                                        Text(
                                            title,
                                            color = TextPrimary,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp,
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Spacer(modifier = Modifier.weight(1f))
                                        Text(
                                            note.createdAt.take(10),
                                            color = TextSecondary,
                                            fontSize = 10.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                    item { Spacer(modifier = Modifier.height(8.dp)) }
                }

                // Notes Section
                if (unpinnedNotes.isNotEmpty()) {
                    item {
                        Text("NOTES", fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.Bold, letterSpacing = 2.sp,
                            modifier = Modifier.padding(top = 8.dp, bottom = 4.dp))
                    }
                }

                items(unpinnedNotes, key = { it.id }) { note ->
                    NoteCard(
                        title = noteCrud.extractTitle(note.content),
                        preview = noteCrud.extractPreview(note.content),
                        date = note.createdAt.take(10),
                        color = note.color?.let { parseNoteColor(it) } ?: Surface,
                        onClick = { navigator.push(NoteDetailScreen(note.id)) }
                    )
                }

                // Empty State
                if (state.activeNotes.isEmpty() && !state.isLoading) {
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth().height(300.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("📝", fontSize = 48.sp)
                                Spacer(modifier = Modifier.height(12.dp))
                                Text("No notes yet", color = TextSecondary, fontSize = 16.sp)
                                Text("Tap + to create one", color = TextSecondary, fontSize = 13.sp)
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(80.dp)) }
            }
        }
    }
}

@Composable
private fun NoteCard(
    title: String,
    preview: String,
    date: String,
    color: Color,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(color)
            .clickable { onClick() }
            .padding(14.dp)
    ) {
        Text(
            title,
            color = TextPrimary,
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        if (preview.isNotBlank()) {
            Text(
                preview,
                color = TextSecondary,
                fontSize = 13.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
        Text(
            date,
            color = TextSecondary,
            fontSize = 11.sp,
            modifier = Modifier.padding(top = 6.dp)
        )
    }
}

/** Voyager Screen wrapper for ArchiveScreen composable */
private class ArchiveScreenWrapper : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        ArchiveScreen(onBack = { navigator.pop() })
    }
}

private fun parseNoteColor(hex: String): Color {
    return try {
        val cleaned = hex.removePrefix("#")
        val colorLong = cleaned.toLong(16)
        Color(colorLong or 0xFF000000)
    } catch (_: Exception) {
        Surface
    }
}
