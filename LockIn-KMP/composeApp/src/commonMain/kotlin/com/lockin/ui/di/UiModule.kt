package com.lockin.ui.di

import com.lockin.ui.screen.body.BodyScreenModel
import com.lockin.ui.screen.dashboard.DashboardScreenModel
import com.lockin.ui.screen.mind.MindScreenModel
import com.lockin.ui.screen.wallet.WalletScreenModel
import org.koin.dsl.module

val uiModule = module {
    // ScreenModels
    factory { DashboardScreenModel(get(), get(), get(), get(), get(), get(), get()) }
    factory { BodyScreenModel(get(), get(), get(), get(), get()) }
    factory { WalletScreenModel(get(), get(), get()) }
    factory { MindScreenModel(get(), get()) }
}
