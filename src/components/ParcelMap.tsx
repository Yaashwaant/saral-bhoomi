
import React from 'react';
import { MapPin } from 'lucide-react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface ParcelMapProps {
  coordinates: Coordinates;
  parcelName: string;
  isEditing: boolean;
  onCoordinatesChange?: (coordinates: Coordinates) => void;
}

const ParcelMap = ({ coordinates, parcelName, isEditing, onCoordinatesChange }: ParcelMapProps) => {
  // In a real implementation, this would use a mapping library like Leaflet or Google Maps
  // For now, we'll create a placeholder that simulates a map
  
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing || !onCoordinatesChange) return;
    
    // Calculate relative position based on the click within the map element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to a simulated lat/lng (just for UI purposes)
    // In a real map implementation, you would get actual coordinates
    const newLat = 45.4 + (y / rect.height) * 0.1;
    const newLng = 4.3 + (x / rect.width) * 0.1;
    
    onCoordinatesChange({ lat: parseFloat(newLat.toFixed(4)), lng: parseFloat(newLng.toFixed(4)) });
  };
  
  return (
    <div className="relative w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden">
      {/* This would be replaced with an actual map component */}
      <div 
        className="w-full h-full bg-[#e8eef4] relative cursor-pointer"
        onClick={handleMapClick}
      >
        {/* Simulated grid lines */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`col-${i}`} className="border-r border-blue-200/30" />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`row-${i}`} className="border-b border-blue-200/30" />
          ))}
        </div>
        
        {/* Simulated parcel marker */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ 
            left: `${((coordinates.lng - 4.3) / 0.1) * 100}%`, 
            top: `${((coordinates.lat - 45.4) / 0.1) * 100}%` 
          }}
        >
          <MapPin className="h-8 w-8 text-agri-primary drop-shadow-md" />
          <div className="bg-white px-2 py-0.5 rounded shadow text-xs mt-1">
            {parcelName}
          </div>
        </div>
        
        {/* Instruction for editing mode */}
        {isEditing && (
          <div className="absolute bottom-2 left-0 right-0 text-center bg-white/80 py-1 text-xs">
            Cliquez sur la carte pour déplacer le marqueur
          </div>
        )}
        
        {/* Coordinates display */}
        <div className="absolute top-2 right-2 bg-white px-2 py-1 text-xs rounded shadow">
          Lat: {coordinates.lat} | Lng: {coordinates.lng}
        </div>
      </div>
    </div>
  );
};

export default ParcelMap;
