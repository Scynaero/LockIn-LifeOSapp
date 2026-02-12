package com.lockin

import android.app.Application
import com.lockin.di.initKoin
import com.lockin.ui.di.uiModule
import org.koin.android.ext.koin.androidContext
import org.koin.android.ext.koin.androidLogger

class LockInApp : Application() {
    override fun onCreate() {
        super.onCreate()
        initKoin(additionalModules = listOf(uiModule)) {
            androidLogger()
            androidContext(this@LockInApp)
        }
    }
}
