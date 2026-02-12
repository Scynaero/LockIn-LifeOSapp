package com.lockin.platform

/**
 * Provides biometric (fingerprint / face) authentication for app lock.
 */
expect class BiometricAuth {
    /**
     * Returns true if the device supports biometric authentication.
     */
    fun isAvailable(): Boolean

    /**
     * Prompt the user for biometric authentication.
     * @param title Dialog title
     * @param subtitle Dialog subtitle
     * @param onResult Callback with success (true) or failure (false)
     */
    fun authenticate(
        title: String,
        subtitle: String,
        onResult: (Boolean) -> Unit
    )
}
