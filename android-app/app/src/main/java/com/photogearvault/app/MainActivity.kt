package com.photogearvault.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.photogearvault.app.data.model.NavigationTab
import com.photogearvault.app.ui.components.AddGearModal
import com.photogearvault.app.ui.components.AppNavigationBar
import com.photogearvault.app.ui.components.ScheduleShootModal
import com.photogearvault.app.ui.screens.*
import com.photogearvault.app.ui.theme.PhotoGearVaultTheme
import com.photogearvault.app.ui.viewmodel.AuthViewModel
import com.photogearvault.app.ui.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {
    private val authViewModel: AuthViewModel by viewModels()
    private val mainViewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            PhotoGearVaultTheme {
                val currentUser by authViewModel.currentUser.collectAsState()
                val currentTab by mainViewModel.currentTab.collectAsState()
                val activeShootId by mainViewModel.activeShootId.collectAsState()
                val shoots by mainViewModel.shoots.collectAsState()
                val activeAlerts by mainViewModel.activeAlerts.collectAsState()

                var isScheduleModalOpen by remember { mutableStateOf(false) }
                var isAddGearModalOpen by remember { mutableStateOf(false) }

                if (currentUser == null) {
                    LoginScreen(authViewModel = authViewModel)
                } else {
                    val activeShoot = shoots.find { it.id == activeShootId }

                    Scaffold(
                        bottomBar = {
                            if (activeShoot == null) {
                                AppNavigationBar(
                                    currentTab = currentTab,
                                    onTabSelected = { mainViewModel.setTab(it) },
                                    alertCount = activeAlerts.size
                                )
                            }
                        }
                    ) { innerPadding ->
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding)
                        ) {
                            if (activeShoot != null) {
                                ShootHubScreen(
                                    shoot = activeShoot,
                                    mainViewModel = mainViewModel,
                                    onBack = { mainViewModel.closeShootHub() }
                                )
                            } else {
                                when (currentTab) {
                                    NavigationTab.DASHBOARD -> DashboardScreen(
                                        mainViewModel = mainViewModel,
                                        authViewModel = authViewModel,
                                        onOpenScheduleModal = { isScheduleModalOpen = true },
                                        onOpenAddGearModal = { isAddGearModalOpen = true }
                                    )
                                    NavigationTab.CALENDAR -> ShootSchedulerScreen(
                                        mainViewModel = mainViewModel,
                                        onOpenAddShootModal = { isScheduleModalOpen = true }
                                    )
                                    NavigationTab.WEATHER -> WeatherForecastScreen(
                                        mainViewModel = mainViewModel
                                    )
                                    NavigationTab.GEAR_VAULT -> GearVaultScreen(
                                        mainViewModel = mainViewModel,
                                        onOpenAddGearModal = { isAddGearModalOpen = true }
                                    )
                                    NavigationTab.SETTINGS -> SettingsScreen(
                                        mainViewModel = mainViewModel,
                                        authViewModel = authViewModel
                                    )
                                }
                            }
                        }
                    }

                    ScheduleShootModal(
                        isOpen = isScheduleModalOpen,
                        onClose = { isScheduleModalOpen = false },
                        onSave = { shoot -> mainViewModel.addShoot(shoot) }
                    )

                    AddGearModal(
                        isOpen = isAddGearModalOpen,
                        onClose = { isAddGearModalOpen = false },
                        onSave = { gear -> mainViewModel.addGear(gear) }
                    )
                }
            }
        }
    }
}
