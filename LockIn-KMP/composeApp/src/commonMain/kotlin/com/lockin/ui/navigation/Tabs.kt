package com.lockin.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import cafe.adriel.voyager.navigator.tab.Tab
import cafe.adriel.voyager.navigator.tab.TabOptions
import cafe.adriel.voyager.koin.getScreenModel
import com.lockin.ui.screen.dashboard.DashboardScreenModel
import com.lockin.ui.screen.dashboard.DashboardScreen
import com.lockin.ui.screen.body.BodyScreen
import com.lockin.ui.screen.wallet.WalletScreen
import com.lockin.ui.screen.mind.MindScreen

object DashboardTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val icon = rememberVectorPainter(Icons.Default.Home)
            return remember { TabOptions(index = 0u, title = "Home", icon = icon) }
        }

    @Composable
    override fun Content() {
        val screenModel = getScreenModel<DashboardScreenModel>()
        DashboardScreen(screenModel)
    }
}

object BodyTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val icon = rememberVectorPainter(Icons.Default.FitnessCenter)
            return remember { TabOptions(index = 1u, title = "Body", icon = icon) }
        }

    @Composable
    override fun Content() {
        BodyScreen()
    }
}

object SettingsTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val icon = rememberVectorPainter(Icons.Default.Settings)
            return remember { TabOptions(index = 2u, title = "Settings", icon = icon) }
        }

    @Composable
    override fun Content() {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Settings", style = MaterialTheme.typography.headlineMedium)
        }
    }
}

object WalletTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val icon = rememberVectorPainter(Icons.Default.AccountBalanceWallet)
            return remember { TabOptions(index = 3u, title = "Wallet", icon = icon) }
        }

    @Composable
    override fun Content() {
        WalletScreen()
    }
}

object MindTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val icon = rememberVectorPainter(Icons.Default.Edit)
            return remember { TabOptions(index = 4u, title = "Mind", icon = icon) }
        }

    @Composable
    override fun Content() {
        MindScreen()
    }
}
