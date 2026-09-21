package com.photogearvault.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.photogearvault.app.ui.theme.*
import com.photogearvault.app.ui.viewmodel.AuthViewModel
import com.photogearvault.app.ui.viewmodel.MainViewModel

@Composable
fun DashboardScreen(
    mainViewModel: MainViewModel,
    authViewModel: AuthViewModel,
    onOpenScheduleModal: () -> Unit,
    onOpenAddGearModal: () -> Unit
) {
    val user by authViewModel.currentUser.collectAsState()
    val shoots by mainViewModel.shoots.collectAsState()
    val gear by mainViewModel.gear.collectAsState()
    val activeAlerts by mainViewModel.activeAlerts.collectAsState()

    val nextShoot = shoots.firstOrNull()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = TealPrimary),
                shape = RoundedCornerShape(18.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    AsyncImage(
                        model = user?.avatarUrl ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=photographer",
                        contentDescription = "Avatar",
                        modifier = Modifier
                            .size(52.dp)
                            .clip(CircleShape)
                            .background(Color.White),
                        contentScale = ContentScale.Crop
                    )
                    Spacer(modifier = Modifier.width(14.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = user?.name ?: "Photographer",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = user?.studioName ?: "Vault Studio",
                            fontSize = 13.sp,
                            color = TealLight
                        )
                    }
                    IconButton(onClick = { authViewModel.logout() }) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "Logout",
                            tint = Color.White
                        )
                    }
                }
            }
        }

        if (activeAlerts.isNotEmpty()) {
            items(activeAlerts, key = { it.id }) { alert ->
                val isCritical = alert.priority == "critical"
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = if (isCritical) CriticalBackground else HighWarningBackground
                    ),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            1.dp,
                            if (isCritical) CriticalRed else HighWarningOrange,
                            RoundedCornerShape(14.dp)
                        )
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (isCritical) Icons.Default.Warning else Icons.Default.Notifications,
                                    contentDescription = null,
                                    tint = if (isCritical) CriticalRed else HighWarningOrange,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = alert.title,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isCritical) CriticalRed else HighWarningOrange
                                )
                            }
                            IconButton(
                                onClick = { mainViewModel.dismissAlert(alert.id) },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Dismiss",
                                    tint = TextMuted
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(text = alert.message, fontSize = 13.sp, color = TextDark)

                        alert.missingItems?.let { missing ->
                            if (missing.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Missing Gear: " + missing.joinToString(", "),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = CriticalRed
                                )
                            }
                        }
                    }
                }
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = onOpenScheduleModal,
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TealPrimary)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Schedule Shoot", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = onOpenAddGearModal,
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.List, contentDescription = null, tint = TealPrimary, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Add Gear", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TealPrimary)
                }
            }
        }

        item {
            Column {
                Text(
                    text = "NEXT UPCOMING SHOOT",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextMuted
                )
                Spacer(modifier = Modifier.height(8.dp))

                if (nextShoot != null) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        shape = RoundedCornerShape(16.dp),
                        elevation = CardDefaults.cardElevation(2.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { mainViewModel.openShoot(nextShoot.id) }
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    color = TealLight,
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text(
                                        text = nextShoot.shootType,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TealPrimary,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                                Text(
                                    text = nextShoot.dateTime.replace("T", " @ "),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TealAccent
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Text(
                                text = nextShoot.title,
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextDark
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Person, contentDescription = null, tint = TextMuted, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(text = nextShoot.clientName, fontSize = 13.sp, color = TextMuted)
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.LocationOn, contentDescription = null, tint = TextMuted, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(text = nextShoot.location, fontSize = 13.sp, color = TextMuted)
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Button(
                                onClick = { mainViewModel.openShoot(nextShoot.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = TealLight),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Open Shoot Hub & Packing Checklist", color = TealPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                } else {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "No upcoming shoots scheduled.",
                            modifier = Modifier.padding(20.dp),
                            color = TextMuted,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }

        item {
            Text(
                text = "VAULT OVERVIEW",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = TextMuted
            )
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBackground),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(text = gear.size.toString(), fontSize = 24.sp, fontWeight = FontWeight.Bold, color = TealPrimary)
                        Text(text = "Total Gear Items", fontSize = 12.sp, color = TextMuted)
                    }
                }

                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBackground),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(text = shoots.size.toString(), fontSize = 24.sp, fontWeight = FontWeight.Bold, color = TealPrimary)
                        Text(text = "Booked Shoots", fontSize = 12.sp, color = TextMuted)
                    }
                }
            }
        }
    }
}
