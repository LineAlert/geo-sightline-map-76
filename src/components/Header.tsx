import { Button } from '@/components/ui/button';
import { RotateCcw, Filter, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import agencyLogo from '@/assets/agency-logo.png';

interface HeaderProps {
  onClearFilters: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  totalPhotos: number;
  filteredPhotos: number;
}

const Header = ({ 
  onClearFilters, 
  onToggleFilters, 
  showFilters, 
  totalPhotos, 
  filteredPhotos 
}: HeaderProps) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };
  return (
    <header className="bg-surface border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <img 
            src={agencyLogo}
            alt="LineAlert Logo"
            className="h-12 w-auto"
          />
          <div className="text-foreground">
            <h1 className="text-xl font-semibold">State Control Panel</h1>
            <p className="text-sm text-muted-foreground">
              Showing {filteredPhotos} of {totalPhotos} photos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 mr-4">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            className={showFilters ? "bg-primary text-primary-foreground" : ""}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button
            variant="outline" 
            size="sm"
            onClick={onClearFilters}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;