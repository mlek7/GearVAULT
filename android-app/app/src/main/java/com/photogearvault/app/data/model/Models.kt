package com.photogearvault.app.data.model

import com.google.gson.annotations.SerializedName

enum class GearCategory(val displayName: String) {
    @SerializedName("Camera Body")
    CAMERA_BODY("Camera Body"),

    @SerializedName("Lens")
    LENS("Lens"),

    @SerializedName("Lighting")
    LIGHTING("Lighting"),

    @SerializedName("Audio")
    AUDIO("Audio"),

    @SerializedName("Batteries/Memory Cards")
    BATTERIES_CARDS("Batteries/Memory Cards"),

    @SerializedName("Accessories")
    ACCESSORIES("Accessories");

    companion object {
        fun fromString(value: String): GearCategory {
            return values().find { it.displayName.equals(value, ignoreCase = true) } ?: ACCESSORIES
        }
    }
}

data class GearExifMetadata(
    val cameraMake: String? = null,
    val cameraModel: String? = null,
    val lensModel: String? = null,
    val lensSerialNumber: String? = null,
    val bodySerialNumber: String? = null,
    val shutterCount: Int? = null,
    val firmwareVersion: String? = null,
    val focalLength: String? = null,
    val maxAperture: String? = null,
    val iso: Int? = null,
    val shutterSpeed: String? = null,
    val verifiedAt: String? = null
)

data class GearItem(
    val id: String,
    val name: String,
    val category: GearCategory,
    val serialNumber: String = "",
    val image: String = "",
    val notes: String = "",
    val brand: String? = null,
    val createdAt: String,
    val exifMetadata: GearExifMetadata? = null
)

enum class ShootType(val displayName: String) {
    WEDDING("Wedding"),
    PORTRAIT("Portrait"),
    COMMERCIAL("Commercial"),
    FASHION("Fashion"),
    EVENT("Event"),
    EDITORIAL("Editorial"),
    LANDSCAPE("Landscape");

    companion object {
        fun fromString(value: String): String {
            return values().find { it.displayName.equals(value, ignoreCase = true) }?.displayName ?: value
        }
    }
}

data class Shoot(
    val id: String,
    val title: String,
    val clientName: String,
    val dateTime: String, // ISO format: YYYY-MM-DDTHH:mm
    val location: String,
    val shootType: String,
    val generalNotes: String = "",
    val createdAt: String
)

enum class PackingStatus(val displayName: String) {
    @SerializedName("Needed")
    NEEDED("Needed"),

    @SerializedName("Packed")
    PACKED("Packed"),

    @SerializedName("Missing")
    MISSING("Missing");

    companion object {
        fun fromString(value: String): PackingStatus {
            return values().find { it.displayName.equals(value, ignoreCase = true) } ?: NEEDED
        }
    }
}

data class PackingItem(
    val id: String,
    val shootId: String,
    val gearId: String,
    val status: PackingStatus,
    val customNotes: String? = null
)

data class MoodboardItem(
    val id: String,
    val shootId: String,
    val imageUrl: String,
    val caption: String = "",
    val externalLink: String? = null,
    val colorPalette: List<String>? = null,
    val category: String? = null,
    val createdAt: String
)

data class AlertNotification(
    val id: String,
    val shootId: String,
    val shootTitle: String,
    val type: String, // morning_review, two_hour_critical, custom_check
    val title: String,
    val message: String,
    val timestamp: String,
    val missingItems: List<String>? = null,
    val read: Boolean = false,
    val priority: String = "normal" // normal, high, critical
)

data class UserProfile(
    val id: String,
    val email: String,
    val name: String,
    val avatarUrl: String? = null,
    val provider: String, // google, apple, email
    val role: String? = null,
    val studioName: String? = null,
    val createdAt: String,
    val lastLoginAt: String
)

data class RegisteredAccount(
    val user: UserProfile,
    val passwordHash: String? = null
)

data class AppSettings(
    val morningAlertTime: String = "06:00",
    val enableMorningAlerts: Boolean = true,
    val enableTwoHourCriticalAlert: Boolean = true,
    val photographerName: String = "Alex Vance",
    val studioName: String = "Vance Commercial Photography",
    val soundEnabled: Boolean = true
)

enum class NavigationTab(val route: String, val title: String) {
    DASHBOARD("dashboard", "Dashboard"),
    CALENDAR("calendar", "Calendar"),
    WEATHER("weather", "Weather"),
    GEAR_VAULT("gear_vault", "Gear Vault"),
    SETTINGS("settings", "Settings")
}

data class WeatherHourlyItem(
    val time: String,
    val tempF: Int,
    val conditionCode: String,
    val conditionText: String,
    val isGoldenHour: Boolean = false,
    val isBlueHour: Boolean = false,
    val rainProb: Int,
    val lightType: String
)

data class WeatherDailyItem(
    val dayName: String,
    val dateStr: String,
    val tempHighF: Int,
    val tempLowF: Int,
    val conditionCode: String,
    val conditionText: String,
    val goldenHour: String,
    val rainProb: Int
)

data class WeatherForecastData(
    val locationName: String,
    val shootDate: String? = null,
    val temperatureF: Int,
    val temperatureC: Int,
    val conditionText: String,
    val conditionCode: String,
    val precipitationProb: Int,
    val windSpeedMph: Int,
    val windGustMph: Int,
    val humidity: Int,
    val uvIndex: Int,
    val sunrise: String,
    val sunset: String,
    val goldenHourMorning: String,
    val goldenHourEvening: String,
    val blueHourEvening: String,
    val lightingQuality: String,
    val gearRecommendations: List<String>,
    val hourly: List<WeatherHourlyItem>,
    val daily: List<WeatherDailyItem>
)
