package com.lockin.model

data class Note(
    val id: String,
    val content: String,
    val createdAt: String,
    val isPinned: Boolean = false,
    val habitId: String? = null,
    val logId: String? = null,
    val reminderTime: String? = null,
    val isDeleted: Boolean = false,
    val audioUri: String? = null,
    val audioDuration: Int? = null,
    val color: String? = null,
    val locationText: String? = null
)
