package com.lockin.ui

import androidx.compose.runtime.Composable
import com.lockin.ui.theme.LockInTheme
import com.lockin.ui.navigation.AppNavigator

@Composable
fun App() {
    LockInTheme {
        AppNavigator()
    }
}
