import { DamagePhoto } from '@/types/damage-photo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Compass } from 'lucide-react';

interface PhotoGridProps {
  photos: DamagePhoto[];
  selectedPhoto?: DamagePhoto | null;
  onPhotoSelect: (photo: DamagePhoto) => void;
}

const PhotoGrid = ({ photos, selectedPhoto, onPhotoSelect }: PhotoGridProps) => {
  // Sort photos by timestamp (most recent first) and take only the first 20
  const recentPhotos = photos
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-priority-high text-white';
      case 'medium':
        return 'bg-priority-medium text-black';
      case 'low':
        return 'bg-priority-low text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
    const shortDate = date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit'
    });
    return `${time} ${shortDate}`;
  };


  if (recentPhotos.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium text-muted-foreground">No Photos Found</h3>
          <p className="text-sm text-muted-foreground">
            No damage photos match the current filters or selection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4" style={{ overscrollBehavior: 'contain' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {recentPhotos.map((photo) => (
          <Card
            key={photo.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPhoto && selectedPhoto.id === photo.id
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:shadow-card'
            }`}
            onClick={() => onPhotoSelect(photo)}
          >
            <div className="relative">
              <img
                src={photo.imageUrl}
                alt={photo.description || 'Damage photo'}
                className="w-full h-32 object-cover rounded-t-lg"
                loading="lazy"
              />
              
              {/* Priority badge */}
              {photo.priority && (
                <Badge
                  className={`absolute top-2 right-2 ${getPriorityColor(photo.priority)} text-xs`}
                >
                  {`${photo.priority.charAt(0).toUpperCase() + photo.priority.slice(1)} Priority`}
                </Badge>
              )}
              
              {/* Direction indicator */}
              {photo.direction !== undefined && (
                <div className="absolute top-2 left-2 bg-black/70 text-white p-1 rounded-full">
                  <Compass 
                    className="h-4 w-4" 
                    style={{ transform: `rotate(${photo.direction}deg)` }}
                  />
                </div>
              )}
            </div>
            
            <CardContent className="p-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{formatDate(photo.timestamp)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PhotoGrid;