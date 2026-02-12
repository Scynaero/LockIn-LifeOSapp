package com.lockin.platform

/**
 * Provides haptic (vibration) feedback for UI interactions.
 */
expect class HapticFeedback {
    /**
     * Light haptic tap — for toggles and small actions.
     */
    fun light()

    /**
     * Medium haptic tap — for confirms and selections.
     */
    fun medium()

    /**
     * Heavy haptic tap — for destructive or important actions.
     */
    fun heavy()

    /**
     * Success haptic pattern.
     */
    fun success()

    /**
     * Error haptic pattern.
     */
    fun error()
}
