# Rakat Counter Native 🕋

A premium, high-sensitivity Rakat Counter built with React Native and Expo. 

This project is the native successor to the [Original Rakat Counter PWA](https://github.com/fahdi/rakat-counter). It was built to solve the **"Prayer Mat Paradox"**—the technical challenge of detecting prostrations on shock-absorbing mats without requiring any manual movement from the user (zero-touch).

## ✨ Features
- **Hybrid "Thump" Detection**: Uses a combination of high-frequency (60Hz) accelerometer tracking and **Audio Metering** to detect the subtle acoustic signature of a head touching the mat.
- **Religious Compliance**: Designed as a **strictly Zero-Touch** experience. No tapping or extra movement is required, ensuring the user's focus remains entirely on the prayer (*Khushoo*).
- **2-Sajdah = 1-Rakat Logic**: Hardcoded logic ensures that only two successful prostrations increment the Rakat count, precisely following the rules of prayer.
- **Premium Aesthetics**: Sleek dark mode with gold accents and smooth haptic feedback using `expo-haptics`.
- **Screen Stability**: Uses native WakeLock to keep the screen active during prayer so sensing never stops.

## 🚀 Getting Started

### Prerequisites
- Node.js
- Expo Go app on your phone (iOS or Android)

### Installation
1. Navigate to this directory:
   ```bash
   cd rakat-counter-native
   ```
2. Start the project:
   ```bash
   npx expo start --tunnel
   ```
3. Scan the QR code with your phone's camera (iOS) or Expo Go app (Android).

## 🎛️ How to Use
1. Place the phone face-up on your prayer mat where your head will touch.
2. Press **START PRAYER**.
3. Pray naturally. The app will "hear" and "feel" your prostrations.
4. The app vibrates on each Sajdah and gives a success chime on Rakat completion.

## 📖 The "Zero-Touch" Evolution Story

This app exists because the web version hit a fundamental wall. You can read the full debugging journey in the [Original README](https://github.com/fahdi/rakat-counter#blog-the-evolution-of-a-zero-touch-idea).

### Why Native?
1. **The Prayer Mat Paradox**: Prayer mats are shock absorbers. Browser-based accelerometers weren't sensitive enough to detect movement on soft surfaces. Native APIs allow for 60Hz sampling and moving-average delta tracking.
2. **The Acoustic Pivot**: By using `expo-av`, we can monitor sound levels. The physical "thump" of a forehead on a mat creates a distinct volume spike that we use to trigger the count when vibrations are too dampened.
3. **Hardware Access**: True background execution and proximity sensor access (coming soon) are only possible in a native environment.

*“May this small tool bring peace to your practice.”*
