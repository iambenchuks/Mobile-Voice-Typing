# ScribeFlow Mobile - Offline Floating Dictation for Android

> **Android Native App** with translucent floating watermark pill, accessibility focus detection, and 100% offline speech-to-text dictation.

Inspired by Whisperflow and desktop Handy, **ScribeFlow** is a native Android application designed to work across all your mobile apps: whenever you tap into any text field (in Google Gemini, WhatsApp, Chrome, Keep Notes, or any search bar), a floating translucent watermark bubble appears. Tap it to speak offline in English, and it automatically injects your speech into the active text field.

---

## 📱 How to Download the Compiled APK from GitHub

You don't need Android Studio installed to get the `.apk` file! GitHub compiles it for you automatically:

1. In this GitHub repository, click on the **Actions** tab at the top.
2. Select the latest workflow run named **"Build ScribeFlow Android APK"** (or click **Run workflow** to trigger a fresh build).
3. Once the build finishes (green checkmark), scroll down to the **Artifacts** section at the bottom of the summary page.
4. Click on **`ScribeFlow-debug-apk`** to download your ready-to-install Android APK (`app-debug.apk`)!
5. Transfer or download the `.apk` to your Android phone and install it (allow "Install from Unknown Sources" if prompted).

---

## 🏗️ Project Architecture (Native Android)

This repository is structured as a full native Android project:

```
├── app/                                    # Native Android Application module
│   ├── src/main/
│   │   ├── AndroidManifest.xml             # System alert window, Accessibility service, mic permissions
│   │   ├── java/com/scribeflow/mobile/
│   │   │   ├── MainActivity.kt             # Onboarding, permission toggles, watermark opacity slider
│   │   │   ├── ScribeAccessibilityService.kt # System-wide text field focus listener & text injector
│   │   │   ├── FloatingWatermarkService.kt # Draggable translucent floating overlay with edge snapping
│   │   │   ├── OfflineSpeechEngine.kt      # 100% local on-device English speech recognition
│   │   │   └── PunctuationFormatter.kt     # Spoken punctuation formatting & capitalization
│   │   └── res/
│   │       ├── layout/
│   │       │   ├── activity_main.xml       # Main onboarding and permission setup screen
│   │       │   └── layout_floating_watermark_pill.xml # Translucent floating pill layout
│   │       ├── drawable/                   # Glassmorphic pill background, pulse wave rings, vectors
│   │       ├── mipmap/                     # App launcher icons
│   │       └── values/                     # strings.xml, colors.xml, themes.xml
│   ├── build.gradle.kts                    # App-level Gradle dependencies (AndroidX, Coroutines)
│   └── proguard-rules.pro
├── .github/workflows/build-apk.yml          # GitHub Actions CI workflow compiling the debug APK
├── settings.gradle.kts                     # Gradle multi-project settings
├── build.gradle.kts                        # Root Gradle configuration
├── gradle.properties                       # AndroidX and JVM options
└── src/                                    # Interactive browser testbench & device simulator
```

---

## 🛠️ Building Locally in Android Studio

If you prefer building locally:

1. Clone or download this repository.
2. Open **Android Studio** and choose **Open**, then select this repository folder.
3. Allow Gradle to sync.
4. Connect your Android phone via USB (with USB Debugging enabled) or start an Android Emulator.
5. Click the green **Run (▶)** button, or go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
6. The compiled APK will be at `app/build/outputs/apk/debug/app-debug.apk`.

---

## 🔒 Required Android Permissions

When you first launch ScribeFlow on your phone, enable the 3 permissions shown on screen:
1. **Appear on Top (SYSTEM_ALERT_WINDOW)**: Allows the translucent watermark pill to float over other apps.
2. **Accessibility Service**: Allows ScribeFlow to detect when you focus an input field and inject text directly.
3. **Microphone**: Allows offline recording and transcription.

---

## 💡 Why Offline & Lightweight?
ScribeFlow uses on-device offline recognition (`RecognizerIntent.EXTRA_PREFER_OFFLINE`), eliminating internet lag and cloud costs. The floating bubble is styled with alpha transparency (0.55f) and backdrop blur, functioning as a watermark so you can still read everything beneath it while dictating.
