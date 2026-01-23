# Navigation Structure

## Overview

The application uses **Expo Router** with a **File-Based Routing** system.

## Root Layout (`app/_layout.tsx`)

The root layout initializes core services (Database, Security, Gamification) and defines a global `Stack` navigator.

- **Wrapper**: `GestureHandlerRootView` -> `SafeAreaProvider`
- **Lock Screen**: Rendered conditionally if `isLocked` is true (SecurityService).
- **Routes**:
  - `(tabs)`: Main application interface (Bottom Tab Navigator).
  - `create`: Modal for creating habits (Presentation: 'modal').
  - `add-transaction`: Modal for wallet transactions (Presentation: 'modal').
  - `habit/*`: Nested routes for habit details.
  - `note/*`: Nested routes for note details.
  - `wallet/*`: Nested routes for wallet history/details.

## Tab Navigation (`app/(tabs)/_layout.tsx`)

The main interface is a bottom tab bar styled with a dark theme (`#000000` background).

| Route Name | File | Icon (Active/Inactive) | Label |
| :--- | :--- | :--- | :--- |
| `index` | `app/(tabs)/index.tsx` | `grid` / `grid-outline` | Dashboard |
| `body` | `app/(tabs)/body.tsx` | `fitness` | Body |
| `stats` | `app/(tabs)/stats.tsx` | `bar-chart` | Data |
| `wallet` | `app/(tabs)/wallet.tsx` | `wallet-outline` | Wallet |
| `mind` | `app/(tabs)/mind.tsx` | `documents` | Mind |

## Deep Linking & Modals

- **Modals**: Defined in the Root Stack with `options={{ presentation: 'modal' }}`.
- **Dynamic Routes**: Files like `app/note/[id].tsx` (implied structure) handle specific item views.
