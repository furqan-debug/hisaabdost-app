package app.lovable.ccb1b3984ebf47e1ac451522f307f140;

import com.appsflyer.AppsFlyerLib;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        android.webkit.WebView.setWebContentsDebuggingEnabled(true);
        super.onCreate(savedInstanceState);

        Log.d("StartupTrace", "🚀 MainActivity started");

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
}
