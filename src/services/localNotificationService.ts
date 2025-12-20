import { LocalNotifications, PermissionStatus, ScheduleOptions } from '@capacitor/local-notifications';

export class LocalNotificationService {
  static async requestLocalPermission(): Promise<PermissionStatus> {
    return await LocalNotifications.requestPermissions();
  }

  static async scheduleLocalNotification(id: number, title: string, body: string, triggerDate: Date) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: { at: triggerDate },
          sound: undefined,
          smallIcon: 'ic_stat_icon',
          actionTypeId: '',
          extra: null,
        },
      ],
    });
  }

  static async scheduleDailyReminder(id: number, title: string, body: string, hour: number, minute: number) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title,
          body,
          schedule: {
            repeats: true,
            on: { hour, minute },
          },
          sound: undefined,
          smallIcon: 'ic_stat_icon',
          actionTypeId: '',
          extra: null,
        },
      ],
    });
  }

  static async getAllScheduled() {
    return await LocalNotifications.getPending();
  }
}
