package com.photogearvault.app.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import com.photogearvault.app.data.model.NavigationTab
import com.photogearvault.app.ui.theme.TealPrimary

@Composable
fun AppNavigationBar(
    currentTab: NavigationTab,
    onTabSelected: (NavigationTab) -> Unit,
    alertCount: Int
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = NavigationBarDefaults.Elevation
    ) {
        val items = listOf(
            Triple(NavigationTab.DASHBOARD, Icons.Default.Home, "Dashboard"),
            Triple(NavigationTab.CALENDAR, Icons.Default.DateRange, "Calendar"),
            Triple(NavigationTab.WEATHER, Icons.Default.Info, "Weather"),
            Triple(NavigationTab.GEAR_VAULT, Icons.Default.List, "Gear Vault"),
            Triple(NavigationTab.SETTINGS, Icons.Default.Settings, "Settings")
        )

        items.forEach { (tab, icon, label) ->
            val selected = currentTab == tab
            NavigationBarItem(
                selected = selected,
                onClick = { onTabSelected(tab) },
                icon = {
                    if (tab == NavigationTab.DASHBOARD && alertCount > 0) {
                        BadgedBox(
                            badge = { Badge { Text(alertCount.toString()) } }
                        ) {
                            Icon(icon, contentDescription = label)
                        }
                    } else {
                        Icon(icon, contentDescription = label)
                    }
                },
                label = { Text(label) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = TealPrimary,
                    selectedTextColor = TealPrimary,
                    indicatorColor = TealPrimary.copy(alpha = 0.15f)
                )
            )
        }
    }
}
