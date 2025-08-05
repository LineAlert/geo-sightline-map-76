import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { Button } from '@/components/ui/button';
import { ZoomIn, Square } from 'lucide-react';
import type { DamagePhoto, SelectedArea } from '@/types/damage-photo';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface StateCoordinates {
  lat: number;
  lng: number;
  zoom: number;
}

interface MapViewProps {
  photos: DamagePhoto[];
  allPhotos: DamagePhoto[];
  selectedPhoto?: DamagePhoto | null;
  onPhotoSelect: (photo: DamagePhoto) => void;
  onAreaSelect: (area: SelectedArea | null) => void;
  selectedArea?: SelectedArea | null;
  onViewportChange?: (bounds: SelectedArea) => void;
  initialLocation?: StateCoordinates;
}

export default function MapView({
  photos,
  allPhotos,
  selectedPhoto,
  onPhotoSelect,
  onAreaSelect,
  selectedArea,
  onViewportChange,
  initialLocation,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const drawControl = useRef<L.Control.Draw | null>(null);
  const drawnItems = useRef<L.FeatureGroup | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapSelectedPhoto, setMapSelectedPhoto] = useState<DamagePhoto | null>(null);
  const onViewportChangeRef = useRef(onViewportChange);

  // Update the ref when the callback changes
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Create map with initial location if provided
    const defaultLat = initialLocation?.lat || 40.7128;
    const defaultLng = initialLocation?.lng || -74.0060;
    const defaultZoom = initialLocation?.zoom || 10;
    
    map.current = L.map(mapContainer.current).setView([defaultLat, defaultLng], defaultZoom);

    // Add OpenStreetMap tiles with better error handling
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      crossOrigin: true,
    }).addTo(map.current);

    // Initialize feature group for drawn items
    drawnItems.current = new L.FeatureGroup();
    map.current.addLayer(drawnItems.current);

    // Initialize draw controls
    drawControl.current = new L.Control.Draw({
      position: 'topright',
      draw: {
        rectangle: {
          shapeOptions: {
            color: 'hsl(var(--primary))',
            fillColor: 'hsl(var(--primary))',
            fillOpacity: 0.2,
          },
        },
        polygon: {
          allowIntersection: false,
          shapeOptions: {
            color: 'hsl(var(--primary))',
            fillColor: 'hsl(var(--primary))',
            fillOpacity: 0.2,
          },
        },
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems.current,
        remove: true,
      },
    });

    map.current.addControl(drawControl.current);

    // Add viewport change handler
    const handleViewportChange = () => {
      if (!map.current || !onViewportChangeRef.current) return;
      const bounds = map.current.getBounds();
      onViewportChangeRef.current({
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
      });
    };

    map.current.on('moveend', handleViewportChange);
    map.current.on('zoomend', handleViewportChange);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialLocation]); // Add initialLocation dependency

  // Handle draw events separately
  useEffect(() => {
    if (!map.current) return;

    const handleCreated = (e: any) => {
      const layer = e.layer;
      drawnItems.current?.addLayer(layer);
      
      const bounds = layer.getBounds();
      const area: SelectedArea = {
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
      };
      
      onAreaSelect(area);
    };

    const handleDeleted = () => {
      onAreaSelect(null);
    };

    map.current.on(L.Draw.Event.CREATED, handleCreated);
    map.current.on(L.Draw.Event.DELETED, handleDeleted);

    return () => {
      if (map.current) {
        map.current.off(L.Draw.Event.CREATED, handleCreated);
        map.current.off(L.Draw.Event.DELETED, handleDeleted);
      }
    };
  }, [onAreaSelect]);

  // Create custom icon based on priority
  const createCustomIcon = (priority: string | undefined, isSelected: boolean = false) => {
    const colors = {
      high: '#ef4444',      // Red
      medium: '#f59e0b',    // Orange
      low: '#22c55e',       // Green
      default: '#ffffff',   // White
    };

    const color = priority && colors[priority as keyof typeof colors] ? colors[priority as keyof typeof colors] : colors.default;
    const size = isSelected ? 5 : 4;
    const isDefault = !priority || !(priority in colors);

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          ${isDefault ? 'border: 1px solid black;' : ''}
          outline: 2px solid black;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ${isSelected ? 'transform: scale(1.2);' : ''}
          transition: all 0.2s ease;
        "></div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Add photo markers
  useEffect(() => {
    if (!map.current || !photos.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    photos.forEach((photo) => {
      const isSelected = mapSelectedPhoto?.id === photo.id;
      const marker = L.marker([photo.latitude, photo.longitude], {
        icon: createCustomIcon(photo.priority, isSelected),
      });

      marker.bindPopup(`
        <div class="p-2 min-w-[200px]">
          <img src="${photo.imageUrl}" alt="Damage photo" class="w-full h-24 object-cover rounded mb-2" />
          <p class="font-semibold text-sm">${photo.description}</p>
          <p class="text-xs text-gray-600 mt-1">
            Priority: <span class="capitalize">${photo.priority}</span><br/>
            Time: ${new Date(photo.timestamp).toLocaleString()}<br/>
            Location: ${photo.latitude.toFixed(4)}, ${photo.longitude.toFixed(4)}
          </p>
        </div>
      `);

      marker.on('click', () => {
        // Only update map selection for preview, don't open full viewer
        if (mapSelectedPhoto?.id === photo.id) {
          setMapSelectedPhoto(null); // Deselect if clicking same photo
        } else {
          setMapSelectedPhoto(photo); // Select new photo for preview
        }
      });

      marker.addTo(map.current!);
      markersRef.current.push(marker);
    });
  }, [photos, mapSelectedPhoto, onPhotoSelect]);

  // Fit to photos on initial load or when photos change
  useEffect(() => {
    if (!map.current) return;
    
    // Fit to photos when we have filtered photos (state-specific) or when we have allPhotos (federal)
    const hasPhotosToShow = photos.length > 0 || allPhotos.length > 0;
    if (hasPhotosToShow) {
      fitToPhotos();
    }
  }, [photos.length, allPhotos.length, map.current]); // Trigger when photo counts change

  const fitToPhotos = () => {
    // Use filtered photos for state-specific users, all photos for federal agencies
    const photosToFit = photos.length > 0 ? photos : allPhotos;
    
    if (!map.current || !photosToFit.length) return;
    
    // Calculate bounds directly from the appropriate photo set
    const latitudes = photosToFit.map(photo => photo.latitude);
    const longitudes = photosToFit.map(photo => photo.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    // Create bounds with some padding to avoid markers at the edge
    const bounds = L.latLngBounds(
      [minLat - 0.001, minLng - 0.001],
      [maxLat + 0.001, maxLng + 0.001]
    );
    
    map.current.fitBounds(bounds, { padding: [20, 20] });
    console.log(`Map fitted to ${photosToFit.length} photos`);
  };

  const clearSelection = () => {
    if (drawnItems.current) {
      drawnItems.current.clearLayers();
    }
    onAreaSelect(null);
  };

  return (
    <div 
      className="relative h-[calc(100vh-180px)] w-full"
      onClick={(e) => {
        // Close preview if clicking outside of it
        if (mapSelectedPhoto && !(e.target as Element).closest('.photo-preview')) {
          setMapSelectedPhoto(null);
        }
      }}
    >
      <div ref={mapContainer} className="h-full w-full" />
      
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        {selectedArea && (
          <Button
            onClick={clearSelection}
            size="sm"
            variant="outline"
            className="shadow-lg"
          >
            <Square className="h-4 w-4 mr-1" />
            Clear Selection
          </Button>
        )}
      </div>

      {/* Fit to Photos Button */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <Button
          onClick={fitToPhotos}
          size="sm"
          variant="secondary"
          className="shadow-lg"
        >
          <ZoomIn className="h-4 w-4 mr-1" />
          Fit to Photos
        </Button>
      </div>

      {/* Photo Preview */}
      {mapSelectedPhoto && (
        <div 
          className="photo-preview absolute top-4 right-4 z-[1000] bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg max-w-xs cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => onPhotoSelect(mapSelectedPhoto)}
        >
          <img 
            src={mapSelectedPhoto.imageUrl} 
            alt="Selected photo" 
            className="w-36 h-36 object-cover rounded mb-2"
          />
          <p className="text-sm font-medium truncate mb-1">{mapSelectedPhoto.description}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(mapSelectedPhoto.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <h4 className="text-sm font-semibold mb-2">Priority</h4>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
            <span className="text-xs">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-sm"></div>
            <span className="text-xs">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
            <span className="text-xs">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}