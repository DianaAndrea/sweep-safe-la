import React, { useState, useEffect } from 'react';
import Map from '@/components/Map';
import { ParkingStatus } from '@/components/ui-components/ParkingStatus';
import { ActionButton } from '@/components/ui-components/ActionButton';
import { NotificationCard } from '@/components/ui-components/NotificationCard';
import { Button } from '@/components/ui/button';
import { Settings, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { 
  getRandomStreetSchedule,
  getNextStreetCleaningDateTime,
  getParkingRestrictionText,
  StreetCleaningSchedule
} from '@/lib/streetCleaningData';

const MainView = () => {
  const [isParked, setIsParked] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [location, setLocation] = useState<[number, number]>([-118.243683, 34.052235]);
  const [streetName, setStreetName] = useState('');
  const [nextSweeping, setNextSweeping] = useState<Date | undefined>(undefined);
  const [parkingRestriction, setParkingRestriction] = useState<string | undefined>(undefined);
  const [currentSchedule, setCurrentSchedule] = useState<StreetCleaningSchedule | undefined>(undefined);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get street data when location changes and parking is active
  useEffect(() => {
    if (isParked) {
      // In a real app, we would find the nearest street based on coordinates
      // For prototype, we'll use a random street from our data
      const schedule = getRandomStreetSchedule();
      setCurrentSchedule(schedule);
      setStreetName(schedule.street_name);

      // Calculate next cleaning time based on the schedule
      const sweepingTime = getNextStreetCleaningDateTime(schedule);
      setNextSweeping(sweepingTime);
      
      // Set parking restriction text
      const restriction = getParkingRestrictionText(schedule);
      setParkingRestriction(restriction);

      // Show toast notification
      toast({
        title: "Parking detected",
        description: restriction,
        duration: 5000,
      });
    } else {
      setStreetName('');
      setNextSweeping(undefined);
      setParkingRestriction(undefined);
      setCurrentSchedule(undefined);
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
      // For prototype, we'll set a random location near the center
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
    // For prototype, show alert 1 hour before
    const alertTime = new Date(nextSweeping);
    alertTime.setHours(alertTime.getHours() - 1);
    
    return alertTime.toLocaleTimeString([], {
      hour: 'numeric', 
      minute: '2-digit'
    });
  };

  const handleViewSchedule = () => {
    navigate('/schedule');
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-sweepsafe-blue">SweepSafe</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleViewSchedule}
            title="View Schedule"
          >
            <Calendar className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <div className="flex-1 relative">
        <Map center={location} isParked={isParked} />
        
        <div className="absolute inset-x-0 bottom-24 px-4 z-10">
          <ParkingStatus 
            isParked={isParked} 
            streetName={streetName} 
            sweepingDate={nextSweeping}
            parkingRestriction={parkingRestriction}
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
