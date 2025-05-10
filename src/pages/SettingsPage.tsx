
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft,
  Bell,
  Clock, 
  MapPin
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

const SettingsPage = () => {
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState([60]); // minutes before
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
    
    navigate(-1);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-sm p-4 flex items-center">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Settings</h1>
      </header>
      
      <div className="container max-w-md mx-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 text-sweepsafe-blue mr-2" />
              Parking Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-detect parking</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically save your location when you park
                </p>
              </div>
              <Switch 
                checked={autoDetectEnabled}
                onCheckedChange={setAutoDetectEnabled}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 text-sweepsafe-blue mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>
              Customize how and when you receive alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Enable notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive alerts about street cleaning
                </p>
              </div>
              <Switch 
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
            
            {notificationsEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-sweepsafe-blue mr-2" />
                    <h3 className="font-medium">Alert timing</h3>
                  </div>
                  <span className="text-sm font-medium">
                    {notificationTime[0]} minutes before
                  </span>
                </div>
                
                <Slider
                  defaultValue={notificationTime}
                  max={120}
                  min={15}
                  step={15}
                  onValueChange={setNotificationTime}
                  className="py-4"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15m</span>
                  <span>1h</span>
                  <span>2h</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About SweepSafe</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              SweepSafe helps LA drivers avoid street cleaning tickets by providing timely alerts.
            </p>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6">
          <Button 
            onClick={handleSave}
            className="w-full bg-sweepsafe-blue hover:bg-sweepsafe-blue/90"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
