package com.lockin.platform

actual class AudioRecorder {
    actual fun startRecording(outputPath: String) {
        // iOS: Use AVAudioRecorder
        // TODO: Implement with AVAudioSession + AVAudioRecorder
    }

    actual fun stopRecording(): String? {
        // TODO: Stop AVAudioRecorder and return file path
        return null
    }

    actual fun isRecording(): Boolean = false

    actual fun play(filePath: String) {
        // iOS: Use AVAudioPlayer
        // TODO: Implement with AVAudioPlayer
    }

    actual fun stopPlayback() {
        // TODO: Stop AVAudioPlayer
    }

    actual fun release() {
        // TODO: Release AVAudioSession
    }
}
