package com.lockin.ui.screen.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.lockin.ui.component.Heatmap
import com.lockin.ui.theme.Surface

@Composable
fun HeatmapView(
    heatmapData: Map<String, Int>
) {
    if (heatmapData.isNotEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Surface)
                .padding(16.dp)
        ) {
            Heatmap(
                data = heatmapData,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
