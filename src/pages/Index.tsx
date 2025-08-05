import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDamagePhotos } from '@/hooks/use-damage-photos';
import { useAuth } from '@/hooks/useAuth';
import { DamagePhoto, SelectedArea } from '@/types/damage-photo';
import Header from '@/components/Header';
import FilterPanel from '@/components/FilterPanel';
import MapView from '@/components/MapView';
import PhotoGrid from '@/components/PhotoGrid';
import PhotoViewer from '@/components/PhotoViewer';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [selectedPhoto, setSelectedPhoto] = useState<DamagePhoto | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<SelectedArea | null>(null);
  
  const { 
    photos, 
    allPhotos, 
    loading, 
    filters, 
    selectedArea, 
    updateFilters, 
    clearFilters, 
    setSelectedArea,
    updatePhotosPriority
  } = useDamagePhotos(viewportBounds);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  const handlePhotoSelect = (photo: DamagePhoto) => {
    setSelectedPhoto(photo);
    setIsPhotoViewerOpen(true);
  };

  const handleClearAll = () => {
    clearFilters();
    setSelectedPhoto(null);
  };

  const viewportChangeTimeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedHandleViewportChange = useCallback((bounds: SelectedArea) => {
    // Clear previous timeout
    if (viewportChangeTimeoutRef.current) {
      clearTimeout(viewportChangeTimeoutRef.current);
    }
    
    // Set new timeout
    viewportChangeTimeoutRef.current = setTimeout(() => {
      setViewportBounds(bounds);
    }, 300);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (viewportChangeTimeoutRef.current) {
        clearTimeout(viewportChangeTimeoutRef.current);
      }
    };
  }, []);

  const allUsers = Array.from(new Set(allPhotos.map(p => p.user).filter(Boolean))) as string[];

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading damage assessment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header 
        onClearFilters={handleClearAll}
        onToggleFilters={() => setShowFilters(!showFilters)}
        showFilters={showFilters}
        totalPhotos={allPhotos.length}
        filteredPhotos={photos.length}
      />
      
      <div className="flex-1 flex min-h-0">
        {/* Filter Panel */}
        {showFilters && (
          <div className="w-80 border-r border-border bg-surface">
            <FilterPanel
              filters={filters}
              onFiltersChange={updateFilters}
              allUsers={allUsers}
              className="m-4"
            />
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Map Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full p-4">
                <MapView
                  photos={photos}
                  allPhotos={allPhotos}
                  selectedPhoto={selectedPhoto}
                  onPhotoSelect={handlePhotoSelect}
                  onAreaSelect={setSelectedArea}
                  selectedArea={selectedArea}
                  onViewportChange={debouncedHandleViewportChange}
                />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            {/* Photo Grid Panel */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col bg-surface-variant">
                <div className="flex-1 min-h-0">
                  <PhotoGrid
                    photos={photos}
                    selectedPhoto={selectedPhoto}
                    onPhotoSelect={handlePhotoSelect}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
      
      {/* Photo Viewer Modal */}
      <PhotoViewer
        photo={selectedPhoto}
        isOpen={isPhotoViewerOpen}
        onClose={() => {
          setIsPhotoViewerOpen(false);
          setSelectedPhoto(null);
        }}
        onPriorityChange={updatePhotosPriority}
      />
    </div>
  );
};

export default Index;
