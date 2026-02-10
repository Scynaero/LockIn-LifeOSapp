package com.lockin.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = Primary,
    onPrimary = Surface,
    secondary = Frozen,
    onSecondary = TextPrimary,
    tertiary = PrimaryDim,
    background = Surface,
    onBackground = TextPrimary,
    surface = Surface,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceHighlight,
    onSurfaceVariant = TextSecondary,
    error = Error,
    onError = TextPrimary,
    outline = SurfaceBorder,
    outlineVariant = TextMuted
)

@Composable
fun LockInTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = LockInTypography,
        content = content
    )
}
