
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ccb1b3984ebf47e1ac451522f307f140',
  appName: 'hisaabdost',
  webDir: 'dist',
  bundledWebRuntime: false,
  
  // Server configuration - only enable for development
  // Comment out or remove the server config for production builds
  // server: {
  //   url: "https://ccb1b398-4ebf-47e1-ac45-1522f307f140.lovableproject.com?forceHideBadge=true",
  //   cleartext: true
  // },
  
  // Android specific optimizations with conflict resolution
  android: {
    allowMixedContent: true,
    captureInput: true,
    initialFocus: false,
    webContentsDebuggingEnabled: true,
    backgroundColor: "#ffffff",
    overscrollHistory: false,
    hardwareAcceleration: "all",
    navigationBarColor: "#ffffff",
    statusBarStyle: "dark",
    statusBarBackgroundColor: "#ffffff",
    statusBarOverlaysWebView: true,
    resizeOnFullScreen: true,
    // Add build configuration to handle duplicate classes
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      signingType: 'apksigner'
    }
  },
  
  // Enhanced plugin configuration for production
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    WebView: {
      allowFileAccess: true,
      androidScheme: "https",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#ffffff",
      overlaysWebView: true,
      animated: true
    },
    Keyboard: {
      resize: true,
      resizeOnFullScreen: true,
      style: "dark"
    },
    Filesystem: {
      androidRequestLegacyExternalStorage: true,
      androidScheme: "https"
    },
    Share: {
      enabled: true
    },
    App: {
      enabled: true
    },
    // Simplified AdMob configuration to avoid conflicts
    AdMob: {
      appId: "ca-app-pub-8996865130200922~6761545939",
      testingDevices: [], // Empty for production
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
      maxAdContentRating: "G",
      // Add configuration to handle build conflicts
      androidManifestApplicationExtras: []
    }
  },
  
  // Deep link configuration
  server: {
    androidScheme: "https"
  }
};

export default config;
