package app.lovable.ccb1b3984ebf47e1ac451522f307f140;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleObserver;
import androidx.lifecycle.OnLifecycleEvent;
import androidx.lifecycle.ProcessLifecycleOwner;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdValue;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.OnPaidEventListener;
import com.google.android.gms.ads.appopen.AppOpenAd;
import com.appsflyer.AFAdRevenueData;
import com.appsflyer.adrevenue.AppsFlyerAdRevenue;
import com.appsflyer.adrevenue.adnetworks.generic.MediationNetwork;
import com.appsflyer.adrevenue.adnetworks.generic.Scheme;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class AppOpenAdManager implements Application.ActivityLifecycleCallbacks, LifecycleObserver {
    private static final String LOG_TAG = "AppOpenAdManager";
    private static final long AD_CACHE_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours
    private static final long MIN_SHOW_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

    private AppOpenAd appOpenAd = null;
    private AppOpenAd.AppOpenAdLoadCallback loadCallback;
    private Activity currentActivity;
    private Context context;
    private String adUnitId;
    private long loadTime = 0;
    private long lastShownTime = 0;
    private boolean isShowingAd = false;
    private boolean isLoadingAd = false;

    public AppOpenAdManager(Context context, String adUnitId) {
        this.context = context;
        this.adUnitId = adUnitId;
        ProcessLifecycleOwner.get().getLifecycle().addObserver(this);
    }

    public void setAdUnitId(String adUnitId) {
        this.adUnitId = adUnitId;
    }

    public void setFrequencyHours(int hours) {
        // Frequency is handled by MIN_SHOW_INTERVAL
        Log.d(LOG_TAG, "Frequency set to " + hours + " hours");
    }

    /**
     * Load an app open ad
     */
    public void loadAd(Activity activity) {
        if (isLoadingAd || isAdAvailable()) {
            Log.d(LOG_TAG, "Ad already loading or available");
            return;
        }

        isLoadingAd = true;
        loadCallback = new AppOpenAd.AppOpenAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull AppOpenAd ad) {
                Log.d(LOG_TAG, "✅ App Open ad loaded successfully");
                appOpenAd = ad;
                loadTime = new Date().getTime();
                isLoadingAd = false;
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                Log.e(LOG_TAG, "❌ Failed to load App Open ad: " + loadAdError.getMessage());
                isLoadingAd = false;
                appOpenAd = null;
            }
        };

        AdRequest request = new AdRequest.Builder().build();
        Log.d(LOG_TAG, "📡 Loading App Open ad with ID: " + adUnitId);
        AppOpenAd.load(
            activity,
            adUnitId,
            request,
            AppOpenAd.APP_OPEN_AD_ORIENTATION_PORTRAIT,
            loadCallback
        );
    }

    /**
     * Check if ad is available and not expired
     */
    private boolean isAdAvailable() {
        return appOpenAd != null && wasLoadTimeLessThanNHoursAgo(4);
    }

    /**
     * Check if ad was loaded less than n hours ago
     */
    private boolean wasLoadTimeLessThanNHoursAgo(long numHours) {
        long dateDifference = new Date().getTime() - loadTime;
        long numMilliSecondsPerHour = 3600000;
        return (dateDifference < (numMilliSecondsPerHour * numHours));
    }

    /**
     * Check if enough time has passed since last ad was shown
     */
    private boolean canShowAd() {
        long currentTime = new Date().getTime();
        long timeSinceLastShown = currentTime - lastShownTime;
        
        if (lastShownTime == 0) {
            return true; // First time showing
        }
        
        return timeSinceLastShown >= MIN_SHOW_INTERVAL;
    }

    /**
     * Log ad revenue to AppsFlyer
     */
    private void logAdRevenueToAppsFlyer(AdValue adValue, String adType, String placement) {
        try {
            // Convert micros to standard currency (AdMob uses micro-units)
            double revenue = adValue.getValueMicros() / 1_000_000.0;
            String currencyCode = adValue.getCurrencyCode();
            
            Log.d(LOG_TAG, "💰 Ad Revenue Event - Amount: " + revenue + " " + currencyCode + 
                  ", Type: " + adType + ", Placement: " + placement);
            
            // Build additional parameters map
            Map<String, Object> additionalParameters = new HashMap<>();
            additionalParameters.put(Scheme.AD_UNIT, adUnitId);
            additionalParameters.put(Scheme.AD_TYPE, adType);
            additionalParameters.put(Scheme.PLACEMENT, placement);
            
            // Create AFAdRevenueData object
            AFAdRevenueData adRevenueData = new AFAdRevenueData.Builder()
                .setMediationNetwork(MediationNetwork.ADMOB)
                .setRevenue(revenue)
                .setCurrency(currencyCode)
                .setAdditionalParameters(additionalParameters)
                .build();
            
            // Log to AppsFlyer
            AppsFlyerAdRevenue.logAdRevenue(context, adRevenueData, additionalParameters);
            
            Log.d(LOG_TAG, "✅ AppsFlyer Ad Revenue Logged Successfully");
            
        } catch (Exception e) {
            Log.e(LOG_TAG, "❌ Failed to log ad revenue to AppsFlyer: " + e.getMessage(), e);
        }
    }

    /**
     * Show the app open ad if available
     */
    public void showAdIfAvailable(@NonNull final Activity activity) {
        if (isShowingAd) {
            Log.d(LOG_TAG, "Ad is already showing");
            return;
        }

        if (!isAdAvailable()) {
            Log.d(LOG_TAG, "Ad not available, loading new ad");
            loadAd(activity);
            return;
        }

        if (!canShowAd()) {
            Log.d(LOG_TAG, "Not enough time passed since last ad (4 hour minimum)");
            return;
        }

        Log.d(LOG_TAG, "📺 Showing App Open ad");
        
        // Set up revenue tracking listener
        appOpenAd.setOnPaidEventListener(new OnPaidEventListener() {
            @Override
            public void onPaidEvent(@NonNull AdValue adValue) {
                Log.d(LOG_TAG, "💵 Paid event received from AdMob");
                logAdRevenueToAppsFlyer(adValue, "App Open", "App_Launch");
            }
        });
        
        appOpenAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                Log.d(LOG_TAG, "✅ App Open ad dismissed");
                appOpenAd = null;
                isShowingAd = false;
                lastShownTime = new Date().getTime();
                loadAd(currentActivity);
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                Log.e(LOG_TAG, "❌ Failed to show App Open ad: " + adError.getMessage());
                appOpenAd = null;
                isShowingAd = false;
                loadAd(currentActivity);
            }

            @Override
            public void onAdShowedFullScreenContent() {
                Log.d(LOG_TAG, "📱 App Open ad showed full screen");
                isShowingAd = true;
            }
        });

        appOpenAd.show(activity);
    }

    /**
     * Lifecycle observer - show ad when app comes to foreground
     */
    @OnLifecycleEvent(Lifecycle.Event.ON_START)
    public void onMoveToForeground() {
        if (currentActivity != null) {
            Log.d(LOG_TAG, "🔄 App moved to foreground");
            showAdIfAvailable(currentActivity);
        }
    }

    @Override
    public void onActivityCreated(@NonNull Activity activity, Bundle savedInstanceState) {}

    @Override
    public void onActivityStarted(@NonNull Activity activity) {
        if (!isShowingAd) {
            currentActivity = activity;
        }
    }

    @Override
    public void onActivityResumed(@NonNull Activity activity) {
        if (!isShowingAd) {
            currentActivity = activity;
        }
    }

    @Override
    public void onActivityPaused(@NonNull Activity activity) {}

    @Override
    public void onActivityStopped(@NonNull Activity activity) {}

    @Override
    public void onActivitySaveInstanceState(@NonNull Activity activity, @NonNull Bundle outState) {}

    @Override
    public void onActivityDestroyed(@NonNull Activity activity) {}

    public boolean isAdLoaded() {
        return isAdAvailable();
    }

    public boolean isAdShowing() {
        return isShowingAd;
    }
}
