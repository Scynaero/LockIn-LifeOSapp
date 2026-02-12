package com.lockin.platform

import android.annotation.SuppressLint
import android.content.Context
import android.location.Geocoder
import android.os.Build
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import java.util.Locale

actual class LocationProvider(private val context: Context) {

    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission")
    actual fun getCurrentLocation(
        onResult: (latitude: Double, longitude: Double, address: String?) -> Unit,
        onError: (String) -> Unit
    ) {
        val cancellationToken = CancellationTokenSource()
        fusedLocationClient.getCurrentLocation(
            Priority.PRIORITY_BALANCED_POWER_ACCURACY,
            cancellationToken.token
        ).addOnSuccessListener { location ->
            if (location != null) {
                reverseGeocode(location.latitude, location.longitude) { address ->
                    onResult(location.latitude, location.longitude, address)
                }
            } else {
                onError("Unable to get location")
            }
        }.addOnFailureListener { e ->
            onError(e.message ?: "Location error")
        }
    }

    actual fun reverseGeocode(
        latitude: Double,
        longitude: Double,
        onResult: (String?) -> Unit
    ) {
        try {
            val geocoder = Geocoder(context, Locale.getDefault())
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                geocoder.getFromLocation(latitude, longitude, 1) { addresses ->
                    val address = addresses.firstOrNull()?.let { addr ->
                        buildString {
                            addr.subLocality?.let { append("$it, ") }
                            addr.locality?.let { append("$it, ") }
                            addr.countryName?.let { append(it) }
                        }.trimEnd(',', ' ')
                    }
                    onResult(address)
                }
            } else {
                @Suppress("DEPRECATION")
                val addresses = geocoder.getFromLocation(latitude, longitude, 1)
                val address = addresses?.firstOrNull()?.let { addr ->
                    buildString {
                        addr.subLocality?.let { append("$it, ") }
                        addr.locality?.let { append("$it, ") }
                        addr.countryName?.let { append(it) }
                    }.trimEnd(',', ' ')
                }
                onResult(address)
            }
        } catch (e: Exception) {
            onResult(null)
        }
    }
}
