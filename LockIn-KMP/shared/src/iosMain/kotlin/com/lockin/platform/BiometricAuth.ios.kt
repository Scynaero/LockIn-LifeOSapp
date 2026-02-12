package com.lockin.platform

actual class BiometricAuth {
    actual fun isAvailable(): Boolean = false

    actual fun authenticate(
        title: String,
        subtitle: String,
        onResult: (Boolean) -> Unit
    ) {
        // iOS: Use LocalAuthentication framework
        // TODO: Implement with LAContext.evaluatePolicy
        onResult(false)
    }
}
