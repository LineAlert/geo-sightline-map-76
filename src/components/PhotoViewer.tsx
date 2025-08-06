import { useState, useEffect } from 'react';
import { DamagePhoto } from '@/types/damage-photo';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Calendar, 
  User, 
  Compass, 
  Mountain, 
  ExternalLink,
  X,
  AlertTriangle
} from 'lucide-react';

interface PhotoViewerProps {
  photo: DamagePhoto | null;
  isOpen: boolean;
  onClose: () => void;
  onPriorityChange?: (photoId: string, priority: 'high' | 'medium' | 'low') => void;
  onPriorityClear?: (photoId: string) => void;
}

const PhotoViewer = ({ photo, isOpen, onClose, onPriorityChange, onPriorityClear }: PhotoViewerProps) => {
  const [currentPriority, setCurrentPriority] = useState<string>(photo?.priority || '');
  const { toast } = useToast();
  
  // Update currentPriority when photo changes
  useEffect(() => {
    setCurrentPriority(photo?.priority || '');
  }, [photo?.priority]);
  
  if (!photo) return null;

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
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCoordinates = (lat: number, lng: number) => {
    const latDirection = lat >= 0 ? 'N' : 'S';
    const lngDirection = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(6)}°${latDirection}, ${Math.abs(lng).toFixed(6)}°${lngDirection}`;
  };

  const getDirectionName = (degrees?: number) => {
    if (degrees === undefined) return 'Unknown';
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return `${directions[index]} (${degrees}°)`;
  };


  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${photo.latitude},${photo.longitude}`;
    window.open(url, '_blank');
  };

  const handlePriorityChange = async (newPriority: string) => {
    const priority = newPriority as 'high' | 'medium' | 'low';
    const previousPriority = currentPriority;
    setCurrentPriority(priority);
    
    if (onPriorityChange && photo) {
      try {
        await onPriorityChange(photo.id, priority);
        toast({
          title: "Priority Updated",
          description: `Photo priority set to ${priority}`,
        });
      } catch (error) {
        // Revert the UI state if save failed
        setCurrentPriority(previousPriority);
        toast({
          title: "Error",
          description: "Failed to save priority. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePriorityClear = async () => {
    const previousPriority = currentPriority;
    setCurrentPriority('');
    
    if (onPriorityClear && photo) {
      try {
        await onPriorityClear(photo.id);
        toast({
          title: "Priority Cleared",
          description: "Photo priority has been removed",
        });
      } catch (error) {
        // Revert the UI state if clear failed
        setCurrentPriority(previousPriority);
        toast({
          title: "Error",
          description: "Failed to clear priority. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col z-[9999]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Damage Assessment Photo</span>
            <div className="flex items-center gap-2">
              {currentPriority && (
                <Badge className={`${getPriorityColor(currentPriority)}`}>
                  {`${currentPriority.charAt(0).toUpperCase() + currentPriority.slice(1)} Priority`}
                </Badge>
              )}
              {!currentPriority && (
                <Badge variant="outline" className="text-muted-foreground">
                  No Priority Set
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Photo Section */}
            <div className="md:col-span-1 lg:col-span-2 space-y-4">
              <div className="relative">
                <img
                  src={photo.imageUrl}
                  alt={photo.description || 'Damage photo'}
                  className="w-full h-auto max-h-[500px] object-contain rounded-lg shadow-card"
                />
                
                {/* Direction indicator overlay */}
                {photo.direction !== undefined && (
                  <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded-lg flex items-center gap-2">
                    <Compass 
                      className="h-5 w-5" 
                      style={{ transform: `rotate(${photo.direction}deg)` }}
                    />
                    <span className="text-sm font-medium">
                      {getDirectionName(photo.direction)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={openInMaps} className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Maps
                </Button>
              </div>
            </div>
            
            {/* Metadata Section */}
            <div className="space-y-4">
              {/* Priority Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Priority Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Set Priority Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={currentPriority === 'high' ? 'default' : 'outline'}
                        onClick={() => handlePriorityChange('high')}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        High
                      </Button>
                      <Button
                        variant={currentPriority === 'medium' ? 'default' : 'outline'}
                        onClick={() => handlePriorityChange('medium')}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        Medium
                      </Button>
                      <Button
                        variant={currentPriority === 'low' ? 'default' : 'outline'}
                        onClick={() => handlePriorityChange('low')}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        Low
                      </Button>
                    </div>
                    {currentPriority && (
                      <Button
                        variant="ghost"
                        onClick={handlePriorityClear}
                        className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                        Clear Priority
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Photo Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {photo.description && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                      <p className="text-sm">{photo.description}</p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium text-sm">Timestamp</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(photo.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium text-sm">Location</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatCoordinates(photo.latitude, photo.longitude)}
                        </p>
                      </div>
                    </div>
                    
                    
                    {photo.altitude !== undefined && (
                      <div className="flex items-start gap-3">
                        <Mountain className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium text-sm">Altitude</h4>
                          <p className="text-sm text-muted-foreground">
                            {photo.altitude.toFixed(2)} meters
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {photo.direction !== undefined && (
                      <div className="flex items-start gap-3">
                        <Compass className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium text-sm">Direction</h4>
                          <p className="text-sm text-muted-foreground">
                            {getDirectionName(photo.direction)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {photo.tags && photo.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {photo.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoViewer;