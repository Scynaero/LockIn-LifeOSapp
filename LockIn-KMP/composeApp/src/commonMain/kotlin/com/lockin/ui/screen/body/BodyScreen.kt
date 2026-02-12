package com.lockin.ui.screen.body

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.lockin.ui.screen.body.tabs.LiftContent
import com.lockin.ui.screen.body.tabs.LiveContent
import com.lockin.ui.screen.body.tabs.ProgressContent
import com.lockin.ui.theme.Background
import com.lockin.ui.theme.Primary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BodyScreen(viewModel: BodyScreenModel) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("BODY") },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Background)
            )
        },
        containerColor = Background
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            // Tab Header
            TabRow(
                selectedTabIndex = state.selectedTab.ordinal,
                containerColor = Background,
                contentColor = Primary,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(tabPositions[state.selectedTab.ordinal]),
                        color = Primary
                    )
                }
            ) {
                BodyTab.entries.forEach { tab ->
                    Tab(
                        selected = state.selectedTab == tab,
                        onClick = { viewModel.selectTab(tab) },
                        text = { Text(tab.name, style = MaterialTheme.typography.labelLarge) }
                    )
                }
            }

            // Tab Content
            when (state.selectedTab) {
                BodyTab.LIFT -> LiftContent(state, viewModel)
                BodyTab.LIVE -> LiveContent(state, viewModel)
                BodyTab.PROGRESS -> ProgressContent(state, viewModel)
            }
        }
    }
}
