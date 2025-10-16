import { useEffect, useRef } from 'react';
import { App, AppState } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { NativeAppOpenAdService } from '@/services/nativeAppOpenAdService';

interface UseAppOpenAdsConfig {
  adUnitId: string;
  testingDevices?: string[];
  showFrequencyHours?: number;
  enabled?: boolean;
}

export const useAppOpenAds = (config: UseAppOpenAdsConfig) => {
  const adServiceRef = useRef<NativeAppOpenAdService | null>(null);
  const lastActiveTimeRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!config.enabled || !Capacitor.isNativePlatform()) {
      return;
    }

    const initializeAds = async () => {
      try {
        // Wait for native bridge to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🚀 Initializing Native App Open ads hook...');
        
        // Get or create service instance
        adServiceRef.current = NativeAppOpenAdService.getInstance({
          adUnitId: config.adUnitId,
          showFrequencyHours: config.showFrequencyHours
        });

        // Initialize the service
        await adServiceRef.current.initialize();
        
        // Load first ad
        await adServiceRef.current.loadAd();
        
        isInitializedRef.current = true;
        console.log('✅ App Open ads hook initialized');
      } catch (error) {
        console.error('❌ Failed to initialize App Open ads hook:', error);
        // Don't throw - allow app to continue without ads
      }
    };

    const handleAppStateChange = async (state: AppState) => {
      if (!adServiceRef.current || !isInitializedRef.current) {
        return;
      }

      console.log('📱 App state changed:', state.isActive);

      if (state.isActive) {
        // App became active
        const now = Date.now();
        const timeSinceLastActive = now - lastActiveTimeRef.current;
        
        // Show ad if app was in background for more than 30 seconds
        // This prevents ads from showing during quick app switches
        if (timeSinceLastActive > 30000) {
          console.log('📺 App resumed from background, attempting to show ad...');
          setTimeout(async () => {
            try {
              await adServiceRef.current?.showAd();
            } catch (error) {
              console.error('❌ Failed to show app open ad on resume:', error);
            }
          }, 100); // Small delay to ensure UI is ready
        }
      } else {
        // App went to background
        lastActiveTimeRef.current = Date.now();
      }
    };

    // Initialize the ads
    initializeAds();

    // Set up app state listener
    let removeListener: () => void;

    const setupListener = async () => {
      const listener = await App.addListener('appStateChange', handleAppStateChange);
      removeListener = () => listener.remove();
    };

    setupListener();

    // Show ad on initial app open (cold start)
    const showInitialAd = async () => {
      // Wait a bit for the app to fully load
      setTimeout(async () => {
        if (adServiceRef.current && isInitializedRef.current) {
          console.log('📺 Showing initial app open ad...');
          try {
            await adServiceRef.current.showAd();
          } catch (error) {
            console.error('❌ Failed to show initial app open ad:', error);
          }
        }
      }, 2000); // 2 second delay for initial load
    };

    showInitialAd();

    // Cleanup
    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, [config.enabled, config.adUnitId, config.testingDevices, config.showFrequencyHours]);

  return {
    getAdStatus: () => adServiceRef.current?.getStatus() || {
      isLoaded: false,
      isShowing: false,
      canShow: false,
      nextAvailableTime: 0
    },
    showAd: () => adServiceRef.current?.showAd() || Promise.resolve(false),
    loadAd: () => adServiceRef.current?.loadAd() || Promise.resolve()
  };
};