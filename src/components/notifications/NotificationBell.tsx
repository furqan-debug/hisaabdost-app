import { Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationSettings } from './NotificationSettings';
import { useState, useEffect } from 'react';
import { PushNotificationService } from '@/services/pushNotificationService';
import { Capacitor } from '@capacitor/core';
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  useEffect(() => {
    checkPermission();

    // Check permission status every few seconds for mobile
    const interval = setInterval(checkPermission, 3000);
    return () => clearInterval(interval);
  }, []);
  const checkPermission = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const permissions = await PushNotificationService.checkPermissions();
        setHasPermission(permissions.receive === 'granted');
      } else {
        setHasPermission(PushNotificationService.isPermissionGranted());
      }
    } catch (error) {
      console.error('Failed to check permission:', error);
      setHasPermission(false);
    }
  };
  return <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          
          {!hasPermission}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 border-0 shadow-none bg-transparent" align="end" sideOffset={8}>
        <NotificationSettings onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>;
}