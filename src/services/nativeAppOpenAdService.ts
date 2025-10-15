import { registerPlugin } from '@capacitor/core';

interface AppOpenAdPlugin {
  initialize(options: { adUnitId: string }): Promise<void>;
  loadAd(): Promise<void>;
  showAd(): Promise<void>;
  setFrequency(options: { hours: number }): Promise<void>;
  getStatus(): Promise<{ isLoaded: boolean; isShowing: boolean }>;
}

const AppOpenAd = registerPlugin<AppOpenAdPlugin>('AppOpenAd');

export interface NativeAppOpenAdConfig {
  adUnitId: string;
  showFrequencyHours?: number;
}

export class NativeAppOpenAdService {
  private static instance: NativeAppOpenAdService | null = null;
  private config: NativeAppOpenAdConfig;
  private isInitialized = false;
  private lastShownTime = 0;

  private constructor(config: NativeAppOpenAdConfig) {
    this.config = config;
  }

  static getInstance(config: NativeAppOpenAdConfig): NativeAppOpenAdService {
    if (!NativeAppOpenAdService.instance) {
      NativeAppOpenAdService.instance = new NativeAppOpenAdService(config);
    }
    return NativeAppOpenAdService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ Native App Open Ad already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing Native App Open Ad...');
      await AppOpenAd.initialize({ adUnitId: this.config.adUnitId });
      
      if (this.config.showFrequencyHours) {
        await AppOpenAd.setFrequency({ hours: this.config.showFrequencyHours });
      }
      
      this.isInitialized = true;
      console.log('✅ Native App Open Ad initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Native App Open Ad:', error);
      throw error;
    }
  }

  async loadAd(): Promise<void> {
    if (!this.isInitialized) {
      console.warn('⚠️ Native App Open Ad not initialized, initializing now...');
      await this.initialize();
    }

    try {
      console.log('📡 Loading Native App Open Ad...');
      await AppOpenAd.loadAd();
      console.log('✅ Native App Open Ad loaded');
    } catch (error) {
      console.error('❌ Failed to load Native App Open Ad:', error);
      throw error;
    }
  }

  async showAd(): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('⚠️ Cannot show ad: Not initialized');
      return false;
    }

    try {
      const status = await this.getStatus();
      
      if (!status.isLoaded) {
        console.log('⚠️ Ad not loaded, loading now...');
        await this.loadAd();
        return false;
      }

      if (status.isShowing) {
        console.log('⚠️ Ad is already showing');
        return false;
      }

      const now = Date.now();
      const timeSinceLastShown = now - this.lastShownTime;
      const minInterval = (this.config.showFrequencyHours || 4) * 60 * 60 * 1000;

      if (this.lastShownTime > 0 && timeSinceLastShown < minInterval) {
        console.log(`⚠️ Too soon to show ad. ${Math.ceil((minInterval - timeSinceLastShown) / 60000)} minutes remaining`);
        return false;
      }

      console.log('📺 Showing Native App Open Ad...');
      await AppOpenAd.showAd();
      this.lastShownTime = now;
      console.log('✅ Native App Open Ad shown');
      return true;
    } catch (error) {
      console.error('❌ Failed to show Native App Open Ad:', error);
      return false;
    }
  }

  async getStatus(): Promise<{ isLoaded: boolean; isShowing: boolean; canShow: boolean; nextAvailableTime: number }> {
    try {
      const status = await AppOpenAd.getStatus();
      
      const now = Date.now();
      const timeSinceLastShown = now - this.lastShownTime;
      const minInterval = (this.config.showFrequencyHours || 4) * 60 * 60 * 1000;
      const canShow = this.lastShownTime === 0 || timeSinceLastShown >= minInterval;
      const nextAvailableTime = canShow ? 0 : this.lastShownTime + minInterval;

      return {
        isLoaded: status.isLoaded,
        isShowing: status.isShowing,
        canShow: canShow && status.isLoaded,
        nextAvailableTime
      };
    } catch (error) {
      console.error('❌ Failed to get Native App Open Ad status:', error);
      return {
        isLoaded: false,
        isShowing: false,
        canShow: false,
        nextAvailableTime: 0
      };
    }
  }
}
