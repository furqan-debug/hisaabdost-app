package app.lovable.ccb1b3984ebf47e1ac451522f307f140;

import com.appsflyer.AppsFlyerLib;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import com.appsflyer.AppsFlyerLib;
import com.appsflyer.adrevenue.AppsFlyerAdRevenue;

public class MainActivity extends BridgeActivity {

    private AppOpenAdManager appOpenAdManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        android.webkit.WebView.setWebContentsDebuggingEnabled(true);
        super.onCreate(savedInstanceState);
        
        // Register plugin
        registerPlugin(AppOpenAdPlugin.class);

        Log.d("StartupTrace", "🚀 MainActivity started");

        // Initialize Google Mobile Ads SDK
        MobileAds.initialize(this, new OnInitializationCompleteListener() {
            @Override
            public void onInitializationComplete(InitializationStatus initializationStatus) {
                Log.d("AdMob", "✅ Google Mobile Ads SDK initialized");
            }
        });

        // Initialize AppsFlyer Ad Revenue SDK
        try {
            AppsFlyerAdRevenue.initialize(new AppsFlyerAdRevenue.Builder(this)
                .build());
            Log.d("AppsFlyerAdRevenue", "✅ AppsFlyer Ad Revenue SDK initialized");
        } catch (Exception e) {
            Log.e("AppsFlyerAdRevenue", "❌ Failed to initialize: " + e.getMessage(), e);
        }

        // Initialize App Open Ad Manager with context
        appOpenAdManager = new AppOpenAdManager(
            getApplicationContext(), 
            "ca-app-pub-8996865130200922/5906339239"
        );
        getApplication().registerActivityLifecycleCallbacks(appOpenAdManager);
        Log.d("AppOpenAd", "✅ App Open Ad Manager initialized");

        try {
            // ✅ Initialize AppsFlyer SDK with your Dev Key
            AppsFlyerLib.getInstance().init("5kDPmUQDUZKfoFXNsrxfY7", null, this);

            // ✅ Enable debug logs (for testing only — remove before publishing)
            AppsFlyerLib.getInstance().setDebugLog(true);

            // ✅ Start the AppsFlyer SDK (this sends install data)
            AppsFlyerLib.getInstance().start(this);
            Log.d("AppsFlyerInit", "✅ AppsFlyer SDK started successfully");

            // ✅ Firebase automatically initialized by Gradle plugin
            FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        Log.w("FirebaseInit", "❌ Failed to fetch FCM token", task.getException());
                        return;
                    }
                    String token = task.getResult();
                    Log.d("FirebaseInit", "✅ FCM Token: " + token);
                });

        } catch (Exception e) {
            Log.e("StartupTrace", "❌ Crash during onCreate: " + e.getMessage(), e);
        }

        Log.d("StartupTrace", "✅ MainActivity onCreate finished");
    }

    public AppOpenAdManager getAppOpenAdManager() {
        return appOpenAdManager;
    }
}
