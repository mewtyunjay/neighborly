'use client';

import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapProps } from "./map/types";
import { createLocationMarker } from "./map/LocationMarker";
import { createUserLocationMarker } from "./map/UserLocationMarker";
import { MapControls } from "./map/MapControls";

export default function Map({ userPos, locations, handleMarkerClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  const [center, setCenter] = useState<[number, number]>([-73.9971, 40.7308]); // Default to NYU coordinates
  const [zoom] = useState(12);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  useEffect(() => {
    if (userPos) {
      setCenter(userPos);
    }
  }, [userPos]);

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
              duration: 2000,
              offset: [0, -150]
            });

            if (userPos) {
              createUserLocationMarker({
                position: newPos,
                map: map.current
              });
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
        pitch: 60,
        bearing: 25,
        antialias: true
      });

      map.current.on('load', () => {
        if (!map.current) return;

        // Add the DEM source first
        map.current.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });

        // Then set the terrain using the source
        map.current.setTerrain({
          source: 'mapbox-dem',
          exaggeration: 1.5
        });

        map.current.addLayer({
          'id': 'sky',
          'type': 'sky',
          'paint': {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });

        map.current.addLayer({
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 14,
          'paint': {
            'fill-extrusion-color': '#111111',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.7,
            'fill-extrusion-ambient-occlusion-intensity': 0.5
          }
        });
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    } else {
      map.current.setCenter(center);
    }

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add location markers
    if (map.current) {
      locations.forEach((location) => {
        markers.current[location.id] = createLocationMarker({
          location,
          map: map.current!,
          handleMarkerClick
        });
      });

      // Add user marker if available
      if (userPos) {
        createUserLocationMarker({
          position: userPos,
          map: map.current
        });
      }
    }

    return () => {
      Object.values(markers.current).forEach(marker => marker.remove());
    };
  }, [locations, userPos, mapboxToken, center, zoom]);

  useEffect(() => {
    if (locations.find(loc => loc.isSelected)) {
      const selected = locations.find(loc => loc.isSelected);
      if (selected) {
        handleMarkerClick(selected.id);
      }
    }
  }, [locations, handleMarkerClick]);

  return (
    <div className="h-screen w-full relative">
      <style jsx global>{`
        @media (max-width: 768px) {
          .mapboxgl-ctrl-bottom-right {
            bottom: 190px !important;
          }
        }
      `}</style>
      <div
        id="map-container"
        ref={mapContainer}
        className="h-full w-full rounded-lg"
      />

      {/* On mobile, lift the controls above the map */}
      <div>
        <MapControls
          map={map.current}
          onLocationButtonClick={handleCurrentLocation}
        />
      </div>
    </div>
  );
} 