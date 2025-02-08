'use client';

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface LocationData {
  id: string;
  name: string;
  coordinates: [number, number];
  status: 'available' | 'unavailable' | 'upcoming';
  percentageFull?: number;
  isSelected: boolean;
}

interface MapProps {
  userPos?: [number, number];
  locations: LocationData[];
  handleMarkerClick: (id: string) => void;
}

export default function Map({ userPos, locations, handleMarkerClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  const [center, setCenter] = useState<[number, number]>([-73.9971, 40.7308]); // Default to NYU coordinates
  const [zoom, setZoom] = useState(14);
  const [pitch, setPitch] = useState(45);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Update center when user position is available
  useEffect(() => {
    if (userPos) {
      setCenter(userPos);
    }
  }, [userPos]);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-400 shadow-emerald-500/50';
      case 'upcoming':
        return 'bg-yellow-400 shadow-yellow-500/50';
      case 'unavailable':
        return 'bg-red-400 shadow-red-500/50';
      default:
        return 'bg-gray-400 shadow-gray-500/50';
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          
          if (map.current) {
            map.current.flyTo({
              center: newPos,
              zoom: 15,
              duration: 2000
            });

            if (userPos) {
              const userMarker = document.createElement("div");
              userMarker.className = "h-3 w-3 border-2 border-white rounded-full bg-blue-400 shadow-xl shadow-blue-500/50 animate-pulse";

              new mapboxgl.Marker(userMarker)
                .setLngLat(newPos)
                .addTo(map.current);
            }
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please make sure location services are enabled.");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  useEffect(() => {
    if (!mapboxToken) {
      console.error("Mapbox token is not defined");
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current as HTMLElement,
        style: "mapbox://styles/mapbox/dark-v11",
        center: center,
        zoom: zoom,
        pitch: pitch,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    } else {
      // Update center if map exists
      map.current.setCenter(center);
    }

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add location markers
    locations.forEach((location) => {
      const el = document.createElement("div");
      el.className = `h-4 w-4 rounded-full shadow-xl transition-all duration-300 ${getMarkerColor(location.status)} ${location.isSelected ? 'scale-125 border-emerald-400' : ''}`;

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-medium">${location.name}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-sm capitalize">${location.status}</span>
              ${location.percentageFull !== undefined ? 
                `<span class="text-sm">${location.percentageFull}% full</span>` 
                : ''}
            </div>
          </div>
        `);

      if (map.current && location.coordinates) {
        const marker = new mapboxgl.Marker(el)
          .setLngLat(location.coordinates)
          .setPopup(popup)
          .addTo(map.current);

        markers.current[location.id] = marker;

        if (handleMarkerClick) {
          el.addEventListener("click", () => handleMarkerClick(location.id));
        }
      }
    });

    // Add user marker if available
    if (userPos) {
      const userMarker = document.createElement("div");
      userMarker.className = "h-3 w-3 border-2 border-white rounded-full bg-blue-400 shadow-xl shadow-blue-500/50 animate-pulse";

      new mapboxgl.Marker(userMarker)
        .setLngLat(userPos)
        .addTo(map.current);
    }

    return () => {
      Object.values(markers.current).forEach(marker => marker.remove());
    };
  }, [locations, userPos, mapboxToken, center]);

  return (
    <div className="h-screen w-full relative">
      <div
        id="map-container"
        ref={mapContainer}
        className="h-full w-full rounded-lg"
      />
      <button
        onClick={handleCurrentLocation}
        className="absolute bottom-20 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        aria-label="Go to current location"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5} 
          stroke="currentColor" 
          className="w-6 h-6"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" 
          />
        </svg>
      </button>
    </div>
  );
} 