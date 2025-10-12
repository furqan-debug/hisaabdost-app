
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PushNotificationService } from '@/services/pushNotificationService';
import { Settings, Bell, BellOff, Check, X, TestTube } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSettingsProps {
  onClose: () => void;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { settings, setSettings } = useNotifications();
  const { sendNotification, sendBroadcastNotification, forceReinitialize } = usePushNotifications();
  const { toast } = useToast();
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const permissions = await PushNotificationService.checkPermissions();
        setPermissionStatus(permissions.receive || 'prompt');
      } else {
        setPermissionStatus(PushNotificationService.getPermissionStatus());
      }
    } catch (error) {
      console.error('Failed to check permission status:', error);
      setPermissionStatus('denied');
    }
  };

  const handlePermissionRequest = async () => {
    setIsRequestingPermission(true);
    try {
      await forceReinitialize();
      const permission = await PushNotificationService.requestPermission();
      
      if (Capacitor.isNativePlatform()) {
        // For mobile, check the actual permission status after request
        await checkPermissionStatus();
      } else {
        setPermissionStatus(permission);
      }
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled! 🔔",
          description: "You'll now receive push notifications",
        });
      }
      
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      toast({
        title: "Permission Failed",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      console.log('🧪 Testing push notification...');
      console.log('Permission status:', permissionStatus);
      console.log('Is native platform:', Capacitor.isNativePlatform());
      
      if (permissionStatus !== 'granted') {
        toast({
          title: "Permission Required",
          description: "Please enable notifications first",
          variant: "destructive",
        });
        return;
      }

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to test notifications",
          variant: "destructive",
        });
        return;
      }

      if (Capacitor.isNativePlatform()) {
        // For mobile devices, send via the edge function directly with user ID
        console.log('📱 Sending test notification for mobile user:', user.id);
        
        const { data, error } = await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: user.id,
            title: "🧪 Test Notification",
            body: "Great! Push notifications are working correctly on your mobile device.",
            data: { 
              test: true, 
              timestamp: new Date().toISOString(),
              source: 'test_button'
            }
          }
        });

        if (error) {
          console.error('❌ Test notification failed:', error);
          toast({
            title: "Test Failed",
            description: `Failed to send test notification: ${error.message}`,
            variant: "destructive",
          });
        } else {
          console.log('✅ Test notification sent successfully:', data);
          toast({
            title: "Test Sent! 📤",
            description: "Check for the notification on your mobile device",
          });
        }
      } else {
        // For web browsers, use local notification
        console.log('🌐 Sending test notification for web browser');
        
        await sendNotification(
          "🧪 Test Notification",
          "Great! Push notifications are working correctly in your browser.",
          { test: true, timestamp: new Date().toISOString() }
        );
        
        toast({
          title: "Test Sent! 📤",
          description: "Check for the notification in your browser",
        });
      }
      
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      toast({
        title: "Test Failed",
        description: `Failed to send test notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getPermissionBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500"><Check className="w-3 h-3 mr-1" />Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="secondary">Not Requested</Badge>;
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getPermissionHelperText = () => {
    if (permissionStatus === 'denied') {
      if (Capacitor.isNativePlatform()) {
        return 'Notifications are disabled. Please enable them in your device\'s app settings: Settings > Apps > Hisaab Dost > Notifications.';
      } else {
        return 'Notifications are blocked. Please enable them in your browser settings.';
      }
    }
    return null;
  };

  return (
    <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm border border-border/50 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage your notification preferences and permissions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Permission Status</span>
            {getPermissionBadge()}
          </div>
          
          <div className="flex gap-2">
            {permissionStatus !== 'granted' && (
              <Button 
                onClick={handlePermissionRequest}
                disabled={isRequestingPermission}
                className="flex-1"
                size="sm"
              >
                <Bell className="w-4 h-4 mr-2" />
                {isRequestingPermission ? 'Requesting...' : 'Enable Notifications'}
              </Button>
            )}
            
            {permissionStatus === 'granted' && (
              <Button 
                onClick={handleTestNotification}
                disabled={isTesting}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {isTesting ? 'Testing...' : 'Test Notification'}
              </Button>
            )}
          </div>
          
          {getPermissionHelperText() && (
            <p className="text-xs text-muted-foreground">
              {getPermissionHelperText()}
            </p>
          )}
        </div>

        {/* Notification Categories */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Notification Types</h4>
          
          {[
            { key: 'budgetWarnings', label: 'Budget Warnings', desc: 'When approaching budget limits' },
            { key: 'overspendingAlerts', label: 'Overspending Alerts', desc: 'When exceeding budgets' },
            { key: 'monthlyReset', label: 'Monthly Reset', desc: 'Start of new month notifications' },
            { key: 'dailyReminders', label: 'Daily Reminders', desc: 'Daily expense tracking reminders' },
            { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Weekly spending summaries' },
            { key: 'categoryInsights', label: 'Category Insights', desc: 'Smart spending insights' },
            { key: 'savingsUpdates', label: 'Savings Updates', desc: 'Goal progress updates' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <Switch
                checked={settings[key as keyof typeof settings]}
                onCheckedChange={(checked) => handleSettingChange(key as keyof typeof settings, checked)}
                disabled={permissionStatus !== 'granted'}
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button onClick={onClose} variant="outline" size="sm" className="w-full">
            Close Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
