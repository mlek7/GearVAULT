package com.photogearvault.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.photogearvault.app.ui.theme.*
import com.photogearvault.app.ui.viewmodel.MainViewModel

@Composable
fun WeatherForecastScreen(mainViewModel: MainViewModel) {
    var searchQuery by remember { mutableStateOf("Presidio Bluff, San Francisco") }
    val weatherData by mainViewModel.weatherData.collectAsState()
    val isLoading by mainViewModel.isWeatherLoading.collectAsState()

    LaunchedEffect(Unit) {
        if (weatherData == null) {
            mainViewModel.fetchWeather(searchQuery)
        }
    }

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
                    text = "Photography Weather & Golden Hour",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = TealPrimary
                )
                Text(
                    text = "Atmospheric light quality, golden/blue hour, & gear advisories",
                    fontSize = 13.sp,
                    color = TextMuted
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search location...") },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )
                Button(
                    onClick = { mainViewModel.fetchWeather(searchQuery) },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = TealPrimary),
                    modifier = Modifier.height(54.dp)
                ) {
                    Icon(Icons.Default.Search, contentDescription = "Search")
                }
            }
        }

        if (isLoading) {
            item {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = TealPrimary)
                }
            }
        } else {
            weatherData?.let { data ->
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = TealPrimary),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(data.locationName, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    Text(data.conditionText, fontSize = 14.sp, color = TealLight)
                                }
                                Surface(color = TealAccent, shape = RoundedCornerShape(8.dp)) {
                                    Text(
                                        text = data.lightingQuality,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Bottom
                            ) {
                                Text("${data.temperatureF}°F", fontSize = 48.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("Wind: ${data.windSpeedMph} mph", fontSize = 12.sp, color = TealLight)
                                    Text("Precipitation: ${data.precipitationProb}%", fontSize = 12.sp, color = TealLight)
                                    Text("Humidity: ${data.humidity}%", fontSize = 12.sp, color = TealLight)
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
                        Card(
                            colors = CardDefaults.cardColors(containerColor = CardBackground),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("🌅 Morning Golden Hour", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(data.goldenHourMorning, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = HighWarningOrange)
                            }
                        }

                        Card(
                            colors = CardDefaults.cardColors(containerColor = CardBackground),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Text("🌇 Evening Golden Hour", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(data.goldenHourEvening, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = HighWarningOrange)
                            }
                        }
                    }
                }

                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBackground),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("EQUIPMENT & SHOOTING ADVISORIES", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                            Spacer(modifier = Modifier.height(10.dp))
                            data.gearRecommendations.forEach { tip ->
                                Text("• $tip", fontSize = 13.sp, color = TextDark, modifier = Modifier.padding(vertical = 2.dp))
                            }
                        }
                    }
                }

                item {
                    Column {
                        Text("HOURLY LIGHT & AMBIENT TIMELINE", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextMuted)
                        Spacer(modifier = Modifier.height(8.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(data.hourly) { hour ->
                                Card(
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (hour.isGoldenHour) HighWarningBackground else CardBackground
                                    ),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.width(110.dp)
                                ) {
                                    Column(
                                        modifier = Modifier.padding(10.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        Text(hour.time, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextDark)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text("${hour.tempF}°F", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TealPrimary)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(hour.lightType, fontSize = 11.sp, color = if (hour.isGoldenHour) HighWarningOrange else TextMuted)
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
