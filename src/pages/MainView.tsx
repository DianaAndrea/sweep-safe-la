import React, { useState, useEffect } from 'react';
import Map from '@/components/Map';
import { ParkingStatus } from '@/components/ui-components/ParkingStatus';
import { ActionButton } from '@/components/ui-components/ActionButton';
import { NotificationCard } from '@/components/ui-components/NotificationCard';
import { Button } from '@/components/ui/button';
import { Settings, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
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
  // Controls how much of the screen the map takes. Collapsed by default so the
  // status cards below are visible right away; tap to expand the map full-height.
  const [mapExpanded, setMapExpanded] = useState(false);
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

      // Bring the cards into view so the driver immediately sees the rules.
      setMapExpanded(false);

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
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0 z-20">
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

      {/* Map panel — height animates between a compact and an expanded state */}
      <div
        className="relative w-full flex-shrink-0 transition-[height] duration-300 ease-in-out"
        style={{ height: mapExpanded ? 'calc(100vh - 8rem)' : '42vh' }}
      >
        <Map center={location} isParked={isParked} />

        {/* Expand / collapse toggle */}
        <button
          type="button"
          onClick={() => setMapExpanded((v) => !v)}
          aria-label={mapExpanded ? 'Shrink map to show details' : 'Expand map'}
          aria-expanded={mapExpanded}
          className="absolute left-1/2 -translate-x-1/2 bottom-3 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-sweepsafe-blue shadow-lg backdrop-blur transition active:scale-95"
        >
          {mapExpanded ? (
            <>
              <ChevronDown className="h-4 w-4" />
              Show details
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4" />
              Expand map
            </>
          )}
        </button>
      </div>

      {/* Scrollable card area below the map */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4">
        <ParkingStatus
          isParked={isParked}
          streetName={streetName}
          sweepingDate={nextSweeping}
          parkingRestriction={parkingRestriction}
        />

        <div className="flex justify-center">
          <ActionButton
            onClick={handleToggleParking}
            isParked={isParked}
          />
        </div>

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
