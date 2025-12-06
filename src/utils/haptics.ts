
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

/**
 * Light haptic feedback - use for subtle interactions like selections
 */
export const lightImpact = async (): Promise<void> => {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {
    // Silently fail if haptics not available
  }
};

/**
 * Medium haptic feedback - use for button taps, confirmations
 */
export const mediumImpact = async (): Promise<void> => {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (e) {
    // Silently fail
  }
};

/**
 * Heavy haptic feedback - use for significant actions
 */
export const heavyImpact = async (): Promise<void> => {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (e) {
    // Silently fail
  }
};

/**
 * Selection changed feedback - use for picker/selector changes
 */
export const selectionChanged = async (): Promise<void> => {
  if (!isNative) return;
  try {
    await Haptics.selectionChanged();
  } catch (e) {
    // Silently fail
  }
};

/**
 * Success notification haptic
 */
export const notificationSuccess = async (): Promise<void> => {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    // Silently fail
  }
};

/**
 * Warning notification haptic
 */
export const notificationWarning = async (): Promise<void> => {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (e) {
    // Silently fail
  }
};

/**
 * Error notification haptic
 */
export const notificationError = async (): Promise<void> => {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (e) {
    // Silently fail
  }
};

/**
 * Vibrate for a specified duration (Android only, iOS uses haptics)
 */
export const vibrate = async (duration: number = 300): Promise<void> => {
  if (!isNative) return;
  try {
    await Haptics.vibrate({ duration });
  } catch (e) {
    // Silently fail
  }
};
