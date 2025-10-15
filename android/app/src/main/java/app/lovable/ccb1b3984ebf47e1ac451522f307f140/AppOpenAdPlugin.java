package app.lovable.ccb1b3984ebf47e1ac451522f307f140;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppOpenAd")
public class AppOpenAdPlugin extends Plugin {
    private static final String LOG_TAG = "AppOpenAdPlugin";
    private AppOpenAdManager adManager;

    @Override
    public void load() {
        Log.d(LOG_TAG, "Plugin loaded");
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        String adUnitId = call.getString("adUnitId");
        
        if (adUnitId == null || adUnitId.isEmpty()) {
            call.reject("Ad Unit ID is required");
            return;
        }

        try {
            MainActivity mainActivity = (MainActivity) getActivity();
            if (mainActivity != null) {
                adManager = mainActivity.getAppOpenAdManager();
                if (adManager != null) {
                    adManager.setAdUnitId(adUnitId);
                    Log.d(LOG_TAG, "✅ App Open Ad Manager initialized with ID: " + adUnitId);
                    call.resolve();
                } else {
                    call.reject("Ad Manager not available");
                }
            } else {
                call.reject("Activity not available");
            }
        } catch (Exception e) {
            Log.e(LOG_TAG, "❌ Failed to initialize: " + e.getMessage());
            call.reject("Failed to initialize: " + e.getMessage());
        }
    }

    @PluginMethod
    public void loadAd(PluginCall call) {
        try {
            if (adManager == null) {
                call.reject("Ad Manager not initialized");
                return;
            }

            getActivity().runOnUiThread(() -> {
                adManager.loadAd(getActivity());
                Log.d(LOG_TAG, "✅ Load ad requested");
                call.resolve();
            });
        } catch (Exception e) {
            Log.e(LOG_TAG, "❌ Failed to load ad: " + e.getMessage());
            call.reject("Failed to load ad: " + e.getMessage());
        }
    }

    @PluginMethod
    public void showAd(PluginCall call) {
        try {
            if (adManager == null) {
                call.reject("Ad Manager not initialized");
                return;
            }

            getActivity().runOnUiThread(() -> {
                adManager.showAdIfAvailable(getActivity());
                Log.d(LOG_TAG, "✅ Show ad requested");
                call.resolve();
            });
        } catch (Exception e) {
            Log.e(LOG_TAG, "❌ Failed to show ad: " + e.getMessage());
            call.reject("Failed to show ad: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setFrequency(PluginCall call) {
        Integer hours = call.getInt("hours", 4);
        
        try {
            if (adManager != null) {
                adManager.setFrequencyHours(hours);
                Log.d(LOG_TAG, "✅ Frequency set to " + hours + " hours");
            }
            call.resolve();
        } catch (Exception e) {
            Log.e(LOG_TAG, "❌ Failed to set frequency: " + e.getMessage());
            call.reject("Failed to set frequency: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        try {
            if (adManager == null) {
                call.reject("Ad Manager not initialized");
                return;
            }

            JSObject status = new JSObject();
            status.put("isLoaded", adManager.isAdLoaded());
            status.put("isShowing", adManager.isAdShowing());
            
            call.resolve(status);
        } catch (Exception e) {
            Log.e(LOG_TAG, "❌ Failed to get status: " + e.getMessage());
            call.reject("Failed to get status: " + e.getMessage());
        }
    }
}
