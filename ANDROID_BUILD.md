# Android Build Guide

Complete guide for building and deploying HisaabDost as an Android app using Capacitor.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Android Setup](#initial-android-setup)
3. [Development Workflow](#development-workflow)
4. [Building Release APK](#building-release-apk)
5. [Publishing to Play Store](#publishing-to-play-store)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Android Studio** (Latest stable version)
   - Download: https://developer.android.com/studio
   - Include Android SDK, Android SDK Platform, and Android Virtual Device

2. **Java Development Kit (JDK) 17+**
   - Download: https://www.oracle.com/java/technologies/downloads/
   - Or use OpenJDK: https://openjdk.org/

3. **Android SDK**
   - Minimum API Level: 22 (Android 5.1)
   - Target API Level: 33+ (Android 13+)
   - Install via Android Studio → SDK Manager

### Environment Variables

Add these to your system environment:

**macOS/Linux** (add to `~/.bashrc` or `~/.zshrc`):
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Windows** (add to System Environment Variables):
```
ANDROID_HOME=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
Path=%Path%;%ANDROID_HOME%\\platform-tools;%ANDROID_HOME%\\tools
```

**Verify installation:**
```bash
android --version
adb --version
```

---

## Initial Android Setup

### 1. Add Android Platform

```bash
# Build the web app first
npm run build

# Add Android platform
npx cap add android
```

This creates an `android/` directory with the native Android project.

### 2. Update Capacitor Configuration

Ensure `capacitor.config.ts` is properly configured:

```typescript
const config: CapacitorConfig = {
  appId: 'com.hisaabdost.app',
  appName: 'HisaabDost',
  webDir: 'dist',
  bundledWebRuntime: false,
  
  // For production, comment out the server config
  // server: {
  //   url: "https://...",
  //   cleartext: true
  // },
  
  android: {
    allowMixedContent: false,
    backgroundColor: "#ffffff",
    // ... other settings
  }
};
```

**Important:** Remove or comment out the `server.url` for production builds!

### 3. Initial Sync

```bash
npm run cap:sync
```

This syncs your web build with the native Android project.

### 4. Open in Android Studio

```bash
npx cap open android
```

This opens the Android project in Android Studio.

---

## Development Workflow

### Quick Development Cycle

```bash
# 1. Make changes to React code
# 2. Build and sync
npm run cap:sync

# 3. Run on device/emulator
npm run cap:run:android
```

### Hot Reload During Development

For faster development, you can use the dev server:

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: "http://localhost:8080",
     cleartext: true
   }
   ```

3. Sync and run:
   ```bash
   npx cap sync android
   npx cap run android
   ```

**Remember:** Remove `server` config before production builds!

### Testing on Emulator

1. Open Android Studio
2. Go to **Tools** → **Device Manager**
3. Create a virtual device (e.g., Pixel 5, API 33)
4. Start the emulator
5. Run: `npm run cap:run:android`

### Testing on Physical Device

1. Enable **Developer Options** on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times

2. Enable **USB Debugging**:
   - Settings → Developer Options → USB Debugging

3. Connect device via USB

4. Verify connection:
   ```bash
   adb devices
   ```

5. Run app:
   ```bash
   npm run cap:run:android
   ```

---

## Building Release APK

### 1. Generate Signing Key

```bash
# Create keystore directory
mkdir -p android/app/keystore

# Generate keystore
keytool -genkey -v -keystore android/app/keystore/release.keystore \
  -alias hisaabdost-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Important:** 
- Keep your keystore file secure!
- Remember the passwords you set
- Back up the keystore (losing it means you can't update your app)

### 2. Configure Signing

Create `android/key.properties`:

```properties
storePassword=your_keystore_password
keyPassword=your_key_password
keyAlias=hisaabdost-key
storeFile=keystore/release.keystore
```

Add to `android/app/build.gradle`:

```gradle
// Add before android { ... }
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config
    
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Update App Version

Update `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 1      // Increment for each release
        versionName "1.0.0" // User-facing version
    }
}
```

### 4. Build Release APK

```bash
# Using npm script
npm run cap:build:android

# Or manually
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### 5. Build App Bundle (AAB) for Play Store

```bash
cd android
./gradlew bundleRelease
```

AAB location: `android/app/build/outputs/bundle/release/app-release.aab`

**Note:** Google Play requires AAB format for new apps.

---

## Publishing to Play Store

### 1. Prepare App Metadata

Create the following:
- **App icon**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: At least 2 per device type
- **App description**: Short and full descriptions
- **Privacy policy URL**
- **Content rating questionnaire**

### 2. Create Play Console Account

1. Go to https://play.google.com/console
2. Pay $25 one-time registration fee
3. Create developer account

### 3. Create New App

1. Click **Create app**
2. Fill in app details:
   - App name: HisaabDost
   - Default language
   - App/Game type
   - Free/Paid

### 4. Complete Store Listing

1. Navigate to **Store presence** → **Main store listing**
2. Fill in:
   - Short description (80 chars)
   - Full description (4000 chars)
   - App icon
   - Feature graphic
   - Screenshots
   - Category
   - Contact details

### 5. Upload App Bundle

1. Go to **Release** → **Production**
2. Click **Create new release**
3. Upload `app-release.aab`
4. Fill in release notes
5. Review and rollout

### 6. Content Rating

1. Complete questionnaire
2. Submit for rating
3. Apply ratings to release

### 7. Review and Publish

1. Complete all required sections
2. Submit for review
3. Wait for approval (1-7 days)

---

## Troubleshooting

### Issue 1: Gradle build fails

**Solution:**
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### Issue 2: "ANDROID_HOME not set"

**Solution:**
```bash
# Verify ANDROID_HOME
echo $ANDROID_HOME

# If empty, add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### Issue 3: Capacitor sync errors

**Solution:**
```bash
# Rebuild web app
npm run build

# Sync again
npx cap sync android
```

### Issue 4: App crashes on startup

**Check:**
1. Capacitor config is correct
2. `server` config is removed in production
3. All permissions are declared in `AndroidManifest.xml`
4. Check Android Studio Logcat for errors

### Issue 5: White screen on Android

**Solution:**
1. Ensure `dist/` folder exists and has content
2. Check `capacitor.config.ts` → `webDir: 'dist'`
3. Verify base path in `vite.config.ts` → `base: './'`
4. Clear app data and reinstall

### Issue 6: File access issues

**Add permissions to `android/app/src/main/AndroidManifest.xml`:**
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

### Issue 7: Build conflicts with dependencies

**Solution:**
```bash
# Check for duplicate classes
cd android
./gradlew app:dependencies

# Clean and rebuild
./gradlew clean
./gradlew assembleDebug
```

---

## Best Practices

1. **Test on multiple devices**: Different screen sizes and Android versions
2. **Optimize images**: Use WebP format, compress assets
3. **Enable ProGuard**: Minify and obfuscate code
4. **Monitor performance**: Use Android Profiler
5. **Handle offline**: Implement proper offline functionality
6. **Update regularly**: Keep Capacitor and plugins updated
7. **Version control**: Always commit `package-lock.json`
8. **Backup keystore**: Store in secure location (not in git!)

---

## Useful Commands

```bash
# Check connected devices
adb devices

# View device logs
adb logcat

# Clear app data
adb shell pm clear com.hisaabdost.app

# Uninstall app
adb uninstall com.hisaabdost.app

# Install APK
adb install path/to/app-release.apk

# Check app info
adb shell dumpsys package com.hisaabdost.app

# Capacitor commands
npx cap sync android
npx cap open android
npx cap run android
npx cap copy android
```

---

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Capacitor Android](https://capacitorjs.com/docs/android)
- [Google Play Console](https://play.google.com/console)

---

**Need help?** Open an issue on GitHub or contact the development team.
