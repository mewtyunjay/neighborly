import mapboxgl from 'mapbox-gl';

interface UserLocationMarkerProps {
  position: [number, number];
  map: mapboxgl.Map;
}

export const createUserLocationMarker = ({ position, map }: UserLocationMarkerProps): mapboxgl.Marker => {
  const markerContainer = document.createElement("div");
  markerContainer.className = "relative";

  // Inner dot
  const innerDot = document.createElement("div");
  innerDot.className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-lg";

  // Outer glowing ring
  const outerRing = document.createElement("div");
  outerRing.className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]";

  // Middle ring for better visual effect
  const middleRing = document.createElement("div");
  middleRing.className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500/50 rounded-full";

  markerContainer.appendChild(outerRing);
  markerContainer.appendChild(middleRing);
  markerContainer.appendChild(innerDot);

  return new mapboxgl.Marker({
    element: markerContainer,
    offset: [0, 0]
  })
    .setLngLat(position)
    .addTo(map);
}; 