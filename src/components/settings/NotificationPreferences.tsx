import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Bell, BellOff, Save } from 'lucide-react';

export function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    loanReminders: true,
    budgetAlerts: true,
    goalReminders: true,
    dailySummary: true,
    weeklySummary: true,
    overspendingAlerts: true,
    savingsOpportunities: true,
  });

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        const prefs = data.notification_preferences as any;
        setPreferences(prev => ({ ...prev, ...prefs }));
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: preferences })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Preferences Saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="loan-reminders">Loan Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified before loan due dates (7, 3, 1 days)
              </p>
            </div>
            <Switch
              id="loan-reminders"
              checked={preferences.loanReminders}
              onCheckedChange={() => togglePreference('loanReminders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="budget-alerts">Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified at 50%, 70%, 90% and 100% of budget
              </p>
            </div>
            <Switch
              id="budget-alerts"
              checked={preferences.budgetAlerts}
              onCheckedChange={() => togglePreference('budgetAlerts')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="goal-reminders">Goal Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about savings goal deadlines
              </p>
            </div>
            <Switch
              id="goal-reminders"
              checked={preferences.goalReminders}
              onCheckedChange={() => togglePreference('goalReminders')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="overspending-alerts">Overspending Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get alerted when spending is unusually high
              </p>
            </div>
            <Switch
              id="overspending-alerts"
              checked={preferences.overspendingAlerts}
              onCheckedChange={() => togglePreference('overspendingAlerts')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="daily-summary">Daily Summary</Label>
              <p className="text-sm text-muted-foreground">
                Get a daily spending summary at 8 PM
              </p>
            </div>
            <Switch
              id="daily-summary"
              checked={preferences.dailySummary}
              onCheckedChange={() => togglePreference('dailySummary')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-summary">Weekly Report</Label>
              <p className="text-sm text-muted-foreground">
                Get a weekly financial report every Sunday
              </p>
            </div>
            <Switch
              id="weekly-summary"
              checked={preferences.weeklySummary}
              onCheckedChange={() => togglePreference('weeklySummary')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="savings-opportunities">Savings Tips</Label>
              <p className="text-sm text-muted-foreground">
                Get tips on saving money and managing budgets
              </p>
            </div>
            <Switch
              id="savings-opportunities"
              checked={preferences.savingsOpportunities}
              onCheckedChange={() => togglePreference('savingsOpportunities')}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
}
