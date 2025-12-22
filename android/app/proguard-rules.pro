# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep WebView JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line number information for debugging
-keepattributes SourceFile,LineNumberTable

# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }

# Keep Supabase SDK classes
-keep class io.supabase.** { *; }

# Keep AppsFlyer SDK classes to prevent obfuscation
-keep class com.appsflyer.** { *; }

# Keep Kotlin internal classes (required for stability)
-keep class kotlin.jvm.internal.** { *; }

# Keep JavaScript bridge for WebView
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
    public void *(android.webkit.WebView, java.lang.String);
}

# Keep all classes that might be accessed from JavaScript
-keep class * implements android.webkit.JavascriptInterface { *; }
