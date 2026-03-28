<<<<<<< HEAD
# 🍼 Baby Care Tracker

A complete React Native (Expo) app for tracking your baby's daily care activities including feeding, diaper changes, cry sessions, sleep, and bath times.

---

## 📁 Project Structure

```
BabyCareApp/
└── mobile/                         ← Expo React Native app
    ├── App.js                      ← Entry point
    ├── AppNavigator.js             ← Navigation (Tabs + Stack)
    ├── app.json                    ← Expo config
    ├── babel.config.js
    ├── package.json
    ├── assets/                     ← App icons (add your own)
    └── src/
        ├── screens/
        │   ├── HomeScreen.js       ← Dashboard + quick-add grid
        │   ├── AddEntryScreen.js   ← Log any task with dynamic form
        │   ├── HistoryScreen.js    ← All entries, filterable by type
        │   ├── StatsScreen.js      ← 7-day charts + all-time totals
        │   └── ProfileScreen.js    ← Baby profile + data management
        ├── components/
        │   ├── UI.js               ← Button, Card, Input, ChipSelect, etc.
        │   ├── EntryCard.js        ← Individual log card
        │   └── TaskButton.js       ← Home screen grid buttons
        ├── storage/
        │   └── index.js            ← All AsyncStorage CRUD operations
        ├── utils/
        │   └── helpers.js          ← Date formatting, grouping helpers
        └── theme/
            └── index.js            ← Colors, fonts, spacing, task config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ — https://nodejs.org
- **npm** (comes with Node)
- **Expo CLI** — install globally:
  ```bash
  npm install -g expo-cli
  ```
- **Expo Go app** on your Android phone (from Google Play Store)

---

### Installation

```bash
# 1. Navigate to the mobile folder
cd BabyCareApp/mobile

# 2. Install all dependencies
npm install

# 3. Start the Expo development server
npx expo start
```

---

### Running on Android Phone (Expo Go)

1. Make sure your phone and laptop are on the **same Wi-Fi network**
2. Run `npx expo start` in the mobile folder
3. Open **Expo Go** on your Android phone
4. Scan the **QR code** shown in the terminal
5. The app will load on your phone ✅

---

### Running on Android Emulator (Laptop)

1. Install **Android Studio** from https://developer.android.com/studio
2. Create a virtual device (AVD) with API 33+ in Android Studio
3. Start the emulator
4. Run:
   ```bash
   npx expo start --android
   ```
   Or press **`a`** in the Expo terminal

---

### Running on Android Device via USB (Laptop)

1. Enable **Developer Options** on your phone:
   - Go to Settings → About Phone → tap **Build Number** 7 times
2. Enable **USB Debugging** in Developer Options
3. Connect phone via USB
4. Run:
   ```bash
   npx expo start --android
   ```

---

## 📦 All Dependencies

| Package | Version | Purpose |
|---|---|---|
| `expo` | ~50.0.6 | Expo framework |
| `expo-status-bar` | ~1.11.1 | Status bar styling |
| `expo-font` | ~11.10.3 | Custom fonts |
| `expo-splash-screen` | ~0.26.4 | Splash screen |
| `react` | 18.2.0 | React core |
| `react-native` | 0.73.4 | React Native core |
| `@react-native-async-storage/async-storage` | 1.21.0 | Local data storage |
| `@react-navigation/native` | ^6.1.9 | Navigation core |
| `@react-navigation/bottom-tabs` | ^6.5.11 | Bottom tab nav |
| `@react-navigation/stack` | ^6.3.20 | Stack navigation |
| `react-native-safe-area-context` | 4.8.2 | Safe area handling |
| `react-native-screens` | ~3.29.0 | Native screen optimization |
| `react-native-svg` | 14.1.0 | SVG support |
| `@expo/vector-icons` | ^14.0.0 | Icon set |
| `date-fns` | ^3.3.1 | Date formatting |

---

## 🍼 Features

| Feature | Details |
|---|---|
| **Milk Feed** | Amount (ml), feed type (breast/formula/mixed/solid), duration, notes |
| **Diaper – Pee** | Quick log with optional notes |
| **Diaper – Poop** | Consistency picker (soft/firm/watery/seedy), notes |
| **Cry Session** | Duration, reason (hunger/tired/pain), notes |
| **Sleep** | Duration, type (night/nap/car/stroller), notes |
| **Shower / Bath** | Bath type (full/shower/sponge), notes |
| **Dashboard** | Today's stats at a glance, quick-add grid, recent entries |
| **History** | All entries grouped by date, filterable by task type |
| **Stats** | 7-day bar chart, sleep tracking, all-time totals |
| **Baby Profile** | Name, DOB (age auto-calc), gender, birth weight |
| **Data Management** | 100% local AsyncStorage, clear all data option |

---

## 🛠 Troubleshooting

**Metro bundler stuck?**
```bash
npx expo start --clear
```

**Dependencies error?**
```bash
rm -rf node_modules
npm install
```

**Expo Go version mismatch?**
Update Expo Go from the Play Store.

**Can't connect phone?**
- Make sure both devices are on the same Wi-Fi
- Try `npx expo start --tunnel` for tunnel mode

---

## 📱 Build APK (Optional)

To create a standalone APK you can install directly:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account (create free account at expo.dev)
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android --profile preview
```

---

## 🔒 Privacy

All data is stored **locally on-device** using AsyncStorage. No data is sent to any server.
=======
# BabyCareTracker
>>>>>>> cf9b37b308e220d3562ce2af1e0f204642052de6
