package com.lockin.platform

actual class HapticFeedback {
    actual fun light() {
        // iOS: UIImpactFeedbackGenerator(style: .light).impactOccurred()
        // TODO: Implement via interop
    }

    actual fun medium() {
        // iOS: UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    actual fun heavy() {
        // iOS: UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
    }

    actual fun success() {
        // iOS: UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    actual fun error() {
        // iOS: UINotificationFeedbackGenerator().notificationOccurred(.error)
    }
}
