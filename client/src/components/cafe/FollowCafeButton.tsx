import * as React from "react";
import { Button } from "@/components/ui/Button";
import { followService, FollowPreferences } from "@/services/followService";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, BellOff, Settings, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";

interface FollowCafeButtonProps {
  cafeId: string;
  cafeName: string;
  className?: string;
  variant?: "primary" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function FollowCafeButton({ 
  cafeId, 
  cafeName, 
  className,
  variant = "outline",
  size = "default",
  showLabel = true
}: FollowCafeButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [preferences, setPreferences] = React.useState<FollowPreferences | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchStatus = React.useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await followService.getStatus(cafeId);
      if (res.success) {
        setIsFollowing(res.data.isFollowing);
        setPreferences(res.data.preferences);
      }
    } catch (error) {
      console.error("Failed to fetch follow status", error);
    } finally {
      setLoading(false);
    }
  }, [cafeId, isAuthenticated]);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${window.location.pathname}`;
      return;
    }

    setActionLoading(true);
    try {
      if (isFollowing) {
        const res = await followService.unfollow(cafeId);
        if (res.success) {
          setIsFollowing(false);
          setPreferences(null);
          toast.success(`Unfollowed ${cafeName}`);
        }
      } else {
        const res = await followService.follow(cafeId);
        if (res.success) {
          setIsFollowing(true);
          setPreferences({
            eventsEnabled: true,
            specialsEnabled: true,
            announcementsEnabled: true,
            menuUpdatesEnabled: true,
          });
          toast.success(`Following ${cafeName}`);
        }
      }
    } catch (error) {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePreference = async (key: keyof FollowPreferences, value: boolean) => {
    if (!preferences) return;
    
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    
    try {
      await followService.updatePreferences(cafeId, newPrefs);
    } catch (error) {
      toast.error("Failed to update preferences");
      // Rollback
      setPreferences(preferences);
    }
  };

  if (loading) {
    return (
      <Button variant={variant} size={size} disabled className={cn("rounded-xl", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={isFollowing ? "secondary" : variant}
        size={size}
        onClick={handleToggleFollow}
        disabled={actionLoading}
        className={cn(
          "rounded-xl transition-all gap-2",
          isFollowing && "bg-brand-background border-brand-coffee/20 text-brand-coffee hover:bg-brand-cream",
          className
        )}
      >
        {actionLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <>
            <Check className="w-4 h-4" />
            {showLabel && <span>Following</span>}
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            {showLabel && <span>Follow</span>}
          </>
        )}
      </Button>

      {isFollowing && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 text-brand-muted hover:text-brand-coffee hover:bg-brand-cream">
              <Settings className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4 rounded-2xl shadow-xl border-brand-border">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-brand-charcoal">Notification Settings</h4>
                <p className="text-xs text-brand-muted">Get updates from {cafeName}</p>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="events" className="text-sm font-medium cursor-pointer">Events</Label>
                  <Switch 
                    id="events" 
                    checked={preferences?.eventsEnabled} 
                    onCheckedChange={(val) => handleUpdatePreference('eventsEnabled', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="specials" className="text-sm font-medium cursor-pointer">Specials</Label>
                  <Switch 
                    id="specials" 
                    checked={preferences?.specialsEnabled} 
                    onCheckedChange={(val) => handleUpdatePreference('specialsEnabled', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="announcements" className="text-sm font-medium cursor-pointer">Announcements</Label>
                  <Switch 
                    id="announcements" 
                    checked={preferences?.announcementsEnabled} 
                    onCheckedChange={(val) => handleUpdatePreference('announcementsEnabled', val)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="menu" className="text-sm font-medium cursor-pointer">Menu Updates</Label>
                  <Switch 
                    id="menu" 
                    checked={preferences?.menuUpdatesEnabled} 
                    onCheckedChange={(val) => handleUpdatePreference('menuUpdatesEnabled', val)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold"
                  onClick={handleToggleFollow}
                >
                  Unfollow Cafe
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
