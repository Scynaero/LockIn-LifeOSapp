package com.lockin.platform

actual class LocationProvider {
    actual fun getCurrentLocation(
        onResult: (latitude: Double, longitude: Double, address: String?) -> Unit,
        onError: (String) -> Unit
    ) {
        // iOS: Use CLLocationManager
        // TODO: Implement with CLLocationManager.requestLocation
        onError("iOS location not implemented yet")
    }

    actual fun reverseGeocode(
        latitude: Double,
        longitude: Double,
        onResult: (String?) -> Unit
    ) {
        // iOS: Use CLGeocoder
        // TODO: Implement with CLGeocoder.reverseGeocodeLocation
        onResult(null)
    }
}
