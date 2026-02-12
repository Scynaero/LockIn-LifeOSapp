package com.lockin.platform

/**
 * Encrypted key-value storage for sensitive data like PINs.
 */
expect class SecureStorage {
    /**
     * Store a value securely.
     * @param key The key to store under.
     * @param value The value to store.
     */
    fun put(key: String, value: String)

    /**
     * Retrieve a securely stored value.
     * @param key The key to retrieve.
     * @return The stored value, or null if not found.
     */
    fun get(key: String): String?

    /**
     * Remove a securely stored value.
     */
    fun remove(key: String)

    /**
     * Check if a key exists in secure storage.
     */
    fun contains(key: String): Boolean
}
