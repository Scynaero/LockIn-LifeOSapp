# KMP Migration Plan: LockIn LifeOS App

## Context

LockIn is a React Native/Expo app with 4 feature modules (Habits, Body/Exercise, Wallet, Notes). We are migrating to Kotlin Multiplatform with a 6-day Android-first sprint (Play Store release), with iOS (App Store) to follow later.

## Finalized Stack

* **Shared Logic:** Kotlin Multiplatform (commonMain)
* **UI:** Compose Multiplatform (single codebase, Android first, iOS later)
* **Database:** SQLDelight 2.0
* **DI:** Koin 4.0
* **Navigation:** Voyager
* **Async:** kotlinx-coroutines
* **Serialization:** kotlinx-serialization-json
* **DateTime:** kotlinx-datetime
* **Charts:** Vico 2.0 (Compose charts)
* **UUID:** kotlin.uuid.Uuid (Kotlin 2.1+ stdlib)

---

## 1. Project Structure

```
LockIn-KMP/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── gradle/libs.versions.toml          # Version catalog
│
├── shared/                            # KMP shared module (logic + DB)
│   ├── build.gradle.kts
│   └── src/
│       ├── commonMain/
│       │   ├── kotlin/com/lockin/
│       │   │   ├── di/SharedModule.kt
│       │   │   ├── db/
│       │   │   │   ├── DatabaseFactory.kt     # expect fun createDriver()
│       │   │   │   └── Seeder.kt              # exercises.json seeding
│       │   │   ├── model/                     # Domain data classes
│       │   │   │   ├── Habit.kt
│       │   │   │   ├── HabitLog.kt
│       │   │   │   ├── StreakFreeze.kt
│       │   │   │   ├── Exercise.kt
│       │   │   │   ├── Workout.kt
│       │   │   │   ├── WorkoutSet.kt
│       │   │   │   ├── SportsLog.kt
│       │   │   │   ├── Expense.kt
│       │   │   │   ├── Debt.kt
│       │   │   │   ├── Budget.kt
│       │   │   │   ├── FinancePeriod.kt
│       │   │   │   ├── Note.kt
│       │   │   │   └── UserStats.kt
│       │   │   ├── repository/               # DB access via SQLDelight
│       │   │   │   ├── HabitRepository.kt
│       │   │   │   ├── BodyRepository.kt
│       │   │   │   ├── FinanceRepository.kt
│       │   │   │   └── NotesRepository.kt
│       │   │   ├── usecase/                  # Business logic
│       │   │   │   ├── habit/
│       │   │   │   │   ├── CalculateStreakUseCase.kt
│       │   │   │   │   ├── AutoFreezeGapsUseCase.kt
│       │   │   │   │   ├── LogCompletionUseCase.kt
│       │   │   │   │   ├── GetHeatmapDataUseCase.kt
│       │   │   │   │   ├── GetHabitStatsUseCase.kt
│       │   │   │   │   └── XpLevelingUseCase.kt
│       │   │   │   ├── body/
│       │   │   │   │   ├── WorkoutSessionUseCase.kt
│       │   │   │   │   ├── SetLoggingUseCase.kt
│       │   │   │   │   ├── SportsLoggingUseCase.kt
│       │   │   │   │   └── MuscleSplitUseCase.kt
│       │   │   │   ├── finance/
│       │   │   │   │   ├── ExpenseUseCase.kt
│       │   │   │   │   ├── DebtUseCase.kt
│       │   │   │   │   └── BudgetUseCase.kt
│       │   │   │   └── notes/
│       │   │   │       ├── NoteCrudUseCase.kt
│       │   │   │       └── NoteArchiveUseCase.kt
│       │   │   ├── platform/                 # expect declarations
│       │   │   │   ├── BiometricAuth.kt
│       │   │   │   ├── NotificationScheduler.kt
│       │   │   │   ├── AudioRecorder.kt
│       │   │   │   ├── LocationProvider.kt
│       │   │   │   ├── HapticFeedback.kt
│       │   │   │   └── SecureStorage.kt
│       │   │   └── util/
│       │   │       ├── DateUtils.kt
│       │   │       └── CurrencyUtils.kt
│       │   │
│       │   └── sqldelight/com/lockin/db/
│       │       ├── Habits.sq
│       │       ├── Logs.sq
│       │       ├── StreakFreezes.sq
│       │       ├── Exercises.sq
│       │       ├── Workouts.sq
│       │       ├── WorkoutSets.sq
│       │       ├── SportsLogs.sq
│       │       ├── WeightLogs.sq
│       │       ├── Expenses.sq
│       │       ├── Debts.sq
│       │       ├── Subscriptions.sq
│       │       ├── FinancePeriods.sq
│       │       ├── FinanceBudgets.sq
│       │       ├── Notes.sq
│       │       ├── UserMeta.sq
│       │       └── UserStats.sq
│       │
│       ├── androidMain/kotlin/com/lockin/
│       │   ├── db/DatabaseFactory.android.kt
│       │   └── platform/                     # actual Android impls
│       │       ├── BiometricAuth.android.kt
│       │       ├── NotificationScheduler.android.kt
│       │       ├── AudioRecorder.android.kt
│       │       ├── LocationProvider.android.kt
│       │       ├── HapticFeedback.android.kt
│       │       └── SecureStorage.android.kt
│       │
│       └── iosMain/kotlin/com/lockin/        # Stubs for now (iOS later)
│           ├── db/DatabaseFactory.ios.kt
│           └── platform/
│               └── ... (stub actual impls)
│
├── composeApp/                               # Compose Multiplatform UI
│   ├── build.gradle.kts
│   └── src/
│       ├── commonMain/kotlin/com/lockin/ui/
│       │   ├── App.kt                       # Root composable
│       │   ├── theme/
│       │   │   ├── Theme.kt                 # Dark theme
│       │   │   ├── Color.kt                 # Color tokens
│       │   │   └── Type.kt                  # Typography
│       │   ├── navigation/
│       │   │   └── AppNavigator.kt          # Voyager tab + screen nav
│       │   ├── screen/
│       │   │   ├── dashboard/
│       │   │   │   ├── DashboardScreen.kt   # Voyager Screen
│       │   │   │   └── DashboardScreenModel.kt  # Voyager ScreenModel
│       │   │   ├── habit/
│       │   │   │   ├── HabitCreateScreen.kt
│       │   │   │   └── HabitDetailScreen.kt
│       │   │   ├── body/
│       │   │   │   ├── BodyScreen.kt        # LIFT/LIVE/PROGRESS tabs
│       │   │   │   ├── BodyScreenModel.kt
│       │   │   │   ├── LiftTab.kt
│       │   │   │   ├── LiveTab.kt
│       │   │   │   └── ProgressTab.kt
│       │   │   ├── wallet/
│       │   │   │   ├── WalletScreen.kt
│       │   │   │   ├── WalletScreenModel.kt
│       │   │   │   ├── AddTransactionScreen.kt
│       │   │   │   └── TransactionHistoryScreen.kt
│       │   │   └── mind/
│       │   │       ├── MindScreen.kt
│       │   │       ├── MindScreenModel.kt
│       │   │       ├── NoteDetailScreen.kt
│       │   │       └── ArchiveScreen.kt
│       │   └── component/                   # Shared Compose components
│       │       ├── CalendarStrip.kt
│       │       ├── Heatmap.kt
│       │       ├── ProgressRing.kt
│       │       ├── DonutChart.kt
│       │       ├── ActivityRings.kt
│       │       ├── LogValueModal.kt
│       │       └── SwipeableItem.kt
│       │
│       ├── androidMain/kotlin/com/lockin/
│       │   ├── MainActivity.kt
│       │   └── LockInApp.kt                # Application class + Koin init
│       │
│       └── iosMain/kotlin/com/lockin/
│           └── MainViewController.kt        # iOS entry (later)
│
└── resources/
    └── exercises.json                       # Shared seed data
```

