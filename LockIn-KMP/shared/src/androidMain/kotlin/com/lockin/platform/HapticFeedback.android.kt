package com.lockin.platform

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

actual class HapticFeedback(private val context: Context) {

    private val vibrator: Vibrator by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            manager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    actual fun light() {
        vibrate(20, VibrationEffect.EFFECT_TICK)
    }

    actual fun medium() {
        vibrate(40, VibrationEffect.EFFECT_CLICK)
    }

    actual fun heavy() {
        vibrate(80, VibrationEffect.EFFECT_HEAVY_CLICK)
    }

    actual fun success() {
        vibrate(50, VibrationEffect.EFFECT_CLICK)
    }

    actual fun error() {
        vibrate(100, VibrationEffect.EFFECT_DOUBLE_CLICK)
    }

    private fun vibrate(durationMs: Long, effectId: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            vibrator.vibrate(VibrationEffect.createPredefined(effectId))
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(durationMs)
        }
    }
}
