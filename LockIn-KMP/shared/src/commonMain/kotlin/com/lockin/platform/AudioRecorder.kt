package com.lockin.platform

/**
 * Records and plays back audio for voice notes.
 */
expect class AudioRecorder {
    /**
     * Start recording audio to a file.
     * @param outputPath File path to save the recording to.
     */
    fun startRecording(outputPath: String)

    /**
     * Stop the current recording.
     * @return The file path of the saved recording, or null if nothing was recording.
     */
    fun stopRecording(): String?

    /**
     * Whether the recorder is currently recording.
     */
    fun isRecording(): Boolean

    /**
     * Play an audio file.
     * @param filePath Path to the audio file.
     */
    fun play(filePath: String)

    /**
     * Stop playback.
     */
    fun stopPlayback()

    /**
     * Release all resources.
     */
    fun release()
}
