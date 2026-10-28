import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Link } from "react-router-dom";
import { 
  Bell, 
  MapPin, 
  Star, 
  ChevronRight, 
  Trash2, 
  Settings2,
  Calendar,
  Tag,
  Megaphone,
  Coffee,
  Search,
  Loader2
} from "lucide-react";
import followService, { CafeFollow } from "@/services/followService";
import { CafeFollowPreferences } from "@/types";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

export default function DashboardFollowingPage() {
  const { t } = useI18n();
  const [following, setFollowing] = React.useState<CafeFollow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  const fetchFollowing = React.useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await followService.getMyFollowing({ page: p, limit: 12 });
      if (res.success) {
        setFollowing(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      toast.error("Failed to load following list");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFollowing(page);
  }, [fetchFollowing, page]);

  const handleUnfollow = async (cafeId: string, cafeName: string) => {
    if (!window.confirm(`Stop following ${cafeName}?`)) return;

    try {
      const res = await followService.unfollow(cafeId);
      if (res.success) {
        setFollowing(prev => prev.filter(f => f.cafeId !== cafeId));
        toast.success(`Unfollowed ${cafeName}`);
      }
    } catch (error) {
      toast.error("Failed to unfollow cafe");
    }
  };

  const filteredFollowing = following.filter(f => 
    f.cafe?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cafe?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <PageContainer className="py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-brand-charcoal">Followed Cafes</h1>
              <p className="text-sm text-brand-muted mt-1">
                Stay updated on your favorite Davao cafes with instant event and special notifications.
              </p>
            </div>

            {following.length > 0 && (
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter followed cafes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl border border-brand-border bg-white text-xs text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-coffee"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="w-8 h-8 text-brand-coffee animate-spin" />
            </div>
          ) : filteredFollowing.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFollowing.map((follow) => (
                <div 
                  key={follow.id || follow.cafeId}
                  className="bg-white rounded-3xl border border-brand-border p-5 shadow-xs flex flex-col justify-between hover:border-brand-coffee/30 transition-all group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif font-bold text-lg text-brand-charcoal group-hover:text-brand-coffee transition-colors">
                          <Link to={`/cafes/${follow.cafe?.slug}`}>
                            {follow.cafe?.name}
                          </Link>
                        </h3>
                        {follow.cafe?.city && (
                          <div className="flex items-center gap-1 text-xs text-brand-muted mt-1">
                            <MapPin className="w-3 h-3 text-brand-coffee" />
                            <span>{follow.cafe.city}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleUnfollow(follow.cafeId, follow.cafe?.name || "Cafe")}
                        className="text-brand-muted hover:text-red-600 transition p-1"
                        title="Unfollow"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-brand-border/40 space-y-2">
                      <span className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider block">
                        Notification Preferences
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries({
                          eventsEnabled: "Events",
                          specialsEnabled: "Specials",
                          announcementsEnabled: "Updates",
                          menuUpdatesEnabled: "Menu"
                        } as Record<keyof CafeFollowPreferences, string>).map(([key, label]) => (
                          <label key={String(key)} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-brand-border bg-brand-background/40 cursor-pointer">
                            <span className="text-xs text-brand-charcoal">{label}</span>
                            <input
                              type="checkbox"
                              checked={Boolean(follow[key as keyof CafeFollow])}
                              readOnly
                              className="rounded text-brand-coffee focus:ring-brand-coffee"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-brand-border/40">
                    <Button asChild variant="outline" size="sm" className="w-full rounded-2xl text-xs font-bold gap-2">
                      <Link to={`/cafes/${follow.cafe?.slug}`}>
                        View Cafe Profile
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-brand-cream/30 rounded-[40px] border border-dashed border-brand-border p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Bell className="w-10 h-10 text-brand-muted" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-brand-charcoal">No followed cafes yet</h3>
                <p className="text-sm text-brand-muted max-w-md mx-auto">
                  Follow local cafes to get notifications about new cuppings, live acoustic sessions, and seasonal drinks.
                </p>
              </div>
              <Button asChild className="rounded-2xl bg-brand-coffee text-white font-bold">
                <Link to="/explore">Explore Cafes</Link>
              </Button>
            </div>
          )}
        </div>
      </PageContainer>
    </MainLayout>
  );
}
