package com.photogearvault.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.photogearvault.app.data.model.*
import com.photogearvault.app.ui.theme.*
import com.photogearvault.app.ui.viewmodel.MainViewModel

@Composable
fun ShootHubScreen(
    shoot: Shoot,
    mainViewModel: MainViewModel,
    onBack: () -> Unit
) {
    val gearList by mainViewModel.gear.collectAsState()
    val packingList by mainViewModel.packing.collectAsState()
    val moodboards by mainViewModel.moodboards.collectAsState()

    val shootPacking = packingList.filter { it.shootId == shoot.id }
    val shootMoodboards = moodboards.filter { it.shootId == shoot.id }

    var selectedSubTab by remember { mutableStateOf(0) }
    var packingFilter by remember { mutableStateOf("ALL") }

    var isAddPackingModalOpen by remember { mutableStateOf(false) }
    var isAddMoodboardModalOpen by remember { mutableStateOf(false) }

    val gearMap = gearList.associateBy { it.id }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundLight)
    ) {
        Surface(
            color = TealPrimary,
            shadowElevation = 4.dp
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = shoot.title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text(text = "${shoot.clientName} • ${shoot.location}", fontSize = 12.sp, color = TealLight)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                TabRow(
                    selectedTabIndex = selectedSubTab,
                    containerColor = TealPrimary,
                    contentColor = Color.White
                ) {
                    Tab(
                        selected = selectedSubTab == 0,
                        onClick = { selectedSubTab = 0 },
                        text = { Text("Packing List (${shootPacking.size})", fontSize = 13.sp) }
                    )
                    Tab(
                        selected = selectedSubTab == 1,
                        onClick = { selectedSubTab = 1 },
                        text = { Text("Moodboard (${shootMoodboards.size})", fontSize = 13.sp) }
                    )
                    Tab(
                        selected = selectedSubTab == 2,
                        onClick = { selectedSubTab = 2 },
                        text = { Text("Shoot Details", fontSize = 13.sp) }
                    )
                }
            }
        }

        Box(modifier = Modifier.weight(1f).padding(16.dp)) {
            when (selectedSubTab) {
                0 -> {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                listOf("ALL", "NEEDED", "PACKED", "MISSING").forEach { status ->
                                    FilterChip(
                                        selected = packingFilter == status,
                                        onClick = { packingFilter = status },
                                        label = { Text(status, fontSize = 11.sp) }
                                    )
                                }
                            }
                            IconButton(onClick = { isAddPackingModalOpen = true }) {
                                Icon(Icons.Default.AddCircle, contentDescription = "Add Packing Item", tint = TealPrimary)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        val filteredPacking = shootPacking.filter {
                            when (packingFilter) {
                                "NEEDED" -> it.status == PackingStatus.NEEDED
                                "PACKED" -> it.status == PackingStatus.PACKED
                                "MISSING" -> it.status == PackingStatus.MISSING
                                else -> true
                            }
                        }

                        if (filteredPacking.isEmpty()) {
                            Text("No gear added to this packing list yet.", color = TextMuted, fontSize = 14.sp)
                        } else {
                            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                items(filteredPacking, key = { it.id }) { packItem ->
                                    val gearItem = gearMap[packItem.gearId]
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(12.dp).fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = gearItem?.name ?: "Gear Item",
                                                    fontSize = 14.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = TextDark
                                                )
                                                Text(
                                                    text = gearItem?.category?.displayName ?: "",
                                                    fontSize = 12.sp,
                                                    color = TextMuted
                                                )
                                            }

                                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                listOf(PackingStatus.NEEDED, PackingStatus.PACKED, PackingStatus.MISSING).forEach { status ->
                                                    val selected = packItem.status == status
                                                    val statusColor = when (status) {
                                                        PackingStatus.PACKED -> SuccessGreen
                                                        PackingStatus.MISSING -> CriticalRed
                                                        PackingStatus.NEEDED -> HighWarningOrange
                                                    }
                                                    Button(
                                                        onClick = { mainViewModel.updatePackingItem(packItem.copy(status = status)) },
                                                        colors = ButtonDefaults.buttonColors(
                                                            containerColor = if (selected) statusColor else Color.LightGray.copy(alpha = 0.3f)
                                                        ),
                                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                                                        shape = RoundedCornerShape(8.dp),
                                                        modifier = Modifier.height(32.dp)
                                                    ) {
                                                        Text(
                                                            text = status.displayName,
                                                            fontSize = 11.sp,
                                                            color = if (selected) Color.White else TextDark
                                                        )
                                                    }
                                                }
                                                IconButton(
                                                    onClick = { mainViewModel.deletePackingItem(packItem.id) },
                                                    modifier = Modifier.size(32.dp)
                                                ) {
                                                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = TextMuted, modifier = Modifier.size(16.dp))
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                1 -> {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Inspiration Moodboard", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextDark)
                            Button(
                                onClick = { isAddMoodboardModalOpen = true },
                                colors = ButtonDefaults.buttonColors(containerColor = TealPrimary)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Add Reference")
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        if (shootMoodboards.isEmpty()) {
                            Text("No moodboard reference images added yet.", color = TextMuted, fontSize = 14.sp)
                        } else {
                            LazyVerticalGrid(
                                columns = GridCells.Fixed(2),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(shootMoodboards, key = { it.id }) { item ->
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Column {
                                            AsyncImage(
                                                model = item.imageUrl,
                                                contentDescription = item.caption,
                                                modifier = Modifier.fillMaxWidth().height(140.dp),
                                                contentScale = ContentScale.Crop
                                            )
                                            Column(modifier = Modifier.padding(8.dp)) {
                                                item.category?.let {
                                                    Text(text = it, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = TealAccent)
                                                }
                                                Text(text = item.caption, fontSize = 12.sp, color = TextDark, maxLines = 2)
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.End
                                                ) {
                                                    IconButton(
                                                        onClick = { mainViewModel.deleteMoodboardItem(item.id) },
                                                        modifier = Modifier.size(24.dp)
                                                    ) {
                                                        Icon(Icons.Default.Delete, contentDescription = null, tint = CriticalRed, modifier = Modifier.size(16.dp))
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                2 -> {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Client: ${shoot.clientName}", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Type: ${shoot.shootType}", fontSize = 14.sp)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Date/Time: ${shoot.dateTime.replace("T", " at ")}", fontSize = 14.sp, color = TealAccent, fontWeight = FontWeight.SemiBold)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Location: ${shoot.location}", fontSize = 14.sp)
                            Spacer(modifier = Modifier.height(12.dp))
                            Text("General Notes & Instructions:", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = shoot.generalNotes.ifEmpty { "No extra notes." }, fontSize = 13.sp, color = TextDark)
                        }
                    }
                }
            }
        }
    }

    if (isAddPackingModalOpen) {
        val unpackedGear = gearList.filter { gear -> shootPacking.none { it.gearId == gear.id } }
        AlertDialog(
            onDismissRequest = { isAddPackingModalOpen = false },
            title = { Text("Select Gear to Pack") },
            text = {
                LazyColumn(modifier = Modifier.heightIn(max = 300.dp)) {
                    items(unpackedGear) { gear ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    mainViewModel.addPackingItems(
                                        listOf(
                                            PackingItem(
                                                id = "pack-${System.currentTimeMillis()}",
                                                shootId = shoot.id,
                                                gearId = gear.id,
                                                status = PackingStatus.NEEDED
                                            )
                                        )
                                    )
                                    isAddPackingModalOpen = false
                                }
                                .padding(12.dp)
                        ) {
                            Text(gear.name, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { isAddPackingModalOpen = false }) { Text("Done") }
            }
        )
    }

    if (isAddMoodboardModalOpen) {
        var imageUrl by remember { mutableStateOf("") }
        var caption by remember { mutableStateOf("") }
        var category by remember { mutableStateOf("Lighting") }

        AlertDialog(
            onDismissRequest = { isAddMoodboardModalOpen = false },
            title = { Text("Add Moodboard Reference") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(value = imageUrl, onValueChange = { imageUrl = it }, label = { Text("Image URL") })
                    OutlinedTextField(value = caption, onValueChange = { caption = it }, label = { Text("Caption") })
                    OutlinedTextField(value = category, onValueChange = { category = it }, label = { Text("Category (e.g. Lighting, Posing)") })
                }
            },
            confirmButton = {
                Button(onClick = {
                    if (imageUrl.isNotEmpty()) {
                        mainViewModel.addMoodboardItem(
                            MoodboardItem(
                                id = "mb-${System.currentTimeMillis()}",
                                shootId = shoot.id,
                                imageUrl = imageUrl,
                                caption = caption,
                                category = category,
                                createdAt = java.time.Instant.now().toString()
                            )
                        )
                        isAddMoodboardModalOpen = false
                    }
                }) { Text("Add") }
            },
            dismissButton = {
                TextButton(onClick = { isAddMoodboardModalOpen = false }) { Text("Cancel") }
            }
        )
    }
}
