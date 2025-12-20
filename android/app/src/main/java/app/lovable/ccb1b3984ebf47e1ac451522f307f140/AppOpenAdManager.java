package app.lovable.ccb1b3984ebf47e1ac451522f307f140;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.ProcessLifecycleOwner;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.RequestConfiguration;
import com.google.android.gms.ads.appopen.AppOpenAd;

import java.util.Collections;
import java.util.Date;

public class AppOpenAdManager implements Application.ActivityLifecycleCallbacks, DefaultLifecycleObserver {

    private static final String LOG_TAG = "AppOpenAdManager";
    private static final long AD_CACHE_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours
    private static final long MIN_SHOW_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

    private final Application application;
    private AppOpenAd appOpenAd = null;
    private Activity currentActivity;
    private final String adUnitId;
    private long loadTime = 0;
    private long lastShownTime = 0;
    private boolean isShowingAd = false;
    private boolean isLoadingAd = false;

    public AppOpenAdManager(Application application, String adUnitId) {
        this.application = application;
        this.adUnitId = adUnitId;

        // ✅ Register test device for AdMob
        RequestConfiguration configuration = new RequestConfiguration.Builder()
                .setTestDeviceIds(Collections.singletonList("938e28d1-e0bf-45c3-bdb4-c4178078c673"))
                .build();
        MobileAds.setRequestConfiguration(configuration);

        // ✅ Observe lifecycle
        ProcessLifecycleOwner.get().getLifecycle().addObserver(this);
        application.registerActivityLifecycleCallbacks(this);
    }

    // ---------------------------- LOAD AD ----------------------------
    public void loadAd(Activity activity) {
        if (isLoadingAd || isAdAvailable()) {
            Log.d(LOG_TAG, "⚠️ Ad already loading or available");
            return;
        }

        isLoadingAd = true;
        AdRequest request = new AdRequest.Builder().build();
        Log.d(LOG_TAG, "📡 Loading App Open Ad with ID: " + adUnitId);

        AppOpenAd.load(
                activity,
                adUnitId,
                request,
                AppOpenAd.APP_OPEN_AD_ORIENTATION_PORTRAIT,
                new AppOpenAd.AppOpenAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull AppOpenAd ad) {
                        Log.d(LOG_TAG, "✅ App Open Ad loaded successfully");
                        appOpenAd = ad;
                        loadTime = new Date().getTime();
                        isLoadingAd = false;
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError error) {
                        Log.e(LOG_TAG, "❌ Failed to load App Open Ad: " + error.getMessage());
                        isLoadingAd = false;
                        appOpenAd = null;
                    }
                }
        );
    }

    private boolean isAdAvailable() {
        return appOpenAd != null && (new Date().getTime() - loadTime) < AD_CACHE_TIMEOUT;
    }

    private boolean canShowAd() {
        return (lastShownTime == 0) ||
                ((new Date().getTime() - lastShownTime) >= MIN_SHOW_INTERVAL);
    }

    // ---------------------------- SHOW AD ----------------------------
    public void showAdIfAvailable(@NonNull Activity activity) {
        if (isShowingAd) {
            Log.d(LOG_TAG, "⚠️ Ad already showing");
            return;
        }

        if (!isAdAvailable()) {
            Log.d(LOG_TAG, "🔄 Ad not available — loading new one");
            loadAd(activity);
            return;
        }

        if (!canShowAd()) {
            Log.d(LOG_TAG, "🕓 Ad cooldown (4h) not complete");
            return;
        }

        Log.d(LOG_TAG, "📺 Showing App Open Ad");

        appOpenAd.setOnPaidEventListener(adValue -> {
            Log.d(LOG_TAG, "💵 Paid event received from AdMob");
        });

        appOpenAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                Log.d(LOG_TAG, "✅ Ad dismissed");
                appOpenAd = null;
                isShowingAd = false;
                lastShownTime = new Date().getTime();
                loadAd(currentActivity);
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                Log.e(LOG_TAG, "❌ Failed to show ad: " + adError.getMessage());
                appOpenAd = null;
                isShowingAd = false;
                loadAd(currentActivity);
            }

            @Override
            public void onAdShowedFullScreenContent() {
                Log.d(LOG_TAG, "📱 App Open Ad displayed");
                isShowingAd = true;
            }
        });

        appOpenAd.show(activity);
    }

    // ---------------------------- LIFECYCLE ----------------------------
    @Override
    public void onStart(@NonNull LifecycleOwner owner) {
        if (currentActivity != null) {
            Log.d(LOG_TAG, "🔄 App moved to foreground — checking for Ad");
            showAdIfAvailable(currentActivity);
        }
    }

    @Override public void onActivityCreated(@NonNull Activity activity, Bundle savedInstanceState) {}
    @Override public void onActivityStarted(@NonNull Activity activity) { currentActivity = activity; }
    @Override public void onActivityResumed(@NonNull Activity activity) { currentActivity = activity; }
    @Override public void onActivityPaused(@NonNull Activity activity) {}
    @Override public void onActivityStopped(@NonNull Activity activity) {}
    @Override public void onActivitySaveInstanceState(@NonNull Activity activity, @NonNull Bundle outState) {}
    @Override public void onActivityDestroyed(@NonNull Activity activity) {}

    public boolean isAdLoaded() { return isAdAvailable(); }
    public boolean isAdShowing() { return isShowingAd; }
}
