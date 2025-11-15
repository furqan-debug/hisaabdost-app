import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TestTube, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const SmartNotificationTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const { toast } = useToast();
  const { sendBroadcastNotification } = usePushNotifications();

  const handleManualTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      console.log('🧠 Triggering smart notifications manually...');
      
      const { data, error } = await supabase.functions.invoke('smart-push-notifications', {
        body: {
          manual_test: true,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        throw error;
      }

      console.log('Smart notifications result:', data);
      setTestResult(data);
      
      if (data.success) {
        toast({
          title: "Smart Notifications Triggered! 🧠",
          description: `Analyzed ${data.analyzed_users || 0} users and processed ${data.notifications_sent || 0} notifications`,
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
      
    } catch (error) {
      console.error('Failed to trigger smart notifications:', error);
      setTestResult({ success: false, error: error.message });
      toast({
        title: "Test Failed",
        description: "Smart notification test failed. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBroadcastTest = async () => {
    setIsBroadcasting(true);
    
    try {
      console.log('📢 Broadcasting notification to all users...');
      
      await sendBroadcastNotification(
        '💰 Smart Savings Tip!',
        'Track your expenses daily to save up to 30% more each month! Start building better financial habits today.',
        { type: 'engagement_test', timestamp: new Date().toISOString() }
      );
      
      toast({
        title: "Broadcast Sent! 📢",
        description: "Engaging notification sent to all users successfully",
      });
      
    } catch (error) {
      console.error('Failed to broadcast notification:', error);
      toast({
        title: "Broadcast Failed",
        description: "Failed to send broadcast notification. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Smart Notification Tester
          </CardTitle>
          <CardDescription>
            Test the smart notification system manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleManualTest}
            disabled={isLoading}
            className="w-full"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isLoading ? 'Testing...' : 'Run Smart Notifications Test'}
          </Button>
          
          <Button 
            onClick={handleBroadcastTest}
            disabled={isBroadcasting}
            variant="secondary"
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isBroadcasting ? 'Broadcasting...' : 'Send Test Notification to All Users'}
          </Button>
          
          {testResult && (
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {testResult.success ? 'Success!' : 'Failed'}
                </span>
              </div>
              
              {testResult.success && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Users analyzed: {testResult.analyzed_users || 0}</p>
                  <p>Notifications sent: {testResult.notifications_sent || 0}</p>
                  <p>Automated: {testResult.automated ? 'Yes' : 'No'}</p>
                </div>
              )}
              
              {!testResult.success && (
                <p className="text-sm text-red-600">
                  Error: {testResult.error}
                </p>
              )}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>✅ Cron job scheduled for daily 8 AM UTC</p>
            <p>🔄 Function updated to send actual notifications</p>
            <p>📱 Push notifications require device tokens</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};