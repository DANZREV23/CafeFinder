import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Loader2, Megaphone, Search, Tag, Utensils } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAuth } from '@/contexts/AuthContext';
import followService, { CafeFollow } from '@/services/followService';
import { CafeFollowPreferences } from '@/types';

const preferenceOptions: Array<{ key: keyof CafeFollowPreferences; label: string; icon: React.ElementType }> = [
  { key: 'eventsEnabled', label: 'Events', icon: CalendarDays },
  { key: 'specialsEnabled', label: 'Specials', icon: Tag },
  { key: 'announcementsEnabled', label: 'Announcements', icon: Megaphone },
  { key: 'menuUpdatesEnabled', label: 'Menu updates', icon: Utensils },
];

export default function DashboardFollowingPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [following, setFollowing] = React.useState<CafeFollow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFollowing = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await followService.getFollowing({ page, limit: 12, search: debouncedSearch });
      if (response.success) {
        setFollowing(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch followed cafes', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchFollowing();
  }, [page, debouncedSearch, isAuthenticated]);

  const handlePreferenceChange = async (follow: CafeFollow, key: keyof CafeFollowPreferences, checked: boolean) => {
    const previous = following;
    setFollowing(current => current.map(item => item.id === follow.id ? {
      ...item,
      preferences: { ...item.preferences, [key]: checked },
    } : item));
    setUpdatingId(follow.id);

    try {
      await followService.updatePreferences(follow.cafe.id, { [key]: checked });
    } catch (error) {
      console.error('Failed to update follow preferences', error);
      setFollowing(previous);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUnfollow = async (follow: CafeFollow) => {
    setUpdatingId(follow.id);
    try {
      const response = await followService.unfollowCafe(follow.cafe.id);
      if (response.success) {
        setFollowing(current => current.filter(item => item.id !== follow.id));
        setTotal(current => Math.max(current - 1, 0));
      }
    } catch (error) {
      console.error('Failed to unfollow cafe', error);
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-coffee" />
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/dashboard/following" />;
  }

  return (
    <MainLayout>
      <PageContainer className="py-12 md:py-20">
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-brand-coffee font-bold uppercase tracking-widest text-xs">
                <div className="h-px w-8 bg-brand-coffee" />
                Dashboard
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-charcoal">Following</h1>
              <p className="text-brand-muted text-lg max-w-2xl">
                Manage cafes you follow and choose exactly which updates appear in your notifications.
              </p>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <Input
                placeholder="Search followed cafes..."
                className="pl-11 h-12 w-full md:w-80 bg-white border-brand-border rounded-xl"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-brand-coffee" />
            </div>
          ) : following.length > 0 ? (
            <div className="space-y-6">
              {following.map((follow) => {
                const cover = follow.cafe.photos?.[0]?.url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80';
                const isUpdating = updatingId === follow.id;

                return (
                  <article key={follow.id} className="bg-white border border-brand-border rounded-[32px] p-5 md:p-6 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
                      <div className="flex flex-col sm:flex-row gap-5">
                        <Link to={`/cafes/${follow.cafe.slug}`} className="w-full sm:w-40 aspect-video sm:aspect-square rounded-3xl overflow-hidden border border-brand-border shrink-0">
                          <img src={cover} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </Link>
                        <div className="space-y-3 min-w-0">
                          <div>
                            <Link to={`/cafes/${follow.cafe.slug}`} className="text-2xl font-serif font-bold text-brand-charcoal hover:text-brand-coffee transition-colors">
                              {follow.cafe.name}
                            </Link>
                            <p className="text-sm text-brand-muted mt-1">{follow.cafe.address}, {follow.cafe.city}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="gap-1">
                              <Bell className="w-3 h-3" />
                              Followed {new Date(follow.createdAt).toLocaleDateString()}
                            </Badge>
                            {follow.cafe.verified && <Badge variant="success">Verified</Badge>}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 lg:w-96">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {preferenceOptions.map(({ key, label, icon: Icon }) => (
                            <label key={key} className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-brand-border bg-brand-background/40 cursor-pointer">
                              <span className="flex items-center gap-2 text-sm font-medium text-brand-charcoal">
                                <Icon className="w-4 h-4 text-brand-coffee" />
                                {label}
                              </span>
                              <Checkbox
                                checked={follow.preferences[key]}
                                disabled={isUpdating}
                                onCheckedChange={(checked) => handlePreferenceChange(follow, key, checked === true)}
                              />
                            </label>
                          ))}
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button asChild variant="outline" className="rounded-xl">
                            <Link to={`/cafes/${follow.cafe.slug}`}>View cafe</Link>
                          </Button>
                          <Button
                            variant="danger"
                            className="rounded-xl"
                            disabled={isUpdating}
                            onClick={() => handleUnfollow(follow)}
                          >
                            Unfollow
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-8">
                  <Button variant="outline" disabled={page === 1} onClick={() => setPage(prev => prev - 1)} className="h-12 w-12 p-0 rounded-xl">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <span className="text-sm font-bold text-brand-charcoal">Page {page} of {totalPages}</span>
                  <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(prev => prev + 1)} className="h-12 w-12 p-0 rounded-xl">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-brand-border rounded-[40px] p-12 md:p-20 text-center space-y-6">
              <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mx-auto text-brand-coffee">
                <Bell className="w-10 h-10" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-serif font-bold text-brand-charcoal">No followed cafes yet</h2>
                <p className="text-brand-muted max-w-md mx-auto">Follow cafes to receive useful events, specials, announcements, and menu updates on your terms.</p>
              </div>
              <Button asChild variant="primary" className="h-12 px-8 rounded-2xl">
                <Link to="/explore">Explore cafes</Link>
              </Button>
            </div>
          )}

          <p className="text-sm text-brand-muted">{total} followed {total === 1 ? 'cafe' : 'cafes'}</p>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
