
import { supabase } from '@/integrations/supabase/client';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface BroadcastNotificationPayload extends NotificationPayload {
  sendToAll?: boolean;
  userIds?: string[];
}

export class PushNotificationService {
  private static isInitialized = false;
  private static permissionRequested = false;
  private static currentDeviceToken: string | null = null;

  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Push notifications already initialized');
      return;
    }

    try {
      console.log('🔔 Initializing push notifications...');
      
      // Check if we're running on a mobile platform
      if (Capacitor.isNativePlatform()) {
        console.log('Initializing mobile push notifications with Capacitor');
        await this.initializeMobile();
      } else {
        console.log('Initializing web push notifications');
        await this.initializeWeb();
      }

      console.log('✅ Push notifications initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      throw error;
    }
  }

  private static async initializeMobile(): Promise<void> {
    // Add listeners for push notification events
    await PushNotifications.addListener('registration', async (token) => {
      console.log('📱 Push registration success, token:', token.value);
      this.currentDeviceToken = token.value;
      await this.saveDeviceToken(token.value, 'android'); // Adjust platform detection as needed
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ Push registration error:', error);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📨 Push notification received:', notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('👆 Push notification action performed:', notification);
    });

    // Request permissions and register immediately
    const permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
    }
  }

  private static async initializeWeb(): Promise<void> {
    // Check if we're in a web environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      console.log('Push notifications not available in this environment');
      return;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Notifications not supported in this browser');
      return;
    }

    // If permission is already granted, we're good to go
    if (Notification.permission === 'granted') {
      console.log('✅ Web notifications already permitted');
    }
  }

  private static async saveDeviceToken(token: string, platform: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, skipping token save');
        return;
      }

      console.log('💾 Saving device token for user:', user.id);

      // Insert or update the device token
      const { error } = await supabase
        .from('user_device_tokens')
        .upsert({
          user_id: user.id,
          device_token: token,
          platform: platform,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'device_token,user_id'
        });

      if (error) {
        console.error('❌ Failed to save device token:', error);
      } else {
        console.log('✅ Device token saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving device token:', error);
    }
  }

  static async requestPermission(): Promise<NotificationPermission | 'granted' | 'denied'> {
    this.permissionRequested = true;

    if (Capacitor.isNativePlatform()) {
      console.log('📱 Requesting mobile push notification permission');
      try {
        const result = await PushNotifications.requestPermissions();
        console.log('Mobile permission result:', result);
        
        if (result.receive === 'granted') {
          // Register for push notifications
          await PushNotifications.register();
          return 'granted';
        } else {
          return 'denied';
        }
      } catch (error) {
        console.error('❌ Failed to request mobile push permissions:', error);
        return 'denied';
      }
    } else {
      // Web implementation
      if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return 'denied';
      }

      if (Notification.permission === 'default') {
        console.log('🔔 Requesting web notification permission...');
        const permission = await Notification.requestPermission();
        console.log('Web notification permission result:', permission);
        return permission;
      }

      return Notification.permission;
    }
  }

  static async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      console.log('📤 Sending push notification:', payload);
      
      if (Capacitor.isNativePlatform()) {
        // For mobile, send via backend service
        console.log('📱 Sending mobile notification via backend service');
        await this.sendBroadcastNotification({
          ...payload,
          sendToAll: false
        });
      } else {
        // Web implementation
        const permission = await this.requestPermission();
        
        if (permission !== 'granted') {
          console.log('❌ Notification permission not granted:', permission);
          return;
        }

        // Send browser notification for web
        const notification = new Notification(payload.title, {
          body: payload.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'hisaab-dost-notification',
          requireInteraction: false,
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      console.log('✅ Notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      throw error;
    }
  }

  static async sendBroadcastNotification(payload: BroadcastNotificationPayload): Promise<any> {
    try {
      console.log('📡 Sending broadcast notification via edge function:', payload);
      
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          // Edge function expects userId; use 'all' to broadcast to everyone
          userId: 'all',
          title: payload.title,
          body: payload.body,
          data: payload.data,
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      console.log('✅ Broadcast notification sent successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to send broadcast notification:', error);
      throw error;
    }
  }

  static getPermissionStatus(): NotificationPermission | 'granted' | 'denied' | 'default' {
    if (Capacitor.isNativePlatform()) {
      // For mobile, we need to check the actual permission status
      return this.permissionRequested ? 'granted' : 'default';
    } else {
      if (!('Notification' in window)) {
        return 'denied';
      }
      return Notification.permission;
    }
  }

  static isPermissionGranted(): boolean {
    const status = this.getPermissionStatus();
    return status === 'granted';
  }

  static async checkPermissions(): Promise<any> {
    if (Capacitor.isNativePlatform()) {
      try {
        const permissions = await PushNotifications.checkPermissions();
        console.log('📱 Mobile push permissions:', permissions);
        return permissions;
      } catch (error) {
        console.error('❌ Failed to check mobile push permissions:', error);
        return { receive: 'prompt' };
      }
    } else {
      return {
        receive: this.getPermissionStatus()
      };
    }
  }

  // Force initialization - useful for debugging
  static async forceInitialize(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }
}
