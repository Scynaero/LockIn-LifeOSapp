# LockIn - Project Documentation

> **Version:** 1.0.0
> **Last Updated:** 2026-01-23

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Getting Started](#2-getting-started)
3. [Architecture](#3-architecture)
4. [Feature Modules](#4-feature-modules)
    - [Habit Tracking](#41-habit-tracking)
    - [Body & Training](#42-body--training)
    - [Wallet & Finance](#43-wallet--finance)
    - [Mind & Notes](#44-mind--notes)
5. [Development History](#5-development-history)

---

## 1. Project Overview

**LockIn** is a comprehensive, all-in-one life management application built with **React Native** and **Expo**. It integrates habit tracking, workout logging, financial management, and journaling into a single cohesive experience using a robust Service-Oriented Architecture.

### Core Philosophy

- **Local First:** All data is stored locally in SQLite (`lockin.db`).
- **Privacy Centered:** Protected by FaceID/PIN via `SecurityService`.
- **Aesthetic:** Premium, dark-mode-first design using NativeWind.

---

## 2. Getting Started

### Prerequisites

- Node.js
- npm or yarn
- React Native development environment (Xcode for iOS, Android Studio for Android)

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>

# 2. Install dependencies
npm install

# 3. Prebuild for Native Modules (Required for HealthKit/Calendar)
npx expo prebuild
```

### Running the App

```bash
# Start Metro Bundler
npm run start

# Run on iOS (Simulator or Device)
npm run ios

# Run on Android
npm run android
```

> **Note:** Since this project uses native modules (`react-native-health`, `expo-calendar`), you **cannot** use Expo Go. You must use `npx expo run:ios` to build the native client.

---

## 3. Architecture

The project follows a modular, service-based architecture.

### 3.1 Directory Structure

- **`app/`**: UI screens and Navigation (Expo Router).
  - `(tabs)/`: Main bottom tab views (Dashboard, Body, Stats, Wallet, Mind).
  - `_layout.tsx`: Root stack and global providers.
- **`components/`**: Reusable UI components.
  - `body/`, `wallet/`, `note/`: Domain-specific components.
- **`services/`**: Business logic and Database interop.
- **`assets/`**: Images, fonts, and data seeds (e.g., `exercises.json`).

### 3.2 Navigation Structure (`app/`)

Routes are managed via **Expo Router**:

| Route | Type | Description |
|---|---|---|
| `app/(tabs)/index` | Tab | **Dashboard**: Daily habits, calendar strip. |
| `app/(tabs)/body` | Tab | **Body**: Lift views, exercises, anatomical models. |
| `app/(tabs)/stats` | Tab | **Data**: Analytics, health metrics. |
| `app/(tabs)/wallet` | Tab | **Wallet**: Budget, transactions. |
| `app/(tabs)/mind` | Tab | **Mind**: Notes, voice memos. |
| `app/create` | Modal | Habit creation wizard. |
| `app/add-transaction` | Modal | Expense/Income entry. |

### 3.3 Service Layer (`services/`)

All logic is encapsulated in stateless services:

- **`DatabaseService`**: Manages SQLite connection, schema, and migrations.
- **`HabitService`**: Core habit logic (streaks, completion, heatmaps).
- **`BodyService`**: Workouts, sets, and exercise catalog.
- **`FinanceService`**: Expenses, debts, budgets, and recurring subscriptions.
- **`NotesService`**: Journal entries, pinning, soft-delete.
- **`HealthKitService`**: (iOS) Syncs Heart Rate, Steps, Energy, Mindfulness.
- **`SecurityService`**: Biometric/PIN authentication.

### 3.4 Component Patterns

- **Styling**: Tailwind CSS via `NativeWind` (`className` prop).
- **Animations**: `react-native-reanimated` (`Animated.View`, `LayoutAnimations`).
- **Interactivity**: `Pressable` with `expo-haptics` for tactile feedback.

---

## 4. Feature Modules

### 4.1 Habit Tracking (Core)

- **Streaks**: Strict streak logic with "Freeze" inventory.
- **Heatmap**: Yearly contribution graph (GitHub-style) on Dashboard.
- **Types**: Build (Check-in/Quantiative) and Quit (Abstinence) habits.

### 4.2 Body & Training

*Based on the Body Module Guide.*

- **Database**: 120+ exercises seeded from `assets/exercises.json` with anatomical targeting (e.g., `chest/pectoralis major`).
- **Workouts**: Session-based logging (sets, reps, RPE).
- **Visuals**: `BodyHeatmap` (heat map of worked muscles).
- **Tabs**: `LIFT` (Active), `LIVE` (Real-time), `PROGRESS` (Stats).

### 4.3 Wallet & Finance

- **Bucketing**: Monthly Income vs. Category Limits (Budgets).
- **Transactions**: Expense and Debt tracking (Owed to me / I owe).
- **Visuals**: Donut charts for spending breakdown, animated progress bars for budgets.
- **Currency**: Multi-currency support via `CurrencyService`.

### 4.4 Mind & Notes

- **Input**: Quick capture with explicit "Done" action.
- **Metadata**: Audio attachments, Location tagging, Auto-dates.
- **Organization**: Pinning, Archiving (Soft Delete).
- **Performance**: Optimized list rendering (`NoteItem` memoization).

### 4.5 Health Integration

- **iOS HealthKit**:
  - **Read**: Heart Rate, Active Calories, Distance, Mindful Minutes, Sleep, Steps.
  - **Display**: "Bio-Metrics" card in the Data (`stats`) tab.

---

## 5. Development History

### Phase 2: Integrity Check

- Adjusted Expo SDK 54 compatibility.
- Verified Native Module linking.

### Phase 3: Build & Orchestration

- **Wallet**: Implemented Bucketing system (`finance_periods`, `finance_budgets`) and Overview UI.
- **Notes**: Added explicit completion UX.
- **HealthKit**: Expanded data sync for holistic health view.

### Phase 4: Refinement & Polish

- **Performance**: Optimized `Mind` tab list rendering to prevent typing lag.
- **Animations**: Added entry animations to Budget bars and Stats dashboard.
- **Stability**: Fixed edge cases in Wallet math (division by zero handling).

### Phase 5: Release Prep

- **Config**: Updated `app.json` branding ("LockIn").
- **Permissions**: Added `NSFaceIDUsageDescription` and `NSCalendarsUsageDescription`.
- **Status**: Production-ready configuration.

---

> This document serves as the single source of truth for the LockIn project. Generated from previous phase reports and architecture guides.
