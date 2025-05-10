
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxTokenForm from './map/MapboxTokenForm';
import { setupMapMarkers } from './map/MapMarkers';
import { addStreetCleaningLayer, setupStreetCleaningInteractions } from './map/StreetCleaningLayer';

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
    // Only initialize the map if we have a token and the container is available
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
      
      // Create map markers
      marker.current = setupMapMarkers({
        map: map.current,
        center,
        isParked
      });

      // Add street cleaning overlay using our real data
      map.current.on('load', () => {
        if (!map.current) return;
        
        addStreetCleaningLayer(map.current, center);
        setupStreetCleaningInteractions(map.current);
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

  const handleTokenSubmit = (token: string) => {
    if (token) {
      setMapboxToken(token);
    }
  };

  return (
    <div className="relative w-full h-full">
      {!mapboxToken ? (
        <MapboxTokenForm onSubmit={handleTokenSubmit} />
      ) : null}
      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default Map;
