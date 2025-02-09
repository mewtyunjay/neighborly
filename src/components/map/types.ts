export interface LocationData {
  id: string;
  name: string;
  coordinates: [number, number];
  status: 'available' | 'unavailable' | 'upcoming';
  percentageFull?: number;
  isSelected: boolean;
}

export interface MapProps {
  userPos?: [number, number];
  locations: LocationData[];
  handleMarkerClick: (id: string) => void;
} 