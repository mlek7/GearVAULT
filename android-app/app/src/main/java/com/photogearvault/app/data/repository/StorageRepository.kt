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

    private fun getInitialGear(): List<GearItem> = emptyList()

    private fun getInitialShoots(): List<Shoot> = emptyList()

    private fun getInitialPacking(): List<PackingItem> = emptyList()

    private fun getInitialMoodboards(): List<MoodboardItem> = emptyList()
}