**Key difference from v1 plan:** UI code lives in `composeApp/src/commonMain/` (Compose Multiplatform) so it's written once and runs on both platforms. No duplicate SwiftUI code needed.

---

## 2. Technology Stack (Final)

| Concern | Library | Why This Over Alternatives |
| --- | --- | --- |
| **KMP** | Kotlin 2.1.x + KMP plugin | Foundation |
| **UI** | Compose Multiplatform 1.7.x | Write once, Android + iOS. Faster than Jetpack+SwiftUI dual approach |
| **Database** | SQLDelight 2.0.x | Type-safe SQL, KMP-native. Better than Room (Android-only) or Realm (heavier) |
| **DI** | Koin 4.0.x | Zero code-gen, KMP-native, fast setup. Better than kotlin-inject (slower builds) |
| **Navigation** | Voyager 1.1.x | KMP-first, Compose Multiplatform compatible. Better than Decompose (steeper curve) or Jetpack Nav (Android-only) |
| **Async** | kotlinx-coroutines 1.9.x | Standard async |
| **Serialization** | kotlinx-serialization 1.7.x | JSON parsing for exercises.json, frequency field |
| **DateTime** | kotlinx-datetime 0.6.x | Replaces date-fns |
| **Charts** | Vico 2.0.x | Compose-native charting for trends, volume, weight graphs |
| **Haptics** | expect/actual → Android Vibrator / iOS UIImpactFeedbackGenerator | Simple, no library needed |
| **Biometrics** | expect/actual → AndroidX Biometric / iOS LocalAuthentication | Platform APIs |
| **Notifications** | expect/actual → WorkManager / UNUserNotificationCenter | Platform APIs |
| **Audio** | expect/actual → Android MediaRecorder / iOS AVAudioRecorder | Platform APIs |
| **Location** | expect/actual → Android FusedLocationProvider / iOS CLLocationManager | Platform APIs |

