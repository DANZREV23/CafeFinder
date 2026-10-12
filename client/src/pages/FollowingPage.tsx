import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { followService } from "@/services/followService";
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
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

export default function FollowingPage() {
  const { t } = useI18n();
  const [following, setFollowing] = React.useState<any[]>([]);
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
    fetchFollowing();
  }, [fetchFollowing]);

  const handleUnfollow = async (cafeId: string, cafeName: string) => {
    if (!window.confirm(`Stop following ${cafeName}?`)) return;

    try {
      const res = await followService.unfollow(cafeId);
      if (res.success) {
        setFollowing(prev => prev.filter(f => f.cafeId !== cafeId));
        toast.success(`Unfollowed ${cafeName}`);
      }
    } catch (error) {
      toast.error("Failed to unfollow");
    }
  };

  const filteredFollowing = following.filter(f => 
    f.cafe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cafe.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <PageContainer className="py-12">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-brand-coffee font-black uppercase tracking-[0.2em] text-xs">
                <Bell className="w-4 h-4" />
                <span>Subscriptions</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-charcoal">Following</h1>
              <p className="text-brand-muted max-w-lg">
                Manage cafes you're following and control the updates you receive.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input 
                type="text"
                placeholder="Search following..."
                className="w-full h-12 pl-11 pr-4 bg-white border border-brand-border rounded-2xl text-sm focus:ring-2 focus:ring-brand-coffee/20 focus:border-brand-coffee outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </header>

          {loading && page === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-brand-border/10 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : filteredFollowing.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFollowing.map((follow) => (
                <div 
                  key={follow.id}
                  className="bg-white border border-brand-border rounded-[32px] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col"
                >
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img 
                      src={follow.cafe.photos?.[0]?.url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80'} 
                      alt={follow.cafe.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute top-4 right-4 flex gap-2">
                       <Button 
                         variant="secondary" 
                         size="icon" 
                         className="w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-sm text-red-500 hover:bg-red-50"
                         onClick={() => handleUnfollow(follow.cafeId, follow.cafe.name)}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Link to={`/cafes/${follow.cafe.slug}`} className="font-serif font-bold text-xl text-brand-charcoal hover:text-brand-coffee transition-colors truncate">
                          {follow.cafe.name}
                        </Link>
                        <div className="flex items-center gap-1 text-xs font-bold text-brand-coffee">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{Number(follow.cafe.ratingAverage).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                        <MapPin className="w-3 h-3" />
                        <span>{follow.cafe.city}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 py-2 border-y border-brand-border/50">
                      {follow.eventsEnabled && (
                        <div className="p-1.5 bg-brand-cream rounded-lg text-brand-coffee" title="Events Enabled">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {follow.specialsEnabled && (
                        <div className="p-1.5 bg-brand-cream rounded-lg text-brand-coffee" title="Specials Enabled">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {follow.announcementsEnabled && (
                        <div className="p-1.5 bg-brand-cream rounded-lg text-brand-coffee" title="Announcements Enabled">
                          <Megaphone className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {follow.menuUpdatesEnabled && (
                        <div className="p-1.5 bg-brand-cream rounded-lg text-brand-coffee" title="Menu Updates Enabled">
                          <Coffee className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="pt-2 mt-auto">
                      <Button asChild variant="outline" className="w-full rounded-2xl text-xs font-bold gap-2">
                        <Link to={`/cafes/${follow.cafe.slug}`}>
                          View Profile
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
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
                <h3 className="text-2xl font-serif font-bold text-brand-charcoal">No followed cafes</h3>
                <p className="text-brand-muted max-w-md mx-auto">
                  Follow cafes to get updates on their latest events, specials, and announcements.
                </p>
              </div>
              <Button asChild variant="primary" className="rounded-2xl h-12 px-8">
                <Link to="/explore">Explore Cafes</Link>
              </Button>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
             <div className="flex justify-center gap-2 pt-8">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                   <Button
                     key={p}
                     variant={p === page ? "primary" : "outline"}
                     size="icon"
                     className="w-10 h-10 rounded-xl"
                     onClick={() => {
                       setPage(p);
                       fetchFollowing(p);
                     }}
                   >
                     {p}
                   </Button>
                ))}
             </div>
          )}
        </div>
      </PageContainer>
    </MainLayout>
  );
}
