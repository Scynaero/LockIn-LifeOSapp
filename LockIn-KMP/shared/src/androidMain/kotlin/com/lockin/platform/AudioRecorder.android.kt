package com.lockin.platform

import android.content.Context
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.os.Build
import java.io.File

actual class AudioRecorder(private val context: Context) {

    private var recorder: MediaRecorder? = null
    private var player: MediaPlayer? = null
    private var currentOutputPath: String? = null
    private var recording = false

    actual fun startRecording(outputPath: String) {
        currentOutputPath = outputPath
        recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setAudioSamplingRate(44100)
            setAudioEncodingBitRate(128000)
            setOutputFile(outputPath)
            prepare()
            start()
        }
        recording = true
    }

    actual fun stopRecording(): String? {
        return try {
            recorder?.apply {
                stop()
                release()
            }
            recorder = null
            recording = false
            currentOutputPath
        } catch (e: Exception) {
            recorder?.release()
            recorder = null
            recording = false
            null
        }
    }

    actual fun isRecording(): Boolean = recording

    actual fun play(filePath: String) {
        stopPlayback()
        player = MediaPlayer().apply {
            setDataSource(filePath)
            prepare()
            start()
        }
    }

    actual fun stopPlayback() {
        player?.apply {
            if (isPlaying) stop()
            release()
        }
        player = null
    }

    actual fun release() {
        stopRecording()
        stopPlayback()
    }
}
