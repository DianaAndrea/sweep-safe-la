
import React, { useState, useEffect } from 'react';
import Map from '@/components/Map';
import { ParkingStatus } from '@/components/ui-components/ParkingStatus';
import { ActionButton } from '@/components/ui-components/ActionButton';
import { NotificationCard } from '@/components/ui-components/NotificationCard';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const MainView = () => {
  const [isParked, setIsParked] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [location, setLocation] = useState<[number, number]>([-118.243683, 34.052235]);
  const [streetName, setStreetName] = useState('');
  const [nextSweeping, setNextSweeping] = useState<Date | undefined>(undefined);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Simulate getting street data when location changes
  useEffect(() => {
    if (isParked) {
      // This would come from a real API in production
      // Simulating data for demo purposes
      const mockStreets = [
        { name: '7th Street', restriction: 'No Parking: Wed 8am-10am' },
        { name: 'Wilshire Blvd', restriction: 'No Parking: Thu 10am-12pm' },
        { name: 'Figueroa St', restriction: 'No Parking: Tue 8am-11am' },
        { name: 'Olympic Blvd', restriction: 'No Parking: Fri 8am-10am' },
        { name: 'Grand Ave', restriction: 'No Parking: Mon 7am-9am' }
      ];
      
      // Randomly select a street
      const randomIndex = Math.floor(Math.random() * mockStreets.length);
      setStreetName(mockStreets[randomIndex].name);
      
      // Set next sweeping time
      const now = new Date();
      // Random hours in the future (between 1 and 12 hours)
      const hoursInFuture = Math.floor(Math.random() * 12) + 1;
      const sweepingTime = new Date(now.getTime() + hoursInFuture * 60 * 60 * 1000);
      setNextSweeping(sweepingTime);
      
      // Show toast notification
      toast({
        title: "Parking detected",
        description: `${mockStreets[randomIndex].restriction}`,
        duration: 5000,
      });
    } else {
      setStreetName('');
      setNextSweeping(undefined);
    }
  }, [isParked, location, toast]);

  const handleToggleParking = () => {
    if (isParked) {
      setIsParked(false);
      toast({
        title: "Parking cleared",
        description: "We've cleared your parking location",
      });
    } else {
      // In a real app, this would use the device's actual GPS
      // For demo purposes, we'll set a random location near the center
      const newLat = 34.052235 + (Math.random() * 0.01 - 0.005);
      const newLng = -118.243683 + (Math.random() * 0.01 - 0.005);
      setLocation([newLng, newLat]);
      setIsParked(true);
    }
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    toast({
      title: enabled ? "Notifications enabled" : "Notifications disabled",
      description: enabled 
        ? "You'll receive alerts before street cleaning" 
        : "You won't receive parking alerts",
    });
  };
  
  const getNextAlertTime = () => {
    if (!nextSweeping) return undefined;
    
    // In real app, this would be calculated based on user settings
    // For demo, show alert 1 hour before
    const alertTime = new Date(nextSweeping);
    alertTime.setHours(alertTime.getHours() - 1);
    
    return alertTime.toLocaleTimeString([], {
      hour: 'numeric', 
      minute: '2-digit'
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-sweepsafe-blue">SweepSafe</h1>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>
      
      <div className="flex-1 relative">
        <Map center={location} isParked={isParked} />
        
        <div className="absolute inset-x-0 bottom-24 px-4 z-10">
          <ParkingStatus 
            isParked={isParked} 
            streetName={streetName} 
            sweepingDate={nextSweeping}
            parkingRestriction={isParked ? "No Parking: Street Cleaning" : undefined}
          />
        </div>
        
        <div className="absolute inset-x-0 bottom-4 px-4 z-10 flex justify-center">
          <ActionButton 
            onClick={handleToggleParking} 
            isParked={isParked} 
          />
        </div>
      </div>
      
      <div className="p-4 bg-white shadow-inner">
        <NotificationCard 
          enabled={notificationsEnabled}
          onToggle={handleNotificationToggle}
          nextAlertTime={notificationsEnabled ? getNextAlertTime() : undefined}
        />
      </div>
    </div>
  );
};

export default MainView;
