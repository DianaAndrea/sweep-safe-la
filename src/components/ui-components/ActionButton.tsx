
import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
  className?: string;
  onClick: () => void;
  isParked: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ className, onClick, isParked }) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "rounded-full shadow-lg px-6 py-6 h-auto font-medium text-white", 
        isParked 
          ? "bg-sweepsafe-red hover:bg-sweepsafe-red/90" 
          : "bg-sweepsafe-blue hover:bg-sweepsafe-blue/90",
        className
      )}
    >
      <MapPin className="mr-2 h-5 w-5" />
      {isParked ? "I've Moved My Car" : "Mark My Parking Spot"}
    </Button>
  );
};
