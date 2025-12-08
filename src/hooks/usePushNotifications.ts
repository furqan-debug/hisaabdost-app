
import { useEffect, useRef } from 'react';
import { PushNotificationService } from '@/services/pushNotificationService';
import { useAuth } from '@/lib/auth';

export function usePushNotifications() {
  const { user } = useAuth();
  const isInitializing = useRef(false);

  useEffect(() => {
    const initializePushNotifications = async () => {
      if (user && !isInitializing.current) {
        isInitializing.current = true;
        console.log('🔔 Initializing push notifications for authenticated user');
        try {
          // Force re-initialize to refresh token on every app open
          await PushNotificationService.forceInitialize();
          
          // Auto-request permission for better UX
          const permission = await PushNotificationService.requestPermission();
          console.log('📱 Push notification permission:', permission);
          
        } catch (error) {
          console.log('❌ Push notification initialization failed:', error);
        } finally {
          isInitializing.current = false;
        }
      }
    };

    initializePushNotifications();
  }, [user]);

  const sendNotification = async (title: string, body: string, data?: Record<string, any>) => {
    try {
      await PushNotificationService.sendNotification({ title, body, data });
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      throw error;
    }
  };

  const sendBroadcastNotification = async (title: string, body: string, data?: Record<string, any>) => {
    try {
      const result = await PushNotificationService.sendBroadcastNotification({ 
        title, 
        body, 
        data,
        sendToAll: true 
      });
      return result;
    } catch (error) {
      console.error('❌ Failed to send broadcast notification:', error);
      throw error;
    }
  };

  const requestPermission = async () => {
    try {
      return await PushNotificationService.requestPermission();
    } catch (error) {
      console.error('❌ Failed to request notification permission:', error);
      return 'denied' as NotificationPermission;
    }
  };

  const isPermissionGranted = () => {
    return PushNotificationService.isPermissionGranted();
  };

  const forceReinitialize = async () => {
    try {
      await PushNotificationService.forceInitialize();
    } catch (error) {
      console.error('❌ Failed to reinitialize push notifications:', error);
    }
  };

  return { 
    sendNotification, 
    sendBroadcastNotification,
    requestPermission,
    isPermissionGranted,
    forceReinitialize
  };
}
