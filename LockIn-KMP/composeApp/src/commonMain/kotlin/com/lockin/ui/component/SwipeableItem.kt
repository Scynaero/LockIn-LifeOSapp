package com.lockin.ui.component

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import com.lockin.ui.theme.Error
import com.lockin.ui.theme.Frozen
import com.lockin.ui.theme.Surface
import com.lockin.ui.theme.TextPrimary
import kotlin.math.roundToInt

/**
 * A swipe-to-reveal composable that shows action buttons on the right
 * when the user drags the content to the left.
 *
 * This is a simplified approach using offset + drag detection.
 * For production, consider using Material3 SwipeToDismissBox.
 */
@Composable
fun SwipeableItem(
    onDelete: (() -> Unit)? = null,
    onArchive: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val actionWidth = if (onDelete != null && onArchive != null) 120.dp else 60.dp

    var isRevealed by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
    ) {
        // Background actions (visible when swiped)
        Row(
            modifier = Modifier
                .fillMaxSize()
                .background(Surface),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = androidx.compose.foundation.layout.Arrangement.End
        ) {
            if (onArchive != null) {
                IconButton(
                    onClick = {
                        isRevealed = false
                        onArchive()
                    },
                    modifier = Modifier.width(60.dp).fillMaxHeight()
                ) {
                    Icon(Icons.Default.Archive, "Archive", tint = Frozen)
                }
            }
            if (onDelete != null) {
                IconButton(
                    onClick = {
                        isRevealed = false
                        onDelete()
                    },
                    modifier = Modifier
                        .width(60.dp)
                        .fillMaxHeight()
                        .background(Error.copy(alpha = 0.15f))
                ) {
                    Icon(Icons.Default.Delete, "Delete", tint = Error)
                }
            }
        }

        // Foreground content
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .offset {
                    IntOffset(
                        x = if (isRevealed) -actionWidth.roundToPx() else 0,
                        y = 0
                    )
                }
                .background(Surface)
                .clip(RoundedCornerShape(12.dp))
                .then(
                    Modifier.pointerInput(Unit) {
                        detectHorizontalDragGestures(
                            onDragEnd = {},
                            onHorizontalDrag = { _, dragAmount ->
                                if (dragAmount < -10f) {
                                    isRevealed = true
                                } else if (dragAmount > 10f) {
                                    isRevealed = false
                                }
                            }
                        )
                    }
                )
        ) {
            content()
        }
    }
}

// Simple horizontal drag gesture detection helper
private suspend fun androidx.compose.ui.input.pointer.PointerInputScope.detectHorizontalDragGestures(
    onDragEnd: () -> Unit,
    onHorizontalDrag: (change: Any, dragAmount: Float) -> Unit
) {
    awaitPointerEventScope {
        while (true) {
            val down = awaitPointerEvent()
            val change = down.changes.firstOrNull() ?: continue
            if (change.pressed) {
                val startX = change.position.x
                while (true) {
                    val event = awaitPointerEvent()
                    val current = event.changes.firstOrNull() ?: break
                    if (!current.pressed) {
                        onDragEnd()
                        break
                    }
                    val dx = current.position.x - startX
                    onHorizontalDrag(current, dx)
                }
            }
        }
    }
}
