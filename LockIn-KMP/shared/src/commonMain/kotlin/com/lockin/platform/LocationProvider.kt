package com.lockin.platform

/**
 * Provides device location for note geotagging.
 */
expect class LocationProvider {
    /**
     * Request a single location fix.
     * @param onResult Callback with latitude, longitude, and optional address string.
     */
    fun getCurrentLocation(
        onResult: (latitude: Double, longitude: Double, address: String?) -> Unit,
        onError: (String) -> Unit
    )

    /**
     * Reverse geocode coordinates to a human-readable address.
     */
    fun reverseGeocode(
        latitude: Double,
        longitude: Double,
        onResult: (String?) -> Unit
    )
}
