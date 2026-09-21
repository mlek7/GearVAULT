package com.photogearvault.app.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.photogearvault.app.data.model.*

class StorageRepository(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("shutterhub_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        private const val KEY_GEAR = "shutterhub_gear"
        private const val KEY_SHOOTS = "shutterhub_shoots"
        private const val KEY_PACKING = "shutterhub_packing"
        private const val KEY_MOODBOARDS = "shutterhub_moodboards"
        private const val KEY_SETTINGS = "shutterhub_settings"
        private const val KEY_NOTIFICATIONS = "shutterhub_notifications"
        private const val KEY_AUTH_USER = "shutterhub_auth_user"
        private const val KEY_ACCOUNTS = "shutterhub_registered_accounts"
    }

    init {
        if (!prefs.contains(KEY_GEAR)) {
            saveGear(getInitialGear())
        }
        if (!prefs.contains(KEY_SHOOTS)) {
            saveShoots(getInitialShoots())
        }
        if (!prefs.contains(KEY_PACKING)) {
            savePacking(getInitialPacking())
        }
        if (!prefs.contains(KEY_MOODBOARDS)) {
            saveMoodboards(getInitialMoodboards())
        }
        if (!prefs.contains(KEY_SETTINGS)) {
            saveSettings(AppSettings())
        }
    }

    fun getGear(): List<GearItem> {
        val json = prefs.getString(KEY_GEAR, null) ?: return getInitialGear()
        val type = object : TypeToken<List<GearItem>>() {}.type
        return try { gson.fromJson(json, type) } catch (e: Exception) { getInitialGear() }
    }

    fun saveGear(items: List<GearItem>) {
        prefs.edit().putString(KEY_GEAR, gson.toJson(items)).apply()
    }

    fun getShoots(): List<Shoot> {
        val json = prefs.getString(KEY_SHOOTS, null) ?: return getInitialShoots()
        val type = object : TypeToken<List<Shoot>>() {}.type
        return try { gson.fromJson(json, type) } catch (e: Exception) { getInitialShoots() }
    }

    fun saveShoots(shoots: List<Shoot>) {
        prefs.edit().putString(KEY_SHOOTS, gson.toJson(shoots)).apply()
    }

    fun getPacking(): List<PackingItem> {
        val json = prefs.getString(KEY_PACKING, null) ?: return getInitialPacking()
        val type = object : TypeToken<List<PackingItem>>() {}.type
        return try { gson.fromJson(json, type) } catch (e: Exception) { getInitialPacking() }
    }

    fun savePacking(items: List<PackingItem>) {
        prefs.edit().putString(KEY_PACKING, gson.toJson(items)).apply()
    }

    fun getMoodboards(): List<MoodboardItem> {
        val json = prefs.getString(KEY_MOODBOARDS, null) ?: return getInitialMoodboards()
        val type = object : TypeToken<List<MoodboardItem>>() {}.type
        return try { gson.fromJson(json, type) } catch (e: Exception) { getInitialMoodboards() }
    }

    fun saveMoodboards(items: List<MoodboardItem>) {
        prefs.edit().putString(KEY_MOODBOARDS, gson.toJson(items)).apply()
    }

    fun getSettings(): AppSettings {
        val json = prefs.getString(KEY_SETTINGS, null) ?: return AppSettings()
        return try { gson.fromJson(json, AppSettings::class.java) } catch (e: Exception) { AppSettings() }
    }

    fun saveSettings(settings: AppSettings) {
        prefs.edit().putString(KEY_SETTINGS, gson.toJson(settings)).apply()
    }

    fun getCurrentUser(): UserProfile? {
        val json = prefs.getString(KEY_AUTH_USER, null) ?: return null
        return try { gson.fromJson(json, UserProfile::class.java) } catch (e: Exception) { null }
    }

    fun setCurrentUser(user: UserProfile?) {
        if (user == null) {
            prefs.edit().remove(KEY_AUTH_USER).apply()
        } else {
            prefs.edit().putString(KEY_AUTH_USER, gson.toJson(user)).apply()
        }
    }

    fun getRegisteredAccounts(): List<RegisteredAccount> {
        val json = prefs.getString(KEY_ACCOUNTS, null) ?: return emptyList()
        val type = object : TypeToken<List<RegisteredAccount>>() {}.type
        return try { gson.fromJson(json, type) } catch (e: Exception) { emptyList() }
    }

    fun saveRegisteredAccounts(accounts: List<RegisteredAccount>) {
        prefs.edit().putString(KEY_ACCOUNTS, gson.toJson(accounts)).apply()
    }

    fun resetAll() {
        saveGear(getInitialGear())
        saveShoots(getInitialShoots())
        savePacking(getInitialPacking())
        saveMoodboards(getInitialMoodboards())
        saveSettings(AppSettings())
    }

    private fun getInitialGear(): List<GearItem> = listOf(
        GearItem(
            id = "gear-1",
            name = "Sony Alpha 1 Flagship Mirrorless Body",
            category = GearCategory.CAMERA_BODY,
            serialNumber = "SN-S1-904821",
            image = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
            notes = "Primary body. 50.1MP full-frame sensor. Dual slot CFexpress/SD.",
            brand = "Sony",
            createdAt = "2026-01-10T10:00:00Z",
            exifMetadata = GearExifMetadata(
                cameraMake = "Sony",
                cameraModel = "ILCE-1 (Alpha 1)",
                bodySerialNumber = "SN-S1-904821",
                shutterCount = 18420,
                firmwareVersion = "Ver. 2.01",
                verifiedAt = "2026-03-01T10:00:00Z"
            )
        ),
        GearItem(
            id = "gear-2",
            name = "Sony FX3 Cinema Line Camera",
            category = GearCategory.CAMERA_BODY,
            serialNumber = "SN-FX-339102",
            image = "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80",
            notes = "Secondary body / video A-cam. Active cooling fan & XLR handle.",
            brand = "Sony",
            createdAt = "2026-01-15T12:00:00Z",
            exifMetadata = GearExifMetadata(
                cameraMake = "Sony",
                cameraModel = "ILME-FX3 (Cinema Line)",
                bodySerialNumber = "SN-FX-339102",
                shutterCount = 6140,
                firmwareVersion = "Ver. 4.00",
                verifiedAt = "2026-03-02T14:30:00Z"
            )
        ),
        GearItem(
            id = "gear-3",
            name = "Sony FE 24-70mm f/2.8 GM II",
            category = GearCategory.LENS,
            serialNumber = "SN-GM-771829",
            image = "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=600&q=80",
            notes = "Workhorse standard zoom. Nano AR Coating II, 82mm filter thread.",
            brand = "Sony G Master",
            createdAt = "2026-01-18T09:30:00Z",
            exifMetadata = GearExifMetadata(
                lensModel = "FE 24-70mm F2.8 GM II (SEL2470GM2)",
                lensSerialNumber = "SN-GM-771829",
                focalLength = "24-70mm",
                maxAperture = "f/2.8",
                verifiedAt = "2026-03-01T10:00:00Z"
            )
        ),
        GearItem(
            id = "gear-4",
            name = "Sony FE 70-200mm f/2.8 GM OSS II",
            category = GearCategory.LENS,
            serialNumber = "SN-GM-449103",
            image = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
            notes = "Telephoto zoom for ceremony portraits & compression. Featherweight version II.",
            brand = "Sony G Master",
            createdAt = "2026-02-01T14:20:00Z"
        ),
        GearItem(
            id = "gear-5",
            name = "Sony FE 50mm f/1.2 GM Prime",
            category = GearCategory.LENS,
            serialNumber = "SN-GM-501294",
            image = "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=600&q=80",
            notes = "Dreamy bokeh for bridal portraits & low-light editorial.",
            brand = "Sony G Master",
            createdAt = "2026-02-12T11:00:00Z"
        ),
        GearItem(
            id = "gear-6",
            name = "Profoto B10X Plus 500Ws AirTTL Monolight",
            category = GearCategory.LIGHTING,
            serialNumber = "SN-PF-882049",
            image = "https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&w=600&q=80",
            notes = "High-speed sync battery-powered strobe with 3250-lumen modeling light.",
            brand = "Profoto",
            createdAt = "2026-02-20T16:45:00Z"
        ),
        GearItem(
            id = "gear-7",
            name = "Godox AD200Pro II Pocket Flash Kit",
            category = GearCategory.LIGHTING,
            serialNumber = "SN-GD-200847",
            image = "https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=600&q=80",
            notes = "Compact rim/hair light. Dual bare bulb and speedlite fresnel heads.",
            brand = "Godox",
            createdAt = "2026-03-01T10:15:00Z"
        ),
        GearItem(
            id = "gear-8",
            name = "DJI Mic 2 Wireless Microphone (2 TX + 1 RX)",
            category = GearCategory.AUDIO,
            serialNumber = "SN-DJ-903481",
            image = "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80",
            notes = "32-bit float internal recording. Dual transmitters with magnetic clips.",
            brand = "DJI",
            createdAt = "2026-03-05T13:00:00Z"
        ),
        GearItem(
            id = "gear-10",
            name = "Sony NP-FZ100 Batteries (Set of 4 + Dual Charger)",
            category = GearCategory.BATTERIES_CARDS,
            serialNumber = "SN-BT-FZ100X4",
            image = "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=600&q=80",
            notes = "2280mAh genuine packs. Always verified 100% health in battery case.",
            brand = "Sony",
            createdAt = "2026-03-12T09:00:00Z"
        ),
        GearItem(
            id = "gear-11",
            name = "Sony TOUGH CFexpress Type A 160GB (x2)",
            category = GearCategory.BATTERIES_CARDS,
            serialNumber = "SN-CF-160TGH",
            image = "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80",
            notes = "800MB/s read, 700MB/s write. Rugged IP68 waterproof / bend-proof card.",
            brand = "Sony TOUGH",
            createdAt = "2026-03-14T11:20:00Z"
        ),
        GearItem(
            id = "gear-12",
            name = "Peak Design Carbon Fiber Travel Tripod",
            category = GearCategory.ACCESSORIES,
            serialNumber = "SN-PD-772910",
            image = "https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?auto=format&fit=crop&w=600&q=80",
            notes = "Ultra-compact carbon architecture with integrated mobile mount.",
            brand = "Peak Design",
            createdAt = "2026-03-18T15:00:00Z"
        ),
        GearItem(
            id = "gear-13",
            name = "PolarPro PMVND 82mm (2-5 Stop Edition II)",
            category = GearCategory.ACCESSORIES,
            serialNumber = "SN-PP-82VND",
            image = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80",
            notes = "Zero cross-polarization haptic stop variable neutral density filter.",
            brand = "PolarPro",
            createdAt = "2026-03-22T17:10:00Z"
        )
    )

    private fun getInitialShoots(): List<Shoot> = listOf(
        Shoot(
            id = "shoot-1",
            title = "Autumn Golden Hour Editorial",
            clientName = "Atelier Vesper Paris",
            dateTime = "2026-09-19T16:00",
            location = "Point Bonita Lighthouse & Presidio Bluff, SF",
            shootType = "Fashion",
            generalNotes = "3 model looks. Coastal wind gusts up to 20 knots. Prioritize natural backlight paired with Profoto fill. Sunset at 18:42.",
            createdAt = "2026-09-10T10:00:00Z"
        ),
        Shoot(
            id = "shoot-2",
            title = "Elena & Marcus Vineyard Wedding",
            clientName = "Elena Rostova",
            dateTime = "2026-09-20T11:00",
            location = "Meadowood Napa Valley, St. Helena, CA",
            shootType = "Wedding",
            generalNotes = "First look at 11:30 AM in the olive grove. Outdoor ceremony at 2:00 PM. Reception under tent at 6:00 PM. Dual body setup required.",
            createdAt = "2026-09-12T14:00:00Z"
        ),
        Shoot(
            id = "shoot-3",
            title = "AeroTech High-Performance Brand Shoot",
            clientName = "AeroTech Dynamics Inc.",
            dateTime = "2026-09-25T09:00",
            location = "Hangar 4, Oakland International Airport",
            shootType = "Commercial",
            generalNotes = "Industrial aeronautics catalog. Safety vests mandatory on tarmac. Clean rim-lighting on carbon fuselage parts.",
            createdAt = "2026-09-15T09:00:00Z"
        ),
        Shoot(
            id = "shoot-4",
            title = "Studio Portrait Sessions: Founders Cohort",
            clientName = "Y Combinator Founders Group",
            dateTime = "2026-09-29T13:30",
            location = "Dogpatch Daylight Studios, Room 302",
            shootType = "Portrait",
            generalNotes = "14 executive headshots and duo portraits. Soft directional octabox key with 1/2 stop negative fill.",
            createdAt = "2026-09-16T11:30:00Z"
        )
    )

    private fun getInitialPacking(): List<PackingItem> = listOf(
        PackingItem("pack-1-1", "shoot-1", "gear-1", PackingStatus.PACKED),
        PackingItem("pack-1-2", "shoot-1", "gear-3", PackingStatus.PACKED),
        PackingItem("pack-1-3", "shoot-1", "gear-5", PackingStatus.PACKED),
        PackingItem("pack-1-4", "shoot-1", "gear-6", PackingStatus.MISSING, "Double check battery charge!"),
        PackingItem("pack-1-5", "shoot-1", "gear-10", PackingStatus.PACKED),
        PackingItem("pack-1-6", "shoot-1", "gear-11", PackingStatus.PACKED),
        PackingItem("pack-1-7", "shoot-1", "gear-12", PackingStatus.NEEDED),
        PackingItem("pack-1-8", "shoot-1", "gear-13", PackingStatus.NEEDED),

        PackingItem("pack-2-1", "shoot-2", "gear-1", PackingStatus.NEEDED),
        PackingItem("pack-2-2", "shoot-2", "gear-2", PackingStatus.NEEDED),
        PackingItem("pack-2-3", "shoot-2", "gear-3", PackingStatus.NEEDED),
        PackingItem("pack-2-4", "shoot-2", "gear-4", PackingStatus.NEEDED),
        PackingItem("pack-2-5", "shoot-2", "gear-8", PackingStatus.NEEDED),
        PackingItem("pack-2-6", "shoot-2", "gear-10", PackingStatus.NEEDED),
        PackingItem("pack-2-7", "shoot-2", "gear-11", PackingStatus.NEEDED),

        PackingItem("pack-3-1", "shoot-3", "gear-1", PackingStatus.NEEDED),
        PackingItem("pack-3-2", "shoot-3", "gear-6", PackingStatus.NEEDED),
        PackingItem("pack-3-3", "shoot-3", "gear-7", PackingStatus.NEEDED)
    )

    private fun getInitialMoodboards(): List<MoodboardItem> = listOf(
        MoodboardItem(
            id = "mb-1-1",
            shootId = "shoot-1",
            imageUrl = "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
            caption = "Trench coat movement against coastal grass and warm dusk wind.",
            externalLink = "https://pinterest.com/pin/editorial-autumn-fashion-bluff",
            colorPalette = listOf("#C29B7F", "#5E4B3C", "#E2D4C3", "#23201D"),
            category = "Posing",
            createdAt = "2026-09-11T12:00:00Z"
        ),
        MoodboardItem(
            id = "mb-1-2",
            shootId = "shoot-1",
            imageUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
            caption = "Close-up rim light glow through wild hair strands. f/1.4 aperture reference.",
            externalLink = "https://behance.net/gallery/editorial-golden-hour",
            colorPalette = listOf("#E69C24", "#7D470D", "#1F1A16", "#FBE9D0"),
            category = "Lighting",
            createdAt = "2026-09-11T12:15:00Z"
        ),
        MoodboardItem(
            id = "mb-1-3",
            shootId = "shoot-1",
            imageUrl = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
            caption = "Sculptural silhouette pose with architectural drape coat.",
            externalLink = "https://pinterest.com/pin/architectural-silhouette-fashion",
            colorPalette = listOf("#D67D3E", "#2B2B2B", "#EAE0D5", "#8C4F27"),
            category = "Styling",
            createdAt = "2026-09-12T14:30:00Z"
        ),
        MoodboardItem(
            id = "mb-1-4",
            shootId = "shoot-1",
            imageUrl = "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80",
            caption = "Wide atmospheric environmental shot with ocean mist.",
            externalLink = "https://pinterest.com/pin/atmospheric-coastal-fashion",
            colorPalette = listOf("#708090", "#B0C4DE", "#2F4F4F", "#F5F5F0"),
            category = "Location",
            createdAt = "2026-09-13T09:40:00Z"
        ),
        MoodboardItem(
            id = "mb-2-1",
            shootId = "shoot-2",
            imageUrl = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
            caption = "Romantic candid walk through sunlit olive trees.",
            externalLink = "https://pinterest.com/pin/napa-vineyard-wedding-candid",
            colorPalette = listOf("#6B7A58", "#E9E4DC", "#C4A482", "#3D4133"),
            category = "Posing",
            createdAt = "2026-09-13T16:00:00Z"
        ),
        MoodboardItem(
            id = "mb-2-2",
            shootId = "shoot-2",
            imageUrl = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
            caption = "Warm reception tablescape with candlelight bokeh and olive branches.",
            externalLink = "https://pinterest.com/pin/napa-tablescape-candlelight",
            colorPalette = listOf("#C5A059", "#382B1E", "#EAE4D9", "#63654E"),
            category = "Color/Grade",
            createdAt = "2026-09-14T10:00:00Z"
        )
    )
}
