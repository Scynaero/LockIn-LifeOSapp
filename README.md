# LockIn - React Native Habit Tracker

A comprehensive, all-in-one life management application built with React Native and Expo. Integrates habit tracking, workout logging, financial management, and journaling into a single cohesive experience.

## Features

### 📅 Habit Tracking (Core)

- **Flexible Habits**: Support for daily, weekly, and custom frequency habits.
- **Streak System**: Logic for streaks, freezes, and "perfect days".
- **Visualizations**: Yearly heatmaps, progress rings, and detailed statistics.
- **HealthKit Integration**: Syncs steps, sleep, and workouts on iOS.

### 💪 Body & Training

- **Workout Logging**: Track exercises, sets, reps, and weights.
- **Exercise Database**: Built-in catalogue of exercises.
- **Body Metrics**: Log and visualize weight and other body stats over time.

### 💰 Wallet & Finance

- **Expense Tracking**: Log daily expenses and view summaries.
- **Debt Manager**: Track money owed to you and debts you owe.
- **Subscriptions**: Manage recurring payments.

### 🧠 Mind & Notes

- **Journaling**: Create notes with rich metadata.
- **Voice Notes**: Record audio attachments.
- **Context**: Location tagging and reminders for notes.

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 54) & React Native
- **Router**: `expo-router` (File-based routing)
- **Language**: TypeScript
- **Database**: `expo-sqlite` (Local persistence)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS)
- **Animations**: `react-native-reanimated`, `lottie-react-native`
- **Charts**: `victory-native`, `react-native-skia`

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- React Native development environment setup (Android Studio / Xcode)

### Installation

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

### Running the App

Start the Expo development server:

```bash
npm run start
```

Run on specific platforms:

- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Web**: `npm run web`

## Architecture

The project follows a Service-Oriented Architecture on the frontend:

- **`app/`**: Contains the UI screens and navigation structure (Expo Router).
- **`components/`**: Reusable UI components.
- **`services/`**: logic layer handling business rules and database interactions (e.g., `HabitService`, `DatabaseService`).
- **`db`**: Data persistence using SQLite (`lockin.db`).

For a deep dive into the code structure, database schema, and development guidelines, please refer to the **[WARP.md](./WARP.md)** file included in this repository.

## detailed Documentation

This project includes detailed developer documentation:

- [WARP.md](./WARP.md): Comprehensive guide for AI assistants and developers, covering architecture, services, and detailed implementation notes.
- [BODY_MODULE_GUIDE.md](./BODY_MODULE_GUIDE.md): Specific documentation for the workout and body tracking module.
