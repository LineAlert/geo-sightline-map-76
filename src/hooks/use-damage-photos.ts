import { useState, useEffect } from 'react';
import { DamagePhoto, PhotoFilters, SelectedArea } from '@/types/damage-photo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useProfile } from './useProfile';

export const useDamagePhotos = (viewportBounds?: SelectedArea | null) => {
  const [photos, setPhotos] = useState<DamagePhoto[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<DamagePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PhotoFilters>({});
  const [selectedArea, setSelectedArea] = useState<SelectedArea | null>(null);
  const { isLocationInUserState, profile } = useProfile();

  // Load photos from S3 bucket and merge with database priorities
  const loadPhotos = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching data from S3 via edge function...');
      
      // Call the edge function to fetch S3 data
      const { data, error } = await supabase.functions.invoke('fetch-s3-data');

      if (error) {
        console.error('Error calling edge function:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data received from S3');
      }

      console.log('Raw S3 data received:', data);
      
      // Handle different possible data structures
      let features;
      if (data.type === 'FeatureCollection' && data.features) {
        features = data.features;
      } else if (Array.isArray(data)) {
        features = data;
      } else {
        throw new Error('Unexpected data format from S3');
      }
      
      // Transform the data to match our DamagePhoto interface
      const transformedPhotos: DamagePhoto[] = features.map((item: any, index: number) => {
        // Handle GeoJSON feature format
        let properties = item.properties || item;
        let coordinates = item.geometry?.coordinates || [item.longitude || item.lng || 0, item.latitude || item.lat || 0];
        
        // Extract coordinates (GeoJSON uses [longitude, latitude, altitude])
        const longitude = parseFloat(coordinates[0]) || 0;
        const latitude = parseFloat(coordinates[1]) || 0;
        const altitude = coordinates[2] ? parseFloat(coordinates[2]) : undefined;
        
        // Handle various possible field names from different data sources
        const getId = () => properties.id || properties.ID || properties.uuid || properties.signature || `photo-${index}`;
        const getImageUrl = () => properties.preview || properties.thumbnail || properties.imageUrl || properties.image_url || properties.url || '';
        const getTimestamp = () => properties.instant || properties.timestamp || properties.created_at || properties.date || properties.created || new Date().toISOString();
        const getDescription = () => properties.caption || properties.description || properties.title || properties.name || '';
        const getUser = () => properties.name || properties.username || properties.user || properties.author || '';
        const getPriority = () => {
          const priority = properties.priority?.toLowerCase();
          if (priority === 'high' || priority === 'critical') return 'high';
          if (priority === 'medium' || priority === 'moderate') return 'medium';
          if (priority === 'low' || priority === 'minor') return 'low';
          return undefined; // no default priority
        };

        return {
          id: getId(),
          imageUrl: getImageUrl(),
          latitude,
          longitude,
          timestamp: getTimestamp(),
          description: getDescription(),
          user: getUser(),
          priority: getPriority(),
          direction: properties.direction || properties.heading,
          altitude,
          tags: properties.tags || []
        };
      });

      // Fetch user-specific priority overrides from database
      const { data: priorityOverrides, error: priorityError } = await supabase
        .from('photo_priorities')
        .select('photo_id, priority');

      if (priorityError) {
        console.error('Error fetching priority overrides:', priorityError);
        // Continue without overrides if database query fails
      } else {
        // Apply priority overrides to photos
        const priorityMap = new Map(priorityOverrides?.map(p => [p.photo_id, p.priority]) || []);
        transformedPhotos.forEach(photo => {
          // Check both string and number versions of photo ID to handle type mismatches
          const priorityValue = priorityMap.get(photo.id) || priorityMap.get(String(photo.id));
          if (priorityValue && (priorityValue === 'high' || priorityValue === 'medium' || priorityValue === 'low')) {
            photo.priority = priorityValue;
            console.log('Applied priority override for photo:', photo.id, 'priority:', photo.priority);
          }
        });
      }

      setPhotos(transformedPhotos);
      setFilteredPhotos(transformedPhotos);
      console.log('Transformed photos with priority overrides:', transformedPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter photos based on current filters, selected area, viewport bounds, and user's state
  const applyFilters = () => {
    let filtered = [...photos];

    // Apply state-based geographical filtering first
    if (profile && profile.location !== 'United States') {
      filtered = filtered.filter(photo => 
        isLocationInUserState(photo.latitude, photo.longitude)
      );
      console.log(`Filtered to ${filtered.length} photos within ${profile.location}`);
    }

    // Apply viewport filter if available (when zooming/panning)
    const boundsToUse = viewportBounds || selectedArea;
    if (boundsToUse && boundsToUse.bounds) {
      filtered = filtered.filter(photo => 
        photo.latitude >= boundsToUse.bounds!.south &&
        photo.latitude <= boundsToUse.bounds!.north &&
        photo.longitude >= boundsToUse.bounds!.west &&
        photo.longitude <= boundsToUse.bounds!.east
      );
    }

    // Apply date filter
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(photo => {
        const photoDate = new Date(photo.timestamp);
        if (filters.startDate && photoDate < filters.startDate) return false;
        if (filters.endDate && photoDate > filters.endDate) return false;
        return true;
      });
    }

    // Apply user filter
    if (filters.user) {
      filtered = filtered.filter(photo => photo.user === filters.user);
    }

    // Apply priority filter
    if (filters.priority) {
      filtered = filtered.filter(photo => photo.priority === filters.priority);
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(photo => {
        const description = (photo.description || '').toLowerCase();
        const user = (photo.user || '').toLowerCase();
        const tags = (photo.tags || []).join(' ').toLowerCase();
        
        return description.includes(searchTerm) || 
               user.includes(searchTerm) || 
               tags.includes(searchTerm);
      });
    }

    setFilteredPhotos(filtered);
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [photos, filters, selectedArea, viewportBounds, profile]);

  const updateFilters = (newFilters: Partial<PhotoFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedArea(null);
  };

  const updatePhotosPriority = async (photoId: string, priority: 'high' | 'medium' | 'low') => {
    try {
      console.log('Updating priority for photo:', photoId, 'to:', priority);
      
      // Store original priority for potential rollback
      const originalPhoto = photos.find(photo => photo.id === photoId);
      const originalPriority = originalPhoto?.priority;
      
      // Update local state immediately for responsive UI
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId ? { ...photo, priority } : photo
      ));

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        // Revert to original state
        setPhotos(prev => prev.map(photo => 
          photo.id === photoId ? { ...photo, priority: originalPriority } : photo
        ));
        throw new Error('User not authenticated');
      }

      console.log('Saving priority to database for user:', user.id);
      
      // Save to database (upsert - insert or update if exists)
      const { error } = await supabase
        .from('photo_priorities')
        .upsert({
          photo_id: String(photoId), // Ensure photo_id is stored as string
          user_id: user.id,
          priority
        }, {
          onConflict: 'photo_id,user_id'
        });

      if (error) {
        console.error('Database error saving priority:', error);
        // Revert to original state
        setPhotos(prev => prev.map(photo => 
          photo.id === photoId ? { ...photo, priority: originalPriority } : photo
        ));
        throw error;
      }
      
      console.log('Priority saved successfully to database');
    } catch (error) {
      console.error('Error updating photo priority:', error);
      throw error; // Re-throw to allow calling component to handle
    }
  };

  const clearPhotoPriority = async (photoId: string) => {
    try {
      console.log('Clearing priority for photo:', photoId);
      
      // Store original priority for potential rollback
      const originalPhoto = photos.find(photo => photo.id === photoId);
      const originalPriority = originalPhoto?.priority;
      
      // Update local state immediately for responsive UI
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId ? { ...photo, priority: undefined } : photo
      ));

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        // Revert to original state
        setPhotos(prev => prev.map(photo => 
          photo.id === photoId ? { ...photo, priority: originalPriority } : photo
        ));
        throw new Error('User not authenticated');
      }

      console.log('Deleting priority from database for user:', user.id);
      
      // Delete the priority record from database
      const { error } = await supabase
        .from('photo_priorities')
        .delete()
        .eq('photo_id', String(photoId))
        .eq('user_id', user.id);

      if (error) {
        console.error('Database error clearing priority:', error);
        // Revert to original state
        setPhotos(prev => prev.map(photo => 
          photo.id === photoId ? { ...photo, priority: originalPriority } : photo
        ));
        throw error;
      }
      
      console.log('Priority cleared successfully from database');
    } catch (error) {
      console.error('Error clearing photo priority:', error);
      throw error; // Re-throw to allow calling component to handle
    }
  };

  const updatePhotoCaption = async (photoId: string, caption: string) => {
    try {
      console.log('Updating caption for photo:', photoId, 'to:', caption);
      
      // Store original caption for potential rollback
      const originalPhoto = photos.find(photo => photo.id === photoId);
      const originalCaption = originalPhoto?.caption;
      
      // Update local state immediately for responsive UI
      setPhotos(prev => prev.map(photo => 
        photo.id === photoId ? { ...photo, caption } : photo
      ));

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        // Revert to original state
        setPhotos(prev => prev.map(photo => 
          photo.id === photoId ? { ...photo, caption: originalCaption } : photo
        ));
        throw new Error('User not authenticated');
      }

      // For now, we'll need to create a separate table for captions
      // This is a placeholder implementation
      console.log('Caption updated locally, database implementation needed');
      
    } catch (error) {
      console.error('Error updating photo caption:', error);
      throw error;
    }
  };

  return {
    photos: filteredPhotos,
    allPhotos: photos,
    loading,
    filters,
    selectedArea,
    updateFilters,
    clearFilters,
    setSelectedArea,
    updatePhotosPriority,
    clearPhotoPriority,
    updatePhotoCaption,
    reload: loadPhotos
  };
};