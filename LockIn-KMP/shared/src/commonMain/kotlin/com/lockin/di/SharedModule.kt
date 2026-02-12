package com.lockin.di

import com.lockin.db.DatabaseDriverFactory
import com.lockin.db.Seeder
import com.lockin.db.createDatabase
import com.lockin.repository.BodyRepository
import com.lockin.repository.FinanceRepository
import com.lockin.repository.HabitRepository
import com.lockin.repository.NotesRepository
import com.lockin.usecase.habit.AutoFreezeGapsUseCase
import com.lockin.usecase.habit.CalculateStreakUseCase
import com.lockin.usecase.habit.GetHabitStatsUseCase
import com.lockin.usecase.habit.GetHeatmapDataUseCase
import com.lockin.usecase.habit.LogCompletionUseCase
import com.lockin.usecase.habit.XpLevelingUseCase
import org.koin.core.KoinApplication
import org.koin.core.context.startKoin
import org.koin.core.module.Module
import org.koin.dsl.module

val sharedModule = module {
    // Database
    single { createDatabase(get()) }
    single { Seeder(get()) }

    // Repositories
    single { HabitRepository(get()) }
    single { BodyRepository(get()) }
    single { FinanceRepository(get()) }
    single { NotesRepository(get()) }

    // Habit Use Cases
    single { CalculateStreakUseCase(get()) }
    single { AutoFreezeGapsUseCase(get(), get()) }
    single { XpLevelingUseCase(get()) }
    single { LogCompletionUseCase(get(), get(), get()) }
    single { GetHeatmapDataUseCase(get(), get()) }
    single { GetHabitStatsUseCase(get(), get(), get()) }

    // ScreenModels
    factory { BodyScreenModel(get()) }
}

fun initKoin(appModule: KoinApplication.() -> Unit = {}) {
    startKoin {
        appModule()
        modules(sharedModule, platformModule())
    }
}

// Platform-specific module (provides DatabaseDriverFactory)
expect fun platformModule(): Module
