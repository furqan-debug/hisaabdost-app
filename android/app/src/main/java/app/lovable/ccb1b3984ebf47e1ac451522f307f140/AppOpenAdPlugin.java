package app.lovable.ccb1b3984ebf47e1ac451522f307f140;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.MobileAds;

@CapacitorPlugin(name = "AppOpenAd")
public class AppOpenAdPlugin extends Plugin {
    private static final String LOG_TAG = "AppOpenAdPlugin";
    private AppOpenAdManager adManager;

    @Override
    public void load() {
        Log.d(LOG_TAG, "🔌 AppOpenAdPlugin loaded successfully");
        MobileAds.initialize(getContext(), initializationStatus ->
                Log.d(LOG_TAG, "Mobile Ads SDK initialized.")
        );
    }

    // ---------------------------- INITIALIZE ----------------------------
    @PluginMethod
    public void initialize(PluginCall call) {
        String adUnitId = call.getString("adUnitId");

        if (adUnitId == null || adUnitId.isEmpty()) {
            call.reject("❌ Ad Unit ID is required");
            return;
        }

        try {
            MainActivity mainActivity = (MainActivity) getActivity();
            if (mainActivity == null) {
                call.reject("❌ Activity not available");
                return;
            }

            adManager = new AppOpenAdManager(mainActivity.getApplication(), adUnitId);

            Log.d(LOG_TAG, "✅ AppOpenAdManager initialized with Ad Unit: " + adUnitId);
            call.resolve();
        } catch (Exception e) {
            Log.e(LOG_TAG, "❌ Failed to initialize: " + e.getMessage(), e);
            call.reject("Failed to initialize: " + e.getMessage());
        }
    }

    // ---------------------------- LOAD AD ----------------------------
    @PluginMethod
    public void loadAd(PluginCall call) {
        try {
            if (adManager == null) {
                call.reject("❌ Ad Manager not initialized");
                return;
            }

            getActivity().runOnUiThread(() -> {
                adManager.loadAd(getActivity());
                Log.d(LOG_TAG, "✅ Load ad requested");
                call.resolve();
            });
        } catch (Exception e) {
            Log.e(LOG_TAG, "❌ Failed to load ad: " + e.getMessage(), e);
            call.reject("Failed to load ad: " + e.getMessage());
        }
    }

    // ---------------------------- SHOW AD ----------------------------
    @PluginMethod
    public void showAd(PluginCall call) {
        try {
            if (adManager == null) {
                call.reject("❌ Ad Manager not initialized");
                return;
            }

            getActivity().runOnUiThread(() -> {
                adManager.showAdIfAvailable(getActivity());
                Log.d(LOG_TAG, "✅ Show ad requested");
                call.resolve();
            });
        } catch (Exception e) {
            Log.e(LOG_TAG, "❌ Failed to show ad: " + e.getMessage(), e);
            call.reject("Failed to show ad: " + e.getMessage());
        }
    }

    // ---------------------------- GET STATUS ----------------------------
    @PluginMethod
    public void getStatus(PluginCall call) {
        try {
            if (adManager == null) {
                call.reject("❌ Ad Manager not initialized");
                return;
            }

            JSObject status = new JSObject();
            status.put("isLoaded", adManager.isAdLoaded());
            status.put("isShowing", adManager.isAdShowing());

            Log.d(LOG_TAG, "📊 Ad status checked");
            call.resolve(status);
        } catch (Exception e) {
            Log.e(LOG_TAG, "❌ Failed to get status: " + e.getMessage(), e);
            call.reject("Failed to get status: " + e.getMessage());
        }
    }
}
