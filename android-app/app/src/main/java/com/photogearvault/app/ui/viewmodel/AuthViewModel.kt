package com.photogearvault.app.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.photogearvault.app.data.model.RegisteredAccount
import com.photogearvault.app.data.model.UserProfile
import com.photogearvault.app.data.repository.StorageRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID

class AuthViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = StorageRepository(application)

    private val _currentUser = MutableStateFlow<UserProfile?>(repository.getCurrentUser())
    val currentUser: StateFlow<UserProfile?> = _currentUser.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    fun clearError() {
        _errorMessage.value = null
    }

    fun loginWithGoogle(email: String, name: String) {
        viewModelScope.launch {
            val trimmedEmail = email.trim().lowercase()
            val trimmedName = name.trim()

            if (trimmedEmail.isEmpty() || !trimmedEmail.contains("@")) {
                _errorMessage.value = "Please provide a valid Google account email address."
                return@launch
            }
            if (trimmedName.isEmpty()) {
                _errorMessage.value = "Please enter your full name as registered on Google."
                return@launch
            }

            val accounts = repository.getRegisteredAccounts().toMutableList()
            val existingIdx = accounts.indexOfFirst { it.user.email.equals(trimmedEmail, ignoreCase = true) }

            val user: UserProfile
            if (existingIdx != -1) {
                user = accounts[existingIdx].user.copy(
                    name = if (trimmedName.isNotEmpty()) trimmedName else accounts[existingIdx].user.name,
                    lastLoginAt = java.time.Instant.now().toString()
                )
                accounts[existingIdx] = accounts[existingIdx].copy(user = user)
            } else {
                user = UserProfile(
                    id = "usr_google_${System.currentTimeMillis()}",
                    email = trimmedEmail,
                    name = trimmedName,
                    avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedName}",
                    provider = "google",
                    role = "Professional Photographer",
                    studioName = "$trimmedName Studio",
                    createdAt = java.time.Instant.now().toString(),
                    lastLoginAt = java.time.Instant.now().toString()
                )
                accounts.add(RegisteredAccount(user))
            }

            repository.saveRegisteredAccounts(accounts)
            repository.setCurrentUser(user)
            _currentUser.value = user
        }
    }

    fun loginWithApple(email: String, name: String, hideMyEmail: Boolean = false) {
        viewModelScope.launch {
            val trimmedEmail = email.trim().lowercase()
            val trimmedName = name.trim()

            if (trimmedEmail.isEmpty()) {
                _errorMessage.value = "Please enter a valid Apple ID."
                return@launch
            }

            val finalEmail = if (hideMyEmail) "photographer_${UUID.randomUUID().toString().take(6)}@privaterelay.appleid.com" else trimmedEmail
            val accounts = repository.getRegisteredAccounts().toMutableList()
            val existingIdx = accounts.indexOfFirst { it.user.email.equals(finalEmail, ignoreCase = true) }

            val user: UserProfile
            if (existingIdx != -1) {
                user = accounts[existingIdx].user.copy(
                    name = if (trimmedName.isNotEmpty()) trimmedName else accounts[existingIdx].user.name,
                    lastLoginAt = java.time.Instant.now().toString()
                )
                accounts[existingIdx] = accounts[existingIdx].copy(user = user)
            } else {
                user = UserProfile(
                    id = "usr_apple_${System.currentTimeMillis()}",
                    email = finalEmail,
                    name = if (trimmedName.isNotEmpty()) trimmedName else "Apple User",
                    avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedName}",
                    provider = "apple",
                    role = "Pro Photographer",
                    studioName = "${trimmedName.split(" ").firstOrNull() ?: "Apple"} Imagery",
                    createdAt = java.time.Instant.now().toString(),
                    lastLoginAt = java.time.Instant.now().toString()
                )
                accounts.add(RegisteredAccount(user))
            }

            repository.saveRegisteredAccounts(accounts)
            repository.setCurrentUser(user)
            _currentUser.value = user
        }
    }

    fun loginWithEmail(email: String, password: String) {
        viewModelScope.launch {
            val trimmedEmail = email.trim().lowercase()
            if (trimmedEmail.isEmpty() || !trimmedEmail.contains("@")) {
                _errorMessage.value = "Please enter a valid email address."
                return@launch
            }
            if (password.isEmpty()) {
                _errorMessage.value = "Please enter your password."
                return@launch
            }

            val accounts = repository.getRegisteredAccounts()
            val match = accounts.find { it.user.email.equals(trimmedEmail, ignoreCase = true) }

            if (match == null) {
                _errorMessage.value = "No account found with this email. Click 'Create Account' above to register."
                return@launch
            }

            if (match.passwordHash != null && match.passwordHash != password) {
                _errorMessage.value = "Incorrect password. Please verify your credentials and retry."
                return@launch
            }

            val updatedUser = match.user.copy(lastLoginAt = java.time.Instant.now().toString())
            repository.setCurrentUser(updatedUser)
            _currentUser.value = updatedUser
        }
    }

    fun registerWithEmail(name: String, email: String, password: String, studioName: String? = null) {
        viewModelScope.launch {
            val trimmedName = name.trim()
            val trimmedEmail = email.trim().lowercase()

            if (trimmedName.isEmpty()) {
                _errorMessage.value = "Please enter your full name."
                return@launch
            }
            if (trimmedEmail.isEmpty() || !trimmedEmail.contains("@")) {
                _errorMessage.value = "Please enter a valid email address."
                return@launch
            }
            if (password.length < 6) {
                _errorMessage.value = "Password must be at least 6 characters long."
                return@launch
            }

            val accounts = repository.getRegisteredAccounts().toMutableList()
            if (accounts.any { it.user.email.equals(trimmedEmail, ignoreCase = true) }) {
                _errorMessage.value = "An account with this email address already exists. Please sign in."
                return@launch
            }

            val newUser = UserProfile(
                id = "usr_email_${System.currentTimeMillis()}",
                email = trimmedEmail,
                name = trimmedName,
                avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedName}",
                provider = "email",
                role = "Member Photographer",
                studioName = if (studioName.isNullOrBlank()) "${trimmedName.split(" ").firstOrNull()} Photography" else studioName.trim(),
                createdAt = java.time.Instant.now().toString(),
                lastLoginAt = java.time.Instant.now().toString()
            )

            accounts.add(RegisteredAccount(user = newUser, passwordHash = password))
            repository.saveRegisteredAccounts(accounts)
            repository.setCurrentUser(newUser)
            _currentUser.value = newUser
        }
    }

    fun logout() {
        repository.setCurrentUser(null)
        _currentUser.value = null
    }

    fun switchAccount() {
        _currentUser.value = null
    }

    fun updateProfile(name: String, studioName: String) {
        val current = _currentUser.value ?: return
        val updated = current.copy(name = name, studioName = studioName)
        repository.setCurrentUser(updated)
        _currentUser.value = updated

        val accounts = repository.getRegisteredAccounts().toMutableList()
        val idx = accounts.indexOfFirst { it.user.id == current.id }
        if (idx != -1) {
            accounts[idx] = accounts[idx].copy(user = updated)
            repository.saveRegisteredAccounts(accounts)
        }
    }
}
