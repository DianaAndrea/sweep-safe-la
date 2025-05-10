
import React from 'react';
import mapboxgl from 'mapbox-gl';

interface MarkerCreatorProps {
  map: mapboxgl.Map;
  center: [number, number];
  isParked: boolean;
}

const createLocationMarker = (map: mapboxgl.Map, center: [number, number]) => {
  const el = document.createElement('div');
  el.className = 'h-4 w-4 rounded-full bg-blue-500 shadow-lg relative';
  el.innerHTML = '<div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>';
  
  return new mapboxgl.Marker(el)
    .setLngLat(center)
    .addTo(map);
};

const createParkingMarker = (map: mapboxgl.Map, center: [number, number]) => {
  const parkingEl = document.createElement('div');
  parkingEl.className = 'h-8 w-8 flex items-center justify-center';
  parkingEl.innerHTML = `
    <div class="h-6 w-6 bg-sweepsafe-blue rounded-full flex items-center justify-center shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.5-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
        <circle cx="7" cy="17" r="2"></circle>
        <path d="M9 17h6"></path>
        <circle cx="17" cy="17" r="2"></circle>
      </svg>
    </div>
  `;
  
  return new mapboxgl.Marker(parkingEl)
    .setLngLat([center[0] + 0.0005, center[1] + 0.0002])
    .addTo(map);
};

export const setupMapMarkers = ({ map, center, isParked }: MarkerCreatorProps) => {
  // Add location marker
  createLocationMarker(map, center);
  
  // Add parking marker if needed
  if (isParked) {
    return createParkingMarker(map, center);
  }
  
  return null;
};
