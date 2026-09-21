package com.photogearvault.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.photogearvault.app.data.model.GearCategory
import com.photogearvault.app.data.model.GearItem
import com.photogearvault.app.data.model.Shoot
import com.photogearvault.app.ui.theme.TealPrimary

@Composable
fun ScheduleShootModal(
    isOpen: Boolean,
    onClose: () -> Unit,
    onSave: (Shoot) -> Unit
) {
    if (!isOpen) return

    var title by remember { mutableStateOf("") }
    var clientName by remember { mutableStateOf("") }
    var dateTime by remember { mutableStateOf("2026-09-21T14:00") }
    var location by remember { mutableStateOf("") }
    var shootType by remember { mutableStateOf("Commercial") }
    var generalNotes by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onClose) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("Schedule New Shoot", style = MaterialTheme.typography.titleLarge)

                OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("Shoot Title") })
                OutlinedTextField(value = clientName, onValueChange = { clientName = it }, label = { Text("Client Name") })
                OutlinedTextField(value = dateTime, onValueChange = { dateTime = it }, label = { Text("Date/Time (YYYY-MM-DDTHH:mm)") })
                OutlinedTextField(value = location, onValueChange = { location = it }, label = { Text("Location") })
                OutlinedTextField(value = shootType, onValueChange = { shootType = it }, label = { Text("Shoot Type") })
                OutlinedTextField(value = generalNotes, onValueChange = { generalNotes = it }, label = { Text("General Notes") })

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onClose) { Text("Cancel") }
                    Button(
                        onClick = {
                            if (title.isNotEmpty() && clientName.isNotEmpty()) {
                                onSave(
                                    Shoot(
                                        id = "shoot-${System.currentTimeMillis()}",
                                        title = title,
                                        clientName = clientName,
                                        dateTime = dateTime,
                                        location = location,
                                        shootType = shootType,
                                        generalNotes = generalNotes,
                                        createdAt = java.time.Instant.now().toString()
                                    )
                                )
                                onClose()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = TealPrimary)
                    ) {
                        Text("Save Shoot")
                    }
                }
            }
        }
    }
}

@Composable
fun AddGearModal(
    isOpen: Boolean,
    onClose: () -> Unit,
    onSave: (GearItem) -> Unit
) {
    if (!isOpen) return

    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf(GearCategory.CAMERA_BODY) }
    var serialNumber by remember { mutableStateOf("") }
    var image by remember { mutableStateOf("https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80") }
    var notes by remember { mutableStateOf("") }
    var brand by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onClose) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("Add Equipment to Vault", style = MaterialTheme.typography.titleLarge)

                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Gear Name / Model") })
                OutlinedTextField(value = brand, onValueChange = { brand = it }, label = { Text("Brand / Make") })
                OutlinedTextField(value = serialNumber, onValueChange = { serialNumber = it }, label = { Text("Serial Number") })
                OutlinedTextField(value = image, onValueChange = { image = it }, label = { Text("Image URL") })
                OutlinedTextField(value = notes, onValueChange = { notes = it }, label = { Text("Notes / Specs") })

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onClose) { Text("Cancel") }
                    Button(
                        onClick = {
                            if (name.isNotEmpty()) {
                                onSave(
                                    GearItem(
                                        id = "gear-${System.currentTimeMillis()}",
                                        name = name,
                                        category = category,
                                        serialNumber = serialNumber,
                                        image = image,
                                        notes = notes,
                                        brand = brand,
                                        createdAt = java.time.Instant.now().toString()
                                    )
                                )
                                onClose()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = TealPrimary)
                    ) {
                        Text("Add Gear")
                    }
                }
            }
        }
    }
}
