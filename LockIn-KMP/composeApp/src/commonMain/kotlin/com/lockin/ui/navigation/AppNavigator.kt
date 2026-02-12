package com.lockin.ui.navigation

import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.navigator.tab.CurrentTab
import cafe.adriel.voyager.navigator.tab.LocalTabNavigator
import cafe.adriel.voyager.navigator.tab.Tab
import cafe.adriel.voyager.navigator.tab.TabNavigator
import com.lockin.ui.theme.Primary
import com.lockin.ui.theme.Surface
import com.lockin.ui.theme.SurfaceHighlight
import com.lockin.ui.theme.TextMuted

@Composable
fun AppNavigator() {
    TabNavigator(DashboardTab) {
        Scaffold(
            containerColor = Surface,
            bottomBar = {
                NavigationBar(
                    containerColor = Surface,
                    tonalElevation = 0.dp
                ) {
                    TabNavigationItem(DashboardTab)
                    TabNavigationItem(BodyTab)
                    TabNavigationItem(SettingsTab)
                    TabNavigationItem(WalletTab)
                    TabNavigationItem(MindTab)
                }
            }
        ) {
            CurrentTab()
        }
    }
}

@Composable
private fun RowScope.TabNavigationItem(tab: Tab) {
    val tabNavigator = LocalTabNavigator.current
    val selected = tabNavigator.current.key == tab.key

    NavigationBarItem(
        selected = selected,
        onClick = { tabNavigator.current = tab },
        icon = {
            tab.options.icon?.let { icon ->
                Icon(
                    painter = icon,
                    contentDescription = tab.options.title,
                    modifier = Modifier.size(24.dp)
                )
            }
        },
        label = {
            Text(
                text = tab.options.title,
                style = MaterialTheme.typography.labelSmall
            )
        },
        colors = NavigationBarItemDefaults.colors(
            selectedIconColor = Primary,
            selectedTextColor = Primary,
            unselectedIconColor = TextMuted,
            unselectedTextColor = TextMuted,
            indicatorColor = SurfaceHighlight
        )
    )
}
