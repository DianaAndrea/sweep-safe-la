
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getAllStreetCleaningSchedules, formatScheduleTime, StreetCleaningSchedule } from '@/lib/streetCleaningData';
import { Input } from '@/components/ui/input';

const SchedulePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const allSchedules = getAllStreetCleaningSchedules();
  
  // Filter schedules based on search query
  const filteredSchedules = searchQuery.trim() === '' 
    ? allSchedules 
    : allSchedules.filter(schedule => 
        schedule.street_name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Group schedules by day for better organization
  const schedulesByDay = filteredSchedules.reduce<Record<string, StreetCleaningSchedule[]>>((groups, schedule) => {
    if (!groups[schedule.day]) {
      groups[schedule.day] = [];
    }
    groups[schedule.day].push(schedule);
    return groups;
  }, {});
  
  // Order days of the week properly
  const orderedDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/main')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-sweepsafe-blue">Street Cleaning Schedule</h1>
        </div>
      </header>
      
      <div className="flex-1 p-4">
        <div className="mb-4">
          <Input 
            placeholder="Search by street name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-10 w-10 text-sweepsafe-gray mx-auto mb-2" />
            <p className="text-sweepsafe-gray">No schedules found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orderedDays.map(day => {
              if (!schedulesByDay[day] || schedulesByDay[day].length === 0) return null;
              
              return (
                <div key={day} className="space-y-2">
                  <h2 className="text-lg font-semibold text-sweepsafe-blue">
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </h2>
                  <div className="grid grid-cols-1 gap-2">
                    {schedulesByDay[day].map((schedule, index) => (
                      <Card key={`${day}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <CardContent className="p-3">
                          <h3 className="font-medium">{schedule.street_name}</h3>
                          <p className="text-sm text-sweepsafe-gray">
                            {schedule.from_hour} - {schedule.to_hour}, {schedule.sweep_side} side
                          </p>
                          <p className="text-xs text-sweepsafe-gray">
                            Between {schedule.from_street} and {schedule.to_street}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
