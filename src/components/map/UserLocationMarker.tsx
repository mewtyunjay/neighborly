import mapboxgl from 'mapbox-gl';

interface UserLocationMarkerProps {
  position: [number, number];
  map: mapboxgl.Map;
}

export const createUserLocationMarker = ({ position, map }: UserLocationMarkerProps): mapboxgl.Marker => {
  const markerContainer = document.createElement("div");
  markerContainer.className = "relative flex items-center justify-center w-8 h-8";

  // Inner dot with pulsing effect
  const innerDot = document.createElement("div");
  innerDot.className = "w-4 h-4 bg-blue-500 rounded-full shadow-md animate-pulse";

  // Outer pulsing ring
  const outerRing = document.createElement("div");
  outerRing.className = "absolute w-10 h-10 border-2 border-blue-500 rounded-full opacity-50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]";

  markerContainer.appendChild(outerRing);
  markerContainer.appendChild(innerDot);

  return new mapboxgl.Marker({
    element: markerContainer,
    offset: [0, 0]
  })
    .setLngLat(position)
    .addTo(map);
};