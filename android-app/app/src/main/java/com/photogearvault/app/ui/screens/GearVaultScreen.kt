package com.photogearvault.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Info
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
import com.photogearvault.app.data.model.GearCategory
import com.photogearvault.app.data.model.GearItem
import com.photogearvault.app.data.service.ExifToolService
import com.photogearvault.app.ui.theme.*
import com.photogearvault.app.ui.viewmodel.MainViewModel

@Composable
fun GearVaultScreen(
    mainViewModel: MainViewModel,
    onOpenAddGearModal: () -> Unit
) {
    val gear by mainViewModel.gear.collectAsState()
    var selectedCategoryFilter by remember { mutableStateOf<GearCategory?>(null) }

    var isExifPresetModalOpen by remember { mutableStateOf(false) }

    val filteredGear = gear.filter {
        selectedCategoryFilter == null || it.category == selectedCategoryFilter
    }

    Scaffold(
        floatingActionButton = {
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SmallFloatingActionButton(
                    onClick = { isExifPresetModalOpen = true },
                    containerColor = TealAccent,
                    contentColor = Color.White
                ) {
                    Icon(Icons.Default.Info, contentDescription = "Import EXIF Preset")
                }
                FloatingActionButton(
                    onClick = onOpenAddGearModal,
                    containerColor = TealPrimary,
                    contentColor = Color.White
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Gear")
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(BackgroundLight)
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Column {
                    Text(
                        text = "Gear Vault",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = TealPrimary
                    )
                    Text(
                        text = "${gear.size} registered equipment items & optical assets",
                        fontSize = 13.sp,
                        color = TextMuted
                    )
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    FilterChip(
                        selected = selectedCategoryFilter == null,
                        onClick = { selectedCategoryFilter = null },
                        label = { Text("All (${gear.size})", fontSize = 11.sp) }
                    )
                    GearCategory.values().take(3).forEach { category ->
                        val count = gear.count { it.category == category }
                        FilterChip(
                            selected = selectedCategoryFilter == category,
                            onClick = { selectedCategoryFilter = category },
                            label = { Text("${category.displayName} ($count)", fontSize = 11.sp) }
                        )
                    }
                }
            }

            if (filteredGear.isEmpty()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "No equipment matches the selected category filter.",
                            modifier = Modifier.padding(24.dp),
                            color = TextMuted,
                            fontSize = 14.sp
                        )
                    }
                }
            } else {
                items(filteredGear, key = { it.id }) { item ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        shape = RoundedCornerShape(16.dp),
                        elevation = CardDefaults.cardElevation(2.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (item.image.isNotEmpty()) {
                                AsyncImage(
                                    model = item.image,
                                    contentDescription = item.name,
                                    modifier = Modifier
                                        .size(70.dp)
                                        .clip(RoundedCornerShape(10.dp)),
                                    contentScale = ContentScale.Crop
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Surface(
                                    color = TealLight,
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = item.category.displayName,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TealPrimary,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = item.name,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextDark
                                )
                                if (item.serialNumber.isNotEmpty()) {
                                    Text(
                                        text = "S/N: ${item.serialNumber}",
                                        fontSize = 12.sp,
                                        color = TextMuted
                                    )
                                }
                                if (item.notes.isNotEmpty()) {
                                    Text(
                                        text = item.notes,
                                        fontSize = 11.sp,
                                        color = TextMuted,
                                        maxLines = 1
                                    )
                                }
                            }

                            IconButton(
                                onClick = { mainViewModel.deleteGear(item.id) },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    Icons.Default.Delete,
                                    contentDescription = "Delete",
                                    tint = CriticalRed,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (isExifPresetModalOpen) {
        AlertDialog(
            onDismissRequest = { isExifPresetModalOpen = false },
            title = { Text("ExifTool Sample Camera Parser") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Select a flagship camera preset to auto-import EXIF hardware specs and body/lens serial numbers:", fontSize = 12.sp, color = TextMuted)
                    Spacer(modifier = Modifier.height(4.dp))
                    LazyColumn(modifier = Modifier.heightIn(max = 280.dp)) {
                        items(ExifToolService.PRESETS) { preset ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = TealLight),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .clickable {
                                        val newGear = ExifToolService.createGearFromPreset(preset)
                                        mainViewModel.addGear(newGear)
                                        isExifPresetModalOpen = false
                                    }
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text(preset.name, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TealPrimary)
                                    Text("S/N: ${preset.bodySerialNumber} • ${preset.shutterCount} actuations", fontSize = 11.sp, color = TextDark)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { isExifPresetModalOpen = false }) { Text("Close") }
            }
        )
    }
}
