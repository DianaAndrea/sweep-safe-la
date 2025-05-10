
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  center?: [number, number];
  isParked?: boolean;
}

const Map: React.FC<MapProps> = ({ center = [-118.243683, 34.052235], isParked = false }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    // In a real app, this would come from environment variables or a secure backend
    // For demo purposes, we'll use a placeholder and ask users to input their token
    if (mapboxToken && mapContainer.current && !map.current) {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom: 15,
        pitch: 0,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
      
      // Add a pulsing dot for "my location"
      const el = document.createElement('div');
      el.className = 'h-4 w-4 rounded-full bg-blue-500 shadow-lg relative';
      el.innerHTML = '<div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>';
      
      new mapboxgl.Marker(el)
        .setLngLat(center)
        .addTo(map.current);
      
      if (isParked) {
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
        
        marker.current = new mapboxgl.Marker(parkingEl)
          .setLngLat([center[0] + 0.0005, center[1] + 0.0002])
          .addTo(map.current);
      }

      // Add street cleaning overlay (simulated for demo)
      map.current.on('load', () => {
        if (!map.current) return;
        
        // This would be real data from LA city API in production
        map.current.addSource('street-cleaning', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [center[0] - 0.004, center[1] - 0.002],
                    [center[0] + 0.004, center[1] - 0.002],
                  ]
                },
                properties: {
                  name: 'Wilshire Blvd',
                  day: 'Tuesday',
                  time: '8:00 AM - 11:00 AM'
                }
              },
              {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [center[0] + 0.002, center[1] - 0.005],
                    [center[0] + 0.002, center[1] + 0.005],
                  ]
                },
                properties: {
                  name: 'Figueroa St',
                  day: 'Wednesday',
                  time: '10:00 AM - 12:00 PM'
                }
              }
            ]
          }
        });

        map.current.addLayer({
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

        // Pop-up for street cleaning info
        map.current.on('click', 'street-cleaning-layer', (e) => {
          if (!e.features || !map.current) return;
          
          const coordinates = e.lngLat;
          const properties = e.features[0].properties;
          
          if (!properties) return;
          
          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
              <div class="p-2">
                <h3 class="font-medium">${properties.name}</h3>
                <p class="text-sm">Street Cleaning: ${properties.day}, ${properties.time}</p>
              </div>
            `)
            .addTo(map.current);
        });
        
        map.current.on('mouseenter', 'street-cleaning-layer', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        
        map.current.on('mouseleave', 'street-cleaning-layer', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, mapboxToken, isParked]);

  // Update marker position when the parked status changes
  useEffect(() => {
    if (map.current && marker.current) {
      if (isParked) {
        marker.current.setLngLat([center[0] + 0.0005, center[1] + 0.0002]);
      } else {
        marker.current.remove();
        marker.current = null;
      }
    }
  }, [isParked, center]);

  const handleTokenSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = formData.get('mapboxToken') as string;
    if (token) {
      setMapboxToken(token);
    }
  };

  return (
    <div className="relative w-full h-full">
      {!mapboxToken ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="bg-white p-5 rounded-lg shadow-md max-w-md w-full">
            <h3 className="text-lg font-medium mb-3">Enter Mapbox Token</h3>
            <p className="text-sm text-gray-600 mb-4">
              For this demo, please enter your Mapbox public token. 
              <a 
                href="https://account.mapbox.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sweepsafe-blue hover:underline ml-1"
              >
                Get one here
              </a>
            </p>
            <form onSubmit={handleTokenSubmit}>
              <input 
                type="text"
                name="mapboxToken"
                placeholder="pk.eyJ1IjoieW91ci11c2VyIiwiYSI..."
                className="w-full p-2 border rounded mb-3"
              />
              <button 
                type="submit"
                className="w-full bg-sweepsafe-blue text-white py-2 rounded hover:bg-sweepsafe-blue/90"
              >
                Load Map
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default Map;
