
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  className
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
  }>({ hours: 0, minutes: 0 });
  
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0 });
        return;
      }
      
      // Convert to hours and minutes
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft({ hours, minutes });
      setIsUrgent(hours < 2);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    
    return () => clearInterval(timer);
  }, [targetDate]);

  const getColor = () => {
    if (timeLeft.hours === 0) return 'text-sweepsafe-red';
    if (timeLeft.hours < 2) return 'text-sweepsafe-amber';
    return 'text-sweepsafe-green';
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("text-4xl font-bold", getColor(), { "animate-pulse-slow": isUrgent })}>
        {timeLeft.hours}h {timeLeft.minutes}m
      </div>
      <div className="text-sm text-sweepsafe-gray font-medium mt-1">
        until street cleaning
      </div>
    </div>
  );
};
