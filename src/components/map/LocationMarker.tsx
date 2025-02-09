import mapboxgl from 'mapbox-gl';
import { LocationData } from './types';

interface LocationMarkerProps {
  location: LocationData;
  map: mapboxgl.Map;
  handleMarkerClick: (id: string) => void;
}

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

export const createLocationMarker = ({ location, map, handleMarkerClick }: LocationMarkerProps): mapboxgl.Marker => {
  const el = document.createElement("div");
  el.className = `h-4 w-4 rounded-full shadow-xl transition-all duration-300 ${getMarkerColor(location.status)} ${location.isSelected ? 'scale-125 border-2 border-white' : ''}`;

  const popup = new mapboxgl.Popup({ 
    offset: 25,
    className: 'rounded-xl overflow-hidden'
  })
    .setHTML(`
      <div class="p-3 bg-[#111111] text-white">
        <h3 class="font-medium text-sm">${location.name}</h3>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs capitalize text-gray-400">${location.status}</span>
          ${location.percentageFull !== undefined ? 
            `<span class="text-xs text-gray-400">${location.percentageFull}% full</span>` 
            : ''}
        </div>
      </div>
    `);

  const marker = new mapboxgl.Marker({
    element: el,
    offset: [0, -15]
  })
    .setLngLat(location.coordinates)
    .setPopup(popup)
    .addTo(map);

  el.addEventListener("click", () => handleMarkerClick(location.id));

  return marker;
}; 