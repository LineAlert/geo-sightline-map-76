import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PhotoFilters } from '@/types/damage-photo';
import { Calendar, User, AlertTriangle, X, Search } from 'lucide-react';

interface FilterPanelProps {
  filters: PhotoFilters;
  onFiltersChange: (filters: Partial<PhotoFilters>) => void;
  allUsers: string[];
  className?: string;
}

const FilterPanel = ({ filters, onFiltersChange, allUsers, className = "" }: FilterPanelProps) => {
  const [localStartDate, setLocalStartDate] = useState(
    filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''
  );
  const [localEndDate, setLocalEndDate] = useState(
    filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''
  );

  const handleStartDateChange = (value: string) => {
    setLocalStartDate(value);
    onFiltersChange({ startDate: value ? new Date(value) : undefined });
  };

  const handleEndDateChange = (value: string) => {
    setLocalEndDate(value);
    onFiltersChange({ endDate: value ? new Date(value) : undefined });
  };

  const clearFilter = (key: keyof PhotoFilters) => {
    if (key === 'startDate') {
      setLocalStartDate('');
    } else if (key === 'endDate') {
      setLocalEndDate('');
    }
    onFiltersChange({ [key]: undefined });
  };

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([_, value]) => value !== undefined).length;
  };

  const getPriorityColor = (priority: string) => {
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

  return (
    <Card className={`${className} shadow-card`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Filters
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {getActiveFilterCount()} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </Label>
          
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by caption, submitter, tags..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ search: e.target.value || undefined })}
              className="text-sm pr-8"
            />
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0"
                onClick={() => clearFilter('search')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Label>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Input
                type="date"
                value={localStartDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="text-sm"
              />
              {filters.startDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                  onClick={() => clearFilter('startDate')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="relative">
              <Input
                type="date"
                value={localEndDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="text-sm"
              />
              {filters.endDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                  onClick={() => clearFilter('endDate')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* User Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Inspector
          </Label>
          
           <div className="flex gap-2">
            <Select 
              value={filters.user || "all"} 
              onValueChange={(value) => onFiltersChange({ user: value === "all" ? undefined : value })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All inspectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All inspectors</SelectItem>
                {allUsers.map(user => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {filters.user && (
              <Button
                variant="ghost"
                size="sm"
                className="px-2"
                onClick={() => clearFilter('user')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Priority Level
          </Label>
          
           <div className="flex gap-2">
            <Select 
              value={filters.priority || "all"} 
              onValueChange={(value) => onFiltersChange({ priority: value === "all" ? undefined : value as any })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor('high')}`} />
                    High Priority
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor('medium')}`} />
                    Medium Priority
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor('low')}`} />
                    Low Priority
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {filters.priority && (
              <Button
                variant="ghost"
                size="sm"
                className="px-2"
                onClick={() => clearFilter('priority')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        {getActiveFilterCount() > 0 && (
          <div className="pt-2 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="outline" className="text-xs">
                  Search: "{filters.search}"
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-3 w-3 p-0"
                    onClick={() => clearFilter('search')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              
              {filters.startDate && (
                <Badge variant="outline" className="text-xs">
                  From: {filters.startDate.toLocaleDateString()}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-3 w-3 p-0"
                    onClick={() => clearFilter('startDate')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              
              {filters.endDate && (
                <Badge variant="outline" className="text-xs">
                  To: {filters.endDate.toLocaleDateString()}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-3 w-3 p-0"
                    onClick={() => clearFilter('endDate')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              
              {filters.user && (
                <Badge variant="outline" className="text-xs">
                  {filters.user}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-3 w-3 p-0"
                    onClick={() => clearFilter('user')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              
              {filters.priority && (
                <Badge variant="outline" className="text-xs">
                  <div className={`w-2 h-2 rounded-full mr-1 ${getPriorityColor(filters.priority)}`} />
                  {filters.priority}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-3 w-3 p-0"
                    onClick={() => clearFilter('priority')}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterPanel;