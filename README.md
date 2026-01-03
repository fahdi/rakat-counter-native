# Rakat Counter Native 🕋

A premium, high-sensitivity Rakat Counter built with React Native and Expo. Designed for "Zero-Touch" operation using advanced accelerometer delta-spike detection.

## ✨ Features
- **Zero-Touch Mode**: Uses a high-frequency (60Hz) accelerometer listener with a moving-average buffer to detect the subtle vibrations of Sajdah, even on dampened prayer mats.
- **Premium Aesthetics**: Sleek dark mode with gold accents and smooth haptic feedback.
- **Haptic Intelligence**: Distinct haptic patterns for Sajdah completion vs. Rakat completion.
- **Manual Overwrite**: Simply tap the large counter area if automatic detection misses a beat.
- **Screen Stability**: Uses native WakeLock to keep the screen active during prayer.

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
   npx expo start
   ```
3. Scan the QR code with your phone's camera (iOS) or Expo Go app (Android).

## 🎛️ How to Use
1. Place the phone face-up on your prayer mat where your head will touch.
2. Press **START**.
3. Pray naturally. The app will vibrate and increment the Sajdah/Rakat count automatically.
4. Press **FINISH** when done.

## 🛠️ Technology Stack
- **React Native** (UI)
- **Expo Sensors** (Accelerometer)
- **Expo Haptics** (Feedback)
- **Expo Keep Awake** (Screen continuity)

---

## 📖 The "Zero-Touch" Evolution Story

### The Spark
The idea was simple: "Let the phone count for me." But the execution was anything but. We went through 10 major revisions on the web version before realizing that only a **Native App** could solve the final challenge.

### Revisions 1-4: The Pocket Mode Struggle
Initially, we tried using browser motion sensors while the phone was in a pocket.
- **The Fail**: Browsers "pause" sensors when the screen turns off. 
- **The Fix**: We used the **Screen Wake Lock API**, but it was still fragile across different mobile browsers.

### Revisions 5-7: The Permission & Logic Refinement
We moved to **Mat Mode** (phone on the floor) and simplified the math: **2 Sajdahs = 1 Rakah**.
- **The Fail**: Browser privacy (Safari/Chrome) blocked camera and sensor access silently.
- **The Fix**: Added health checks and a debug panel to see what was happening.

### Revision 9: The Prayer Mat Paradox
We hyper-tuned a web-based accelerometer to detect "head-to-mat" impacts.
- **The Discovery**: Prayer mats are designed to **absorb shock**. Vibrations were too dampened for browser APIs to detect reliably. Even a solid thump on a soft mat barely registered.

### Revision 10: The Religious Constraint
- **The Constraint**: Extra movements during Salah (prayer) that aren't part of the prayer can invalidate it. Manual tapping is not an option.
- **The Reality**: The app **must** be zero-touch. 
- **The Solution**: Web browsers lack the hardware access needed (like the Proximity Sensor) to detect a head without light or vibration. 

### The Final Pivot: React Native
This Native version is the culmination of all those lessons. By moving to **React Native**, we achieved:
1. **60Hz High-Frequency Sampling**: Capturing what browsers miss.
2. **Moving Average Delta Logic**: Detecting subtle spikes on dampened mats.
3. **Proximity Sensor Access**: (Next Update) Detecting the head via infrared, requiring zero light and zero vibration.
4. **Reliable Haptics**: Distinct tactile feedback for Rakat completion.

*“May this small tool bring peace to your practice.”*
