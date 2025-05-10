
import React from 'react';
import { Clock } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import { Badge } from '@/components/ui/badge';

interface ParkingStatusProps {
  isParked: boolean;
  streetName: string;
  sweepingDate?: Date;
  parkingRestriction?: string;
}

export const ParkingStatus: React.FC<ParkingStatusProps> = ({ 
  isParked, 
  streetName, 
  sweepingDate,
  parkingRestriction
}) => {
  if (!isParked) {
    return (
      <div className="bg-white/95 p-5 rounded-2xl shadow-lg w-full max-w-md mx-auto">
        <div className="flex items-center justify-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-sweepsafe-gray animate-pulse"></div>
          <h2 className="text-lg font-medium">No Parking Location</h2>
        </div>
        <p className="text-center text-sm text-sweepsafe-gray mt-1">
          SweepSafe will detect when you park and check for street cleaning times.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/95 p-5 rounded-2xl shadow-lg w-full max-w-md mx-auto">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-sweepsafe-blue/10 text-sweepsafe-blue">
            Currently Parked
          </Badge>
          {parkingRestriction && (
            <Badge variant="outline" className="bg-sweepsafe-amber/10 text-sweepsafe-amber">
              {parkingRestriction}
            </Badge>
          )}
        </div>
        
        <h2 className="text-lg font-semibold truncate">{streetName}</h2>
        
        {sweepingDate ? (
          <div className="border-t pt-3">
            <CountdownTimer targetDate={sweepingDate} />
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2 border-t pt-3 text-sweepsafe-green">
            <Clock size={18} />
            <p className="font-medium">No scheduled cleaning</p>
          </div>
        )}
      </div>
    </div>
  );
};
