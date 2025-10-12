package app.lovable.ccb1b3984ebf47e1ac451522f307f140;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.d("StartupTrace", "🚀 MainActivity started");

        try {
            // ✅ Firebase is automatically initialized by the Gradle plugin.
            // No need to call FirebaseApp.initializeApp() manually.

            // ✅ Optional: Test FCM token retrieval safely
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
