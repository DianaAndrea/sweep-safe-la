
import React from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface NotificationCardProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  nextAlertTime?: string;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ 
  enabled, 
  onToggle,
  nextAlertTime
}) => {
  return (
    <Card className="shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell size={20} className="text-sweepsafe-blue mr-2" />
            <div>
              <h3 className="font-medium">Sweep Alerts</h3>
              {nextAlertTime && enabled && (
                <p className="text-xs text-sweepsafe-gray">Next alert: {nextAlertTime}</p>
              )}
            </div>
          </div>
          <Switch 
            checked={enabled}
            onCheckedChange={onToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};
