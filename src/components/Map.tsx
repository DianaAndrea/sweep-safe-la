
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxTokenForm from './map/MapboxTokenForm';
import { setupMapMarkers, createParkingMarker } from './map/MapMarkers';
import { addStreetCleaningLayer, setupStreetCleaningInteractions } from './map/StreetCleaningLayer';

interface MapProps {
  center?: [number, number];
  isParked?: boolean;
}

const Map: React.FC<MapProps> = ({ center = [-118.243683, 34.052235], isParked = false }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const locationMarker = useRef<mapboxgl.Marker | null>(null);
  const parkingMarker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Initialize the map ONCE, after a token is provided. We deliberately keep
  // this effect out of the center/isParked update cycle so the map is never
  // torn down and rebuilt on every interaction (that was the source of the
  // flicker/jank).
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 15,
      pitch: 0,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    const markers = setupMapMarkers({ map: map.current, center, isParked });
    locationMarker.current = markers.locationMarker;
    parkingMarker.current = markers.parkingMarker;

    map.current.on('load', () => {
      if (!map.current) return;
      addStreetCleaningLayer(map.current, center);
      setupStreetCleaningInteractions(map.current);
    });

    // Keep the map canvas in sync whenever its container changes size, e.g.
    // when the user expands or collapses the map panel. Without this the
    // canvas keeps its old dimensions and the map renders incorrectly.
    const resizeObserver = new ResizeObserver(() => {
      map.current?.resize();
    });
    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
      map.current?.remove();
      map.current = null;
      locationMarker.current = null;
      parkingMarker.current = null;
    };
    // Only re-run when the token changes; center/isParked are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  // Recenter the map and move the "you are here" marker when the location changes.
  useEffect(() => {
    if (!map.current) return;
    map.current.flyTo({ center, essential: true });
    locationMarker.current?.setLngLat(center);
  }, [center]);

  // Show or hide the parking marker as the parked state changes.
  useEffect(() => {
    if (!map.current) return;

    if (isParked) {
      const parkedPosition: [number, number] = [center[0] + 0.0005, center[1] + 0.0002];
      if (parkingMarker.current) {
        parkingMarker.current.setLngLat(parkedPosition);
      } else {
        parkingMarker.current = createParkingMarker(map.current, center);
      }
    } else {
      parkingMarker.current?.remove();
      parkingMarker.current = null;
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