---

## 3. 6-Day Android Sprint Plan

### Day 1: Scaffolding + Database + Habit Models

* **Morning: Project setup**
  * Create KMP project via JetBrains KMP wizard (Compose Multiplatform template)
  * Configure `gradle/libs.versions.toml` with all dependency versions
  * Configure `shared/build.gradle.kts` (SQLDelight, Koin, coroutines, serialization, datetime)
  * Configure `composeApp/build.gradle.kts` (Compose Multiplatform, Voyager, Vico, Koin-Compose)
  * Set up Android: minSdk 26, targetSdk 35, applicationId "com.lockin.app"
* **Afternoon: SQLDelight schemas**
  * Write ALL 16 `.sq` files (ported from DatabaseService.ts lines 18-383): Habits.sq, Logs.sq, StreakFreezes.sq, Exercises.sq, Workouts.sq, etc.
  * Implement `DatabaseFactory` (expect/actual for AndroidSqliteDriver)
  * Write `Seeder.kt` to load exercises.json into exercises table on first launch
* **Evening: Habit domain + repository**
  * Port domain models: `Habit.kt`, `HabitLog.kt`, `StreakFreeze.kt`, `UserStats.kt`
  * Implement `HabitRepository.kt` wrapping SQLDelight generated queries
  * Port `DateUtils.kt` using kotlinx-datetime
  * Set up Koin `SharedModule.kt` with repository bindings

### Day 2: Habit Business Logic + Dashboard UI

* **Morning: Habit use cases**
  * Port ALL algorithms from HabitService.ts (833 lines):
    * `CalculateStreakUseCase.kt` (Strict streak logic)
    * `AutoFreezeGapsUseCase.kt` (Gap filling)
    * `LogCompletionUseCase.kt` (Toggle + XP)
    * `GetHeatmapDataUseCase.kt` (Perfect day)
    * `GetHabitStatsUseCase.kt` (Completion + breakdown)
    * `XpLevelingUseCase.kt` (Level formula)
* **Afternoon: Dashboard screen (Compose Multiplatform)**
  * `DashboardScreenModel.kt` (State management)
  * `DashboardScreen.kt` (TopAppBar, Quick Stats, CalendarStrip)
* **Evening: Dashboard continued**
  * `Heatmap.kt`, `ProgressRing.kt`, `LogValueModal.kt`
  * `QuickStatsSection.kt`, `StreakLeaderboard.kt`
  * Wire up Voyager navigation

### Day 3: Habit Create/Detail + Body Module

* **Morning: Habit creation + detail screens**
  * `HabitCreateScreen.kt` - Multi-form wizard (Name, type, frequency, goal, icon)
  * `HabitDetailScreen.kt` - Overview, heatmap, freeze history, edit modal
* **Afternoon: Body module - domain + repository**
  * Port models: `Exercise.kt`, `Workout.kt`, `WorkoutSet.kt`, `SportsLog.kt`, `WeightLog.kt`
  * Implement `BodyRepository.kt`
  * Port use cases: `WorkoutSessionUseCase`, `SetLoggingUseCase`, `SportsLoggingUseCase`, `MuscleSplitUseCase`
* **Evening: Body UI - LIFT tab**
  * `BodyScreen.kt` (LIFT/LIVE/PROGRESS tabs)
  * `LiftTab.kt`: Calendar strip, ActiveWorkoutComposable (timer, set list)
  * `ExercisePickerDialog.kt`: Multi-select, custom exercise
  * `ExerciseDetailDialog.kt`: Add set, RPE, completion

### Day 4: Body Module (LIVE + PROGRESS) + Wallet Module

* **Morning: Body LIVE + PROGRESS tabs**
  * `LiveTab.kt`: ActivityRings, Quick log sport buttons
  * `ProgressTab.kt`: Body heatmap, daily stats, weight/volume charts (Vico)
