import streetCleaningData from '@/Resources/Assets/simplified_street_cleaning.json';


// Types for street cleaning data
export interface StreetCleaningSchedule {
  street_name: string;
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  from_hour: string;
  to_hour: string;
  sweep_side: string;
  from_street: string;
  to_street: string;
}

// Convert day string to JS Date day number (0 = Sunday, 1 = Monday, etc.)
export const dayToNumber = (day: string): number => {
  const days: Record<string, number> = {
    'SUNDAY': 0,
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4,
    'FRIDAY': 5,
    'SATURDAY': 6
  };
  return days[day] || 0;
};

// Get all street cleaning schedules
export const getAllStreetCleaningSchedules = (): StreetCleaningSchedule[] => {
  return streetCleaningData as StreetCleaningSchedule[];
};

// Get street cleaning schedule for a specific street
export const getStreetCleaningScheduleForStreet = (streetName: string): StreetCleaningSchedule | undefined => {
  const schedules = getAllStreetCleaningSchedules();
  return schedules.find(schedule => 
    schedule.street_name.toLowerCase() === streetName.toLowerCase()
  );
};

// Get next street cleaning date and time for a given schedule
export const getNextStreetCleaningDateTime = (schedule: StreetCleaningSchedule): Date => {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const scheduleDayOfWeek = dayToNumber(schedule.day);
  
  // Calculate days until next scheduled cleaning
  let daysUntilCleaning = scheduleDayOfWeek - currentDayOfWeek;
  if (daysUntilCleaning <= 0) {
    daysUntilCleaning += 7; // Move to next week if day has passed
  }

  // Create the next cleaning date
  const nextCleaningDate = new Date(today);
  nextCleaningDate.setDate(today.getDate() + daysUntilCleaning);
  
  // Set the time from the schedule (e.g., "10:00AM")
  const timeMatch = schedule.from_hour.match(/(\d+):(\d+)(\w+)/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const ampm = timeMatch[3].toUpperCase();
    
    if (ampm === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    
    nextCleaningDate.setHours(hours, minutes, 0, 0);
  }
  
  return nextCleaningDate;
};

// Get a random street from our data (for demo/prototype)
export const getRandomStreetSchedule = (): StreetCleaningSchedule => {
  const schedules = getAllStreetCleaningSchedules();
  const randomIndex = Math.floor(Math.random() * schedules.length);
  return schedules[randomIndex];
};

// Convert street cleaning schedules to GeoJSON features for the map
export const getStreetCleaningGeoJSON = (center: [number, number]): GeoJSON.FeatureCollection => {
  const schedules = getAllStreetCleaningSchedules();
  
  // For prototype, we'll position the streets relative to the center point
  const features = schedules.map((schedule, index) => {
    // Create a simple line for each street, positioned around the center
    // In a real app, this would use actual geographic coordinates
    const offset = 0.003 * (index - schedules.length / 2);
    
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [center[0] - 0.004, center[1] + offset],
          [center[0] + 0.004, center[1] + offset],
        ]
      },
      properties: {
        name: schedule.street_name,
        day: schedule.day,
        time: `${schedule.from_hour} - ${schedule.to_hour}`,
        side: schedule.sweep_side,
        from_street: schedule.from_street,
        to_street: schedule.to_street
      }
    } as GeoJSON.Feature;
  });
  
  return {
    type: 'FeatureCollection',
    features
  };
};

// Format the day and time for display
export const formatScheduleTime = (schedule: StreetCleaningSchedule): string => {
  return `${schedule.day.charAt(0) + schedule.day.slice(1).toLowerCase()}, ${schedule.from_hour} - ${schedule.to_hour}`;
};

export const getParkingRestrictionText = (schedule: StreetCleaningSchedule): string => {
  return `No Parking: ${schedule.sweep_side} side, ${formatScheduleTime(schedule)}`;
};
