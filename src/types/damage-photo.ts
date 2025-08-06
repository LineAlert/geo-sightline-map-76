export interface DamagePhoto {
  id: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  direction?: number;
  altitude?: number;
  priority?: 'high' | 'medium' | 'low';
  user?: string;
  description?: string;
  caption?: string;
  tags?: string[];
}

export interface PhotoFilters {
  startDate?: Date;
  endDate?: Date;
  user?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  search?: string;
}

export interface SelectedArea {
  type?: 'rectangle' | 'polygon';
  coordinates?: number[][];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}