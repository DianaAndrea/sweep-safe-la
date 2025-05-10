
import mapboxgl from 'mapbox-gl';
import { getStreetCleaningGeoJSON } from '@/lib/streetCleaningData';

export const addStreetCleaningLayer = (map: mapboxgl.Map, center: [number, number]) => {
  // Get GeoJSON from our utility function
  const streetCleaningData = getStreetCleaningGeoJSON(center);
  
  map.addSource('street-cleaning', {
    type: 'geojson',
    data: streetCleaningData
  });

  map.addLayer({
    id: 'street-cleaning-layer',
    type: 'line',
    source: 'street-cleaning',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#F59E0B',
      'line-width': 6,
      'line-opacity': 0.8,
      'line-dasharray': [1, 1]
    }
  });
};

export const setupStreetCleaningInteractions = (map: mapboxgl.Map) => {
  // Pop-up for street cleaning info
  map.on('click', 'street-cleaning-layer', (e) => {
    if (!e.features) return;
    
    const coordinates = e.lngLat;
    const properties = e.features[0].properties;
    
    if (!properties) return;
    
    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(`
        <div class="p-2">
          <h3 class="font-medium">${properties.name}</h3>
          <p class="text-sm">Street Cleaning: ${properties.day}, ${properties.time}</p>
          <p class="text-xs text-sweepsafe-gray">Side: ${properties.side}</p>
          <p class="text-xs text-sweepsafe-gray">Between ${properties.from_street} and ${properties.to_street}</p>
        </div>
      `)
      .addTo(map);
  });
  
  map.on('mouseenter', 'street-cleaning-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  
  map.on('mouseleave', 'street-cleaning-layer', () => {
    map.getCanvas().style.cursor = '';
  });
};
