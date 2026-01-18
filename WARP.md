# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands and local development

This is an Expo + React Native app using `expo-router`, SQLite (`expo-sqlite`), and TypeScript.

- **Install dependencies** (uses npm, see `package-lock.json`):
  - `npm install`
- **Start the Expo dev server (default platform chooser):**
  - `npm run start`
- **Run on specific platforms:**
  - Android: `npm run android`
  - iOS: `npm run ios`
  - Web: `npm run web`
- **Type checking (no explicit script, but TypeScript is configured):**
  - `npx tsc --noEmit`

There are currently **no npm scripts configured for linting or tests** in `package.json`, and there are no `*.test.*` or `*.spec.*` files. If you add a test framework (e.g. Jest) or a linter (e.g. ESLint), also add the corresponding `npm run` scripts so they can be invoked from here.

## High-level architecture

### Navigation and screen structure (`app/` with expo-router)

- Routing is managed via **`expo-router`** using the file-based router under `app/`.
- `app/_layout.tsx` is the **root layout**:
  - Wraps the tree in `GestureHandlerRootView` and `SafeAreaProvider`.
  - Initializes the SQLite database and migrations via `DatabaseService.init()` and `HabitService.migrateColors()`.
  - Only renders the app once the DB is ready (`isReady` flag).
  - Declares a `Stack` navigator with:
    - The main tab navigator at `app/(tabs)/`.
    - Modal-like stack screens: `create` (habit creation) and `add-transaction` (wallet entry).
- `app/(tabs)/_layout.tsx` defines the **bottom tab bar** with 5 primary areas:
  - `index` – dashboard / daily habit protocol view.
  - `body` – training / workouts.
  - `stats` – analytics and progress visualizations.
  - `wallet` – personal finance view.
  - `mind` – notes / journaling.
- Additional stack routes live alongside the tab folder, e.g.:
  - Habit flows: `app/create.tsx`, `app/archive.tsx`, `app/habit/[id].tsx`.
  - Notes flows: `app/note/[id].tsx`, `app/note/archive.tsx`.
  - Wallet flows: `app/add-transaction.tsx`, `app/debts/index.tsx`, `app/debts/[id].tsx`, `app/wallet/history.tsx`.

When adding new screens, follow the expo-router conventions (file name = route) inside `app/`, and ensure any new modal-style screens are registered in the root `Stack` if they should appear above the tab bar.

### Data, persistence, and domain services (`services/`)

All persistent data is stored in a local SQLite database (`lockin.db`) accessed through a shared `DatabaseService`. Higher-level domain logic is implemented in service modules under `services/`:

- **`services/DatabaseService.ts`**
  - Opens the SQLite database with `openDatabaseSync('lockin.db')` and is responsible for **all schema creation and migrations** inside `init()`.
  - Defines and migrates tables for:
    - Habits, logs, streak freezes, and user meta (XP, settings).
    - Notes (including soft-delete, reminders, audio, color, location metadata).
    - Finance: expenses, debts, subscriptions.
    - Body: exercises, workouts, workout sets, sports logs, weight logs.
  - Uses `PRAGMA` setup (e.g. WAL, foreign keys) and `ALTER TABLE` guarded by `try/catch` for additive migrations.
  - Exposes `getDB()` (used by other services) to run `getAllAsync`, `getFirstAsync`, and `runAsync` queries.

- **`services/HabitService.ts`**
  - Core **habit system**: creation, updates, archiving, restoration, ordering, and progress logging.
  - Encodes domain concepts:
    - Habit metadata (type `build|quit`, unit, goal, frequency, color/icon, HealthKit integration, target values).
    - Streak state (active/frozen/broken) and current streak length.
    - Freeze inventory and `streak_freezes` handling.
  - Implements streak logic and migrations:
    - `migrateColors()` keeps habit colors consistent by type and backfills `created_at`.
    - `autoFreezeGaps()` and `freezeDate()` maintain freeze records so gaps don't break streaks immediately.
    - `calculateStreak()` and `recalculateAllStreaks()` compute strict streaks over logs + freezes.
  - Logging and XP:
    - `logCompletion()` handles daily completion toggling or quantitative logging against `target_value`, and updates XP via `addXP`.
    - Habit XP and level are stored in `user_meta` and surfaced on the main dashboard.
  - Aggregation helpers used across the UI:
    - `getHabits(date?)` returns enriched habit objects (including `completed_today`, `completed_value`, `frozen_today`, and `recent_history`).
    - `getHeatmapData()` builds a **global yearly heatmap** of “perfect days” across all habits, distinguishing between freeze-only days and logged days.