* **Afternoon: Wallet module - domain + repository + use cases**
  * Port models: `Expense`, `Debt`, `Subscription`, `FinancePeriod`, `Budget`
  * Implement `FinanceRepository.kt`
  * Port use cases: `ExpenseUseCase`, `DebtUseCase`, `BudgetUseCase`
* **Evening: Wallet UI**
  * `WalletScreen.kt`: Budget overview bars, Donut chart, Active debts
  * `AddTransactionScreen.kt`: Numpad, category picker, split logic
  * `TransactionHistoryScreen.kt`: Grouped by month

### Day 5: Notes Module + Platform Services + Polish

* **Morning: Notes module - complete**
  * Port models (`Note.kt`) and `NotesRepository.kt`
  * `NotesService` use cases (CRUD, soft delete)
  * `MindScreen.kt`: List with swipe-to-delete
  * `NoteDetailScreen.kt`: Markdown editor (text field), audio player, location
  * `ArchiveScreen.kt`
* **Afternoon: Android platform implementations (actual)**
  * `HapticFeedback.android.kt` (Vibrator)
  * `NotificationScheduler.android.kt` (WorkManager)
  * `AudioRecorder.android.kt` (MediaRecorder)
  * `LocationProvider.android.kt` (FusedLocation)
  * `BiometricAuth.android.kt` (BiometricPrompt)
  * `SecureStorage.android.kt` (EncryptedSharedPreferences - pin)
