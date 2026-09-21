package com.photogearvault.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.photogearvault.app.ui.theme.*
import com.photogearvault.app.ui.viewmodel.AuthViewModel
import com.photogearvault.app.ui.viewmodel.MainViewModel

@Composable
fun SettingsScreen(
    mainViewModel: MainViewModel,
    authViewModel: AuthViewModel
) {
    val settings by mainViewModel.settings.collectAsState()
    val user by authViewModel.currentUser.collectAsState()

    var name by remember(user) { mutableStateOf(user?.name ?: "") }
    var studioName by remember(user) { mutableStateOf(user?.studioName ?: "") }

    var isResetConfirmOpen by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column {
                Text(
                    text = "App Settings & Profile",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = TealPrimary
                )
                Text(
                    text = "Configure alerts, photographer profile, & simulation controls",
                    fontSize = 13.sp,
                    color = TextMuted
                )
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("PHOTOGRAPHER PROFILE", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Photographer Name") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = studioName,
                        onValueChange = { studioName = it },
                        label = { Text("Studio Name") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = { authViewModel.updateProfile(name, studioName) },
                        colors = ButtonDefaults.buttonColors(containerColor = TealPrimary),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Save Profile Changes")
                    }
                }
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("ALERTS & PACKING NOTIFICATIONS", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Day-of-Shoot Morning Call", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextDark)
                            Text("Notify at selected time on shoot morning", fontSize = 12.sp, color = TextMuted)
                        }
                        Switch(
                            checked = settings.enableMorningAlerts,
                            onCheckedChange = { mainViewModel.updateSettings(settings.copy(enableMorningAlerts = it)) }
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("2-Hour Critical Missing Gear Alert", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = TextDark)
                            Text("High priority alert if items are not packed 2h before shoot", fontSize = 12.sp, color = TextMuted)
                        }
                        Switch(
                            checked = settings.enableTwoHourCriticalAlert,
                            onCheckedChange = { mainViewModel.updateSettings(settings.copy(enableTwoHourCriticalAlert = it)) }
                        )
                    }
                }
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("DEMO & ALERT SIMULATION", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = { mainViewModel.triggerSimulatedAlert("morning_review") },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Test Morning Call", fontSize = 11.sp, color = TealPrimary)
                        }

                        Button(
                            onClick = { mainViewModel.triggerSimulatedAlert("two_hour_critical") },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = CriticalRed),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Test 2-Hour Critical", fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(
                    onClick = { authViewModel.logout() },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Sign Out of Account", color = CriticalRed, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = { isResetConfirmOpen = true },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEF2F2)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null, tint = CriticalRed)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Reset Vault to Initial Sample Data", color = CriticalRed, fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    if (isResetConfirmOpen) {
        AlertDialog(
            onDismissRequest = { isResetConfirmOpen = false },
            title = { Text("Reset All Vault Data?") },
            text = { Text("This will restore initial sample gear, shoots, packing lists, and moodboards.", fontSize = 13.sp) },
            confirmButton = {
                Button(
                    onClick = {
                        mainViewModel.resetData()
                        isResetConfirmOpen = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CriticalRed)
                ) {
                    Text("Reset Everything")
                }
            },
            dismissButton = {
                TextButton(onClick = { isResetConfirmOpen = false }) { Text("Cancel") }
            }
        )
    }
}