- **`services/NotesService.ts`**
  - CRUD + soft delete for **notes**, with support for:
    - Pinning, archive/restore, and permanent deletion.
    - Optional linkage to habits/logs via `habit_id` and `log_id`.
    - Reminder times, voice notes (`audio_uri` + duration), color themes, and location text.
  - `getNotes()` accepts filters (e.g., `habitId` or global notes); `getArchivedNotes()` surfaces soft-deleted notes.
  - Used by the `mind` tab (`app/(tabs)/mind.tsx`) and habit detail screens.

- **`services/FinanceService.ts`**
  - Encapsulates **expenses, debts, subscriptions, and derived transaction views**.
  - Expenses:
    - `addExpense`, `getExpenses`, `getExpensesByMonth`, `deleteExpense`.
    - `getExpenseSummary()` aggregates spending per category for the wallet donut chart.
  - Debts:
    - `addDebt`, `getDebts`, `getItemsOwedToMe`, `getItemsIOwe`, `settleDebt`, `updateDebtAmount`, `deleteDebt`.
    - Combines with expenses to generate unified transaction streams via `getRecentTransactions` and `getAllTransactions`.
  - The Wallet screens (`wallet`, `debts`, `add-transaction`) talk exclusively to this service (no raw SQL in components).

- **`services/BodyService.ts`**
  - Owns the **training / workout** domain for the `body` tab:
    - Exercises catalogue, seeded from `assets/exercises.json`.
    - Workouts and sets (start/finish workouts, add/update/delete sets, query workout histories).
    - Sports logs and weight tracking (with helpers like `getWeightHistory`, `getLatestWeight`, and `getRecentMuscles`).
  - All workout-related UI under `components/body/` and `app/(tabs)/body.tsx` should go through this service to keep DB access centralized.

- **`services/HealthKitService.ts`**
  - iOS-only Apple Health integration (guarded by `Platform.OS === 'ios'`).
  - Handles permissions and data fetching for steps, sleep minutes, workouts, and (placeholder) water intake.
  - Used to power automated health-driven habits (e.g. steps/sleep/workout goals) when `useHealthKit` is enabled in habit creation.

- **`services/NotificationService.ts`**
  - Thin wrapper around `expo-notifications`.
  - Key flows:
    - Habit reminders: `scheduleReminder` (recurring daily calendar trigger) + `cancelReminder` (currently cancels all because per-habit IDs are not persisted yet).
    - Note reminders: `scheduleNoteReminder` for one-off date-based notifications, with route URLs encoded in notification data.

When adding new persistent concepts, prefer modeling them in `DatabaseService.init()` (schema + migrations) and a corresponding `*Service` module instead of issuing raw SQL from components.

### UI components and styling

- Styling is done via **Tailwind classes through NativeWind**:
  - See `tailwind.config.js` for content globs (`./app/**/*.{js,jsx,ts,tsx}`, `./components/**/*.{js,jsx,ts,tsx}`) and custom color tokens (`background`, `surface`, `surfaceHighlight`, `primary`, etc.).
  - `babel.config.js` and `metro.config.js` are configured for NativeWind (`jsxImportSource: "nativewind"`, `withNativeWind(config, { input: "./global.css" })`).
- Shared UI and visualization components live under `components/`:
  - Habit/dashboard components like `CalendarStrip`, `Heatmap`, `ProgressRing`, `LogValueModal`, and `StatsDashboard` encapsulate most cross-screen visuals.
  - Body-related components (`components/body/*`) implement workout lists, live sessions, and progress views on top of `BodyService`.
  - Wallet components (`components/wallet/*`) render charts and debt/transaction summaries using `FinanceService`.

If you introduce new reusable visuals or domain dashboards, favor placing them in `components/` and feeding them via the appropriate `services/*` layer.

### Cross-cutting behaviors

- **Haptics:** Expo Haptics (`expo-haptics`) is used extensively in interactive flows (reordering, toggling, swiping, pull-to-create). When modifying or adding highly tactile interactions, consider whether they should also trigger haptic feedback for consistency.
- **Dates and formatting:** Use `utils/DateUtils.ts` and `date-fns` helpers already in use (`CalendarStrip`, stats calculations, etc.) rather than ad hoc string manipulation.
- **Global heatmaps and analytics:**
  - The main dashboard heatmap (`components/Heatmap`) expects data in the `Record<string, number>` format produced by `HabitService.getHeatmapData()`.
  - Stats charts in `app/(tabs)/stats.tsx` build on top of `HabitService.getStats` and `DateUtils` to generate per-day completion trends and streak leaderboards.

Keep these shared utilities and service layers in mind when making changes that affect streaks, statistics, or aggregated views; small schema or logic changes there can ripple through multiple tabs at once.