* **Evening: Theme + polish**
  * Apply `Theme.kt` (Dark mode first, #CCFF00 Primary)
  * Bottom tab bar styling
  * Voyager transitions

### Day 6: Integration Testing + Build + Release Prep

* **Morning: End-to-end testing**
  * Smoke test all modules on emulator
  * Fix bugs
* **Afternoon: Android release build**
  * Configuration signing, ProGuard/R8
  * Build release APK/AAB
* **Evening: Play Store submission**
  * Create listing, upload, submit

---

## 4. Key Algorithms (Must Match Exactly)

**Streak Calculation** (from HabitService.ts:361-416)

```kotlin
fun calculateStreak(habitId: String): Int {
    val logDates = repo.getDistinctLogDates(habitId).toSet()
    val freezeDates = repo.getFreezeDates(habitId).toSet()
    val validDates = logDates + freezeDates

    val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
    val startDate = when {
        today.toString() in validDates -> today
        today.minus(1, DateTimeUnit.DAY).toString() in validDates -> today.minus(1, DateTimeUnit.DAY)
        else -> return 0  // streak broken
    }

    var streak = 0
    var current = startDate
    while (current.toString() in validDates) {
        if (current.toString() in logDates) streak++
        // freezes maintain continuity but don't increment
        current = current.minus(1, DateTimeUnit.DAY)
    }
    repo.updateStreak(habitId, streak)
    return streak
}
```

**XP Level Formula**

```kotlin
fun getLevel(xp: Int): Int = floor(sqrt(xp.toDouble() / 100.0)).toInt() + 1
```

**MET Calorie Formula**

```kotlin
fun calculateCalories(met: Double, weightKg: Double, durationMin: Int): Double =
    (met * 3.5 * weightKg) / 200.0 * durationMin
```

**1RM Brzycki Formula**

```kotlin
fun oneRepMax(weight: Double, reps: Int): Double = weight * (1 + reps / 30.0)
```

---

## 5. SQLDelight Schema Summary

| .sq File | Table | Columns | Key Queries |
| --- | --- | --- | --- |
| Habits.sq | habits | 22 cols | getActive, getById, insert, update, updateOrder, archive, restore |
| Logs.sq | logs | 6 cols | getByHabitDate, getDistinctDates, insert, deleteByHabitDate |
| StreakFreezes.sq | streak_freezes | 4 cols | getByHabitDate, getByHabit, insert, delete |
| Exercises.sq | exercises | 6 cols | getAll, getById, search, insertCustom |
| Workouts.sq | workouts | 8 cols | getActive, getByDate, insert, finish, timerToggle |
| WorkoutSets.sq | workout_sets | 8 cols | getByWorkout (JOIN exercise name), insert, update, delete |
| SportsLogs.sq | sports_logs | 6 cols | getAll, getByDate, insert, delete |
| WeightLogs.sq | weight_logs | 3 cols | getHistory (last 30), getLatest, upsert |
| Expenses.sq | expenses | 6 cols | getAll, getByMonth, insert, delete |
| Debts.sq | debts | 7 cols | getOwedToMe, getIOwe, insert, settle, updateAmount, delete |
| Subscriptions.sq | subscriptions | 5 cols | getAll, insert |
| FinancePeriods.sq | finance_periods | 4 cols | getByMonthYear, upsertIncome |
| FinanceBudgets.sq | finance_budgets | 4 cols | getByPeriod, upsert |
| Notes.sq | notes | 12 cols | getActive (pinned first), getArchived, insert, update, softDelete, restore, permanentDelete |
| UserMeta.sq | user_meta | 2 cols | get, upsert |
| UserStats.sq | user_stats | 7 cols | get, upsert |

---

## 6. Platform Abstractions (expect/actual)

| Abstraction | Android (Day 5) | iOS (Later) |
| --- | --- | --- |
| **BiometricAuth** | AndroidX BiometricPrompt | LocalAuthentication |
| **NotificationScheduler** | WorkManager + NotificationCompat | UNUserNotificationCenter |
| **AudioRecorder** | MediaRecorder + MediaPlayer | AVAudioRecorder + AVAudioPlayer |
| **LocationProvider** | FusedLocationProviderClient + Geocoder | CLLocationManager + CLGeocoder |
| **HapticFeedback** | Vibrator (VibrationEffect) | UIImpactFeedbackGenerator |
| **SecureStorage** | EncryptedSharedPreferences | Keychain |
| **DatabaseFactory** | AndroidSqliteDriver | NativeSqliteDriver |

---

## 7. Voyager Navigation Structure

```kotlin
// AppNavigator.kt
TabNavigator(
    tabs = listOf(
        DashboardTab,   // index 0
        BodyTab,        // index 1
        SettingsTab,    // index 2 (was "Stats" in RN)
        WalletTab,      // index 3
        MindTab         // index 4
    )
)

// Each tab uses Navigator for internal stack:
// DashboardTab → HabitCreateScreen, HabitDetailScreen
// BodyTab → (inline LIFT/LIVE/PROGRESS, dialogs for exercise picker)
// WalletTab → AddTransactionScreen, TransactionHistoryScreen
// MindTab → NoteDetailScreen, ArchiveScreen
```

---

## 8. Verification Checklist (Day 6)

* [ ] App launches on Android with dark theme
* [ ] Bottom nav works (5 tabs, correct icons)
* [ ] **Habits**: Create → Complete → Streak → Freeze → Heatmap → XP
* [ ] **Body**: Start workout → Add exercise → Log sets → Finish → Muscle split → Log sport
* [ ] **Wallet**: Set income → Set budget → Add expense → Verify bars → Add debt → Settle
* [ ] **Notes**: Create → Pin → Archive → Restore → Voice note → Location → Color
* [ ] Release APK installs and runs on physical device
* [ ] No crashes on rotation, background/foreground cycles
* [ ] SQLite data persists across app restarts

---

## 9. Critical Source Files Reference

| Current RN File | Port To |
| --- | --- |
| `services/DatabaseService.ts` | 16x `.sq` schema files |
| `services/HabitService.ts` (833 lines) | `usecase/habit/*.kt` + `HabitRepository.kt` |
| `services/BodyService.ts` (455 lines) | `usecase/body/*.kt` + `BodyRepository.kt` |
| `services/FinanceService.ts` (~300 lines) | `usecase/finance/*.kt` + `FinanceRepository.kt` |
| `services/NotesService.ts` (~200 lines) | `usecase/notes/*.kt` + `NotesRepository.kt` |
| `app/(tabs)/index.tsx` (464 lines) | `screen/dashboard/DashboardScreen.kt` |
| `app/create.tsx` | `screen/habit/HabitCreateScreen.kt` |
| `app/habit/[id].tsx` | `screen/habit/HabitDetailScreen.kt` |
| `app/(tabs)/body.tsx` + `components/body/*` | `screen/body/*.kt` |
| `app/(tabs)/wallet.tsx` + `components/wallet/*` | `screen/wallet/*.kt` |
| `app/(tabs)/mind.tsx` + `app/note/*` | `screen/mind/*.kt` |
| `assets/exercises.json` | `resources/exercises.json` (copied) |

---

## 10. Post-Android Release: iOS Roadmap

After the Android Play Store launch:

1. Implement all iOS actual platform classes (HealthKit, biometrics, notifications, audio, location, haptics)
2. Configure Xcode project with Compose Multiplatform iOS target
3. Add HealthKit entitlements + permissions
4. Test on iOS simulator and device
5. Submit to App Store
