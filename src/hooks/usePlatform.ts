
import { useMemo } from 'react';
import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

interface PlatformInfo {
  platform: Platform;
  isIOS: boolean;
  isAndroid: boolean;
  isNative: boolean;
  isWeb: boolean;
}

// Cache the platform detection result
let cachedPlatformInfo: PlatformInfo | null = null;

const detectPlatform = (): PlatformInfo => {
  if (cachedPlatformInfo) {
    return cachedPlatformInfo;
  }

  const isNative = Capacitor.isNativePlatform();
  const capacitorPlatform = Capacitor.getPlatform();
  
  let platform: Platform = 'web';
  
  if (isNative) {
    platform = capacitorPlatform === 'ios' ? 'ios' : 'android';
  } else {
    // Fallback detection for web browsers on mobile devices
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      platform = 'ios';
    } else if (/android/.test(userAgent)) {
      platform = 'android';
    }
  }

  cachedPlatformInfo = {
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isNative,
    isWeb: !isNative,
  };

  return cachedPlatformInfo;
};

export const usePlatform = (): PlatformInfo => {
  return useMemo(() => detectPlatform(), []);
};

// Static getter for non-hook contexts
export const getPlatformInfo = (): PlatformInfo => detectPlatform();
