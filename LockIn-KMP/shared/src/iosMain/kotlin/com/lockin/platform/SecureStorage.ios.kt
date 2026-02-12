package com.lockin.platform

actual class SecureStorage {
    // iOS: Use Keychain Services via Security framework
    // TODO: Implement with SecItemAdd, SecItemCopyMatching, SecItemDelete

    private val memoryStore = mutableMapOf<String, String>()

    actual fun put(key: String, value: String) {
        memoryStore[key] = value
    }

    actual fun get(key: String): String? {
        return memoryStore[key]
    }

    actual fun remove(key: String) {
        memoryStore.remove(key)
    }

    actual fun contains(key: String): Boolean {
        return memoryStore.containsKey(key)
    }
}
