package com.photogearvault.app.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.photogearvault.app.data.model.*
import com.photogearvault.app.data.repository.StorageRepository
import com.photogearvault.app.data.service.WeatherService
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = StorageRepository(application)
    private val weatherService = WeatherService()

    private val _currentTab = MutableStateFlow(NavigationTab.DASHBOARD)
    val currentTab: StateFlow<NavigationTab> = _currentTab.asStateFlow()

    private val _activeShootId = MutableStateFlow<String?>(null)
    val activeShootId: StateFlow<String?> = _activeShootId.asStateFlow()

    private val _gear = MutableStateFlow<List<GearItem>>(repository.getGear())
    val gear: StateFlow<List<GearItem>> = _gear.asStateFlow()

    private val _shoots = MutableStateFlow<List<Shoot>>(repository.getShoots())
    val shoots: StateFlow<List<Shoot>> = _shoots.asStateFlow()

    private val _packing = MutableStateFlow<List<PackingItem>>(repository.getPacking())
    val packing: StateFlow<List<PackingItem>> = _packing.asStateFlow()

    private val _moodboards = MutableStateFlow<List<MoodboardItem>>(repository.getMoodboards())
    val moodboards: StateFlow<List<MoodboardItem>> = _moodboards.asStateFlow()

    private val _settings = MutableStateFlow<AppSettings>(repository.getSettings())
    val settings: StateFlow<AppSettings> = _settings.asStateFlow()

    private val _dismissedAlertIds = MutableStateFlow<Set<String>>(emptySet())
    private val _simulatedAlerts = MutableStateFlow<List<AlertNotification>>(emptyList())

    // Active Alerts computed dynamically
    @Suppress("UNCHECKED_CAST")
    val activeAlerts: StateFlow<List<AlertNotification>> = combine(
        _shoots, _packing, _gear, _settings, _dismissedAlertIds, _simulatedAlerts
    ) { flows: Array<Any> ->
        val shootsList = flows[0] as List<Shoot>
        val packingList = flows[1] as List<PackingItem>
        val gearList = flows[2] as List<GearItem>
        val currentSettings = flows[3] as AppSettings
        val dismissedSet = flows[4] as Set<String>
        val simulatedList = flows[5] as List<AlertNotification>

        val computed = evaluateShootAlerts(shootsList, packingList, gearList, currentSettings)
        val combined = simulatedList + computed
        val seen = mutableSetOf<String>()
        combined.filter { alert ->
            if (seen.contains(alert.id)) return@filter false
            seen.add(alert.id)
            !dismissedSet.contains(alert.id)
        }
    }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    // Weather state
    private val _weatherData = MutableStateFlow<WeatherForecastData?>(null)
    val weatherData: StateFlow<WeatherForecastData?> = _weatherData.asStateFlow()

    private val _isWeatherLoading = MutableStateFlow(false)
    val isWeatherLoading: StateFlow<Boolean> = _isWeatherLoading.asStateFlow()

    // Navigation and Tab Handling
    fun setTab(tab: NavigationTab) {
        _activeShootId.value = null
        _currentTab.value = tab
    }

    fun openShoot(shootId: String) {
        _activeShootId.value = shootId
    }

    fun closeShootHub() {
        _activeShootId.value = null
    }

    // --- Gear Vault Actions ---
    fun addGear(item: GearItem) {
        val updated = listOf(item) + _gear.value
        _gear.value = updated
        repository.saveGear(updated)
    }

    fun updateGear(updatedItem: GearItem) {
        val updated = _gear.value.map { if (it.id == updatedItem.id) updatedItem else it }
        _gear.value = updated
        repository.saveGear(updated)
    }

    fun deleteGear(gearId: String) {
        val updatedGear = _gear.value.filter { it.id != gearId }
        _gear.value = updatedGear
        repository.saveGear(updatedGear)

        val updatedPacking = _packing.value.filter { it.gearId != gearId }
        _packing.value = updatedPacking
        repository.savePacking(updatedPacking)
    }

    // --- Shoot Actions ---
    fun addShoot(shoot: Shoot) {
        val updated = listOf(shoot) + _shoots.value
        _shoots.value = updated
        repository.saveShoots(updated)
    }

    fun updateShoot(updatedShoot: Shoot) {
        val updated = _shoots.value.map { if (it.id == updatedShoot.id) updatedShoot else it }
        _shoots.value = updated
        repository.saveShoots(updated)
    }

    fun deleteShoot(shootId: String) {
        val updatedShoots = _shoots.value.filter { it.id != shootId }
        _shoots.value = updatedShoots
        repository.saveShoots(updatedShoots)

        val updatedPacking = _packing.value.filter { it.shootId != shootId }
        _packing.value = updatedPacking
        repository.savePacking(updatedPacking)

        val updatedMoodboards = _moodboards.value.filter { it.shootId != shootId }
        _moodboards.value = updatedMoodboards
        repository.saveMoodboards(updatedMoodboards)

        if (_activeShootId.value == shootId) {
            _activeShootId.value = null
        }
    }

    // --- Packing Actions ---
    fun updatePackingItem(updatedItem: PackingItem) {
        val updated = _packing.value.map { if (it.id == updatedItem.id) updatedItem else it }
        _packing.value = updated
        repository.savePacking(updated)
    }

    fun addPackingItems(newItems: List<PackingItem>) {
        val updated = newItems + _packing.value
        _packing.value = updated
        repository.savePacking(updated)
    }

    fun deletePackingItem(id: String) {
        val updated = _packing.value.filter { it.id != id }
        _packing.value = updated
        repository.savePacking(updated)
    }

    // --- Moodboard Actions ---
    fun addMoodboardItem(item: MoodboardItem) {
        val updated = listOf(item) + _moodboards.value
        _moodboards.value = updated
        repository.saveMoodboards(updated)
    }

    fun deleteMoodboardItem(id: String) {
        val updated = _moodboards.value.filter { it.id != id }
        _moodboards.value = updated
        repository.saveMoodboards(updated)
    }

    // --- Settings Actions ---
    fun updateSettings(newSettings: AppSettings) {
        _settings.value = newSettings
        repository.saveSettings(newSettings)
    }

    fun resetData() {
        repository.resetAll()
        _gear.value = repository.getGear()
        _shoots.value = repository.getShoots()
        _packing.value = repository.getPacking()
        _moodboards.value = repository.getMoodboards()
        _settings.value = repository.getSettings()
        _dismissedAlertIds.value = emptySet()
        _simulatedAlerts.value = emptyList()
        _activeShootId.value = null
    }

    // --- Alert Actions ---
    fun dismissAlert(alertId: String) {
        _dismissedAlertIds.value = _dismissedAlertIds.value + alertId
        _simulatedAlerts.value = _simulatedAlerts.value.filter { it.id != alertId }
    }

    fun triggerSimulatedAlert(type: String) {
        val targetShoot = _shoots.value.firstOrNull() ?: Shoot(
            id = "demo-shoot",
            title = "Commercial Fashion Editorial",
            clientName = "Atelier Vogue",
            dateTime = "2026-09-19T16:00",
            location = "Studio 4, San Francisco",
            shootType = "Commercial",
            generalNotes = "3 model looks",
            createdAt = "2026-09-19T10:00:00Z"
        )

        val alert: AlertNotification
        if (type == "two_hour_critical") {
            alert = AlertNotification(
                id = "sim-critical-${System.currentTimeMillis()}",
                shootId = targetShoot.id,
                shootTitle = targetShoot.title,
                type = "two_hour_critical",
                priority = "critical",
                title = "HIGH-PRIORITY: Shoot starts in 1h 45m!",
                message = "Crucial items for \"${targetShoot.title}\" are still marked as Needed or Missing. Check packing immediately!",
                missingItems = listOf(
                    "Profoto B10X Plus 500Ws Strobe (Missing)",
                    "Sony FE 24-70mm f/2.8 GM II (Needed)",
                    "Peak Design Carbon Tripod (Needed)"
                ),
                timestamp = java.time.Instant.now().toString(),
                read = false
            )
        } else {
            alert = AlertNotification(
                id = "sim-morning-${System.currentTimeMillis()}",
                shootId = targetShoot.id,
                shootTitle = targetShoot.title,
                type = "morning_review",
                priority = "high",
                title = "Morning Call (${_settings.value.morningAlertTime} AM): \"${targetShoot.title}\"",
                message = "Good morning! You have a booked shoot today. Please verify and pack all camera bodies, lenses, and batteries.",
                missingItems = listOf("Sony FE 24-70mm f/2.8 GM II", "Profoto B10X Plus"),
                timestamp = java.time.Instant.now().toString(),
                read = false
            )
        }
        _simulatedAlerts.value = listOf(alert) + _simulatedAlerts.value
    }

    // --- Weather Actions ---
    fun fetchWeather(location: String) {
        viewModelScope.launch {
            _isWeatherLoading.value = true
            val data = weatherService.getPhotographyWeather(location)
            _weatherData.value = data
            _isWeatherLoading.value = false
        }
    }

    // Internal Alert Evaluator logic
    private fun evaluateShootAlerts(
        shoots: List<Shoot>,
        packingList: List<PackingItem>,
        gearList: List<GearItem>,
        settings: AppSettings
    ): List<AlertNotification> {
        val alerts = mutableListOf<AlertNotification>()
        val gearMap = gearList.associateBy { it.id }

        shoots.forEach { shoot ->
            val shootPacking = packingList.filter { it.shootId == shoot.id }
            val missingOrNeeded = shootPacking.filter { it.status == PackingStatus.NEEDED || it.status == PackingStatus.MISSING }
            val missingNames = missingOrNeeded.map { gearMap[it.gearId]?.name ?: "Gear Item" }.take(5)

            // Critical alert
            if (settings.enableTwoHourCriticalAlert && missingOrNeeded.isNotEmpty()) {
                alerts.add(
                    AlertNotification(
                        id = "alert-critical-${shoot.id}",
                        shootId = shoot.id,
                        shootTitle = shoot.title,
                        type = "two_hour_critical",
                        priority = "critical",
                        title = "CRITICAL GEAR ALERT: Shoot approaching",
                        message = "${missingOrNeeded.size} item(s) are NOT packed yet for \"${shoot.title}\". Pack immediately!",
                        missingItems = missingNames,
                        timestamp = java.time.Instant.now().toString(),
                        read = false
                    )
                )
            }

            // Morning review alert
            if (settings.enableMorningAlerts) {
                alerts.add(
                    AlertNotification(
                        id = "alert-morning-${shoot.id}",
                        shootId = shoot.id,
                        shootTitle = shoot.title,
                        type = "morning_review",
                        priority = "high",
                        title = "Morning Call: \"${shoot.title}\"",
                        message = "Your shoot with ${shoot.clientName} is coming up. Review and finalize your gear packing list.",
                        missingItems = missingNames,
                        timestamp = java.time.Instant.now().toString(),
                        read = false
                    )
                )
            }
        }

        return alerts
    }
}
