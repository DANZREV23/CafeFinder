import * as React from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  Heart, 
  MessageSquare, 
  Star, 
  Calendar,
  ChevronLeft,
  Download,
  Info,
  ExternalLink,
  Navigation,
  Globe,
  Phone,
  Instagram,
  Facebook,
  Filter
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { AnalyticsStatCard } from "@/components/analytics/AnalyticsStatCard";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { ownerService } from "@/services/ownerService";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

import { MainLayout } from "@/components/layout/MainLayout";

export default function OwnerCafeAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Date Range State
  const from = searchParams.get('from') || format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const to = searchParams.get('to') || format(new Date(), 'yyyy-MM-dd');
  const interval = (searchParams.get('interval') as 'day' | 'week' | 'month') || 'day';

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await ownerService.getAnalytics(id, { from, to, interval });
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error?.message || "Failed to load analytics");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [id, from, to, interval]);

  const handleRangeChange = (days: number) => {
    const newTo = format(new Date(), 'yyyy-MM-dd');
    const newFrom = format(subDays(new Date(), days), 'yyyy-MM-dd');
    setSearchParams({ from: newFrom, to: newTo, interval: days > 60 ? 'week' : 'day' });
  };

  if (error) {
    return (
      <MainLayout>
        <PageContainer className="py-12">
          <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center space-y-4">
            <Info className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-xl font-serif font-bold text-rose-900">{error}</h2>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer className="py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <Link 
            to={`/owner/cafes/${id}`} 
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-muted hover:text-brand-coffee transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Cafe Details
          </Link>
          <div className="space-y-1">
            <h1 className="text-4xl font-serif font-bold text-brand-charcoal">Analytics & Insights</h1>
            {data?.cafe && (
              <p className="text-brand-muted font-medium flex items-center gap-2">
                Performance overview for <span className="text-brand-coffee font-bold">{data.cafe.name}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-brand-border shadow-sm">
          {[
            { label: '7D', days: 7 },
            { label: '30D', days: 30 },
            { label: '90D', days: 90 },
          ].map(range => {
            const isActive = from === format(subDays(new Date(), range.days), 'yyyy-MM-dd');
            return (
              <button
                key={range.label}
                onClick={() => handleRangeChange(range.days)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  isActive 
                    ? "bg-brand-coffee text-white shadow-md" 
                    : "text-brand-muted hover:bg-brand-background"
                )}
              >
                {range.label}
              </button>
            );
          })}
          <div className="h-6 w-px bg-brand-border mx-1" />
          <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsStatCard 
          title="Profile Views" 
          value={data?.summary?.profileViews || 0}
          previousValue={data?.comparison?.profileViewsPrevious}
          icon={<Users className="w-5 h-5" />}
          loading={loading}
        />
        <AnalyticsStatCard 
          title="Total Favorites" 
          value={data?.summary?.favorites || 0}
          previousValue={data?.comparison?.favoritesPrevious}
          icon={<Heart className="w-5 h-5" />}
          loading={loading}
        />
        <AnalyticsStatCard 
          title="Total Reviews" 
          value={data?.summary?.reviews || 0}
          previousValue={data?.comparison?.reviewsPrevious}
          icon={<MessageSquare className="w-5 h-5" />}
          loading={loading}
        />
        <AnalyticsStatCard 
          title="Avg. Rating" 
          value={data?.summary?.averageRating || "0.0"}
          previousValue={data?.comparison?.averageRatingPrevious}
          icon={<Star className="w-5 h-5" />}
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-brand-border shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-brand-charcoal">Traffic Trends</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-brand-background rounded-full text-[10px] font-black uppercase tracking-widest text-brand-muted">
              <div className="w-2 h-2 rounded-full bg-brand-coffee" />
              Profile Views
            </div>
          </div>
          {loading ? (
            <div className="h-[300px] bg-brand-background animate-pulse rounded-3xl" />
          ) : (
            <AnalyticsChart 
              data={data?.series?.profileViews || []} 
              color="#8b5e3c"
              type="area"
            />
          )}
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-brand-border shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-brand-charcoal">Growth of Favorites</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-brand-background rounded-full text-[10px] font-black uppercase tracking-widest text-brand-muted">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              Total Favorites
            </div>
          </div>
          {loading ? (
            <div className="h-[300px] bg-brand-background animate-pulse rounded-3xl" />
          ) : (
            <AnalyticsChart 
              data={data?.series?.favorites || []} 
              color="#f43f5e" 
              type="line"
            />
          )}
        </div>
      </div>

      {/* Ratings Distribution & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-8 rounded-[40px] border border-brand-border shadow-sm space-y-8">
          <h3 className="text-xl font-serif font-bold text-brand-charcoal">Rating Distribution</h3>
          <div className="space-y-4">
            {data?.ratings && Object.entries({
              '5 Stars': data.ratings.five,
              '4 Stars': data.ratings.four,
              '3 Stars': data.ratings.three,
              '2 Stars': data.ratings.two,
              '1 Star': data.ratings.one,
            }).reverse().map(([label, count]: [string, any]) => {
              const total = Object.values(data.ratings).reduce((a: any, b: any) => a + b, 0) as number;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-brand-charcoal">{label}</span>
                    <span className="text-brand-muted">{count} reviews</span>
                  </div>
                  <div className="h-2 w-full bg-brand-background rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-coffee rounded-full transition-all duration-1000" 
                      style={{ width: loading ? '0%' : `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-brand-muted font-medium italic">
            * Ratings shown are from approved customer reviews within the selected period.
          </p>
        </div>

        <div className="lg:col-span-2 bg-brand-charcoal text-white p-10 rounded-[40px] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-accent-warm border border-white/5">
              <Info className="w-3 h-3" />
              Privacy & Privacy
            </div>
            <h3 className="text-3xl font-serif font-bold text-brand-accent-warm">Aggregated Insights</h3>
            <p className="text-white/70 leading-relaxed max-w-xl">
              To protect the privacy of our visitors, all analytics data is anonymized and aggregated. 
              We do not track or share individual user identities, browsing histories, or private data. 
              These metrics represent general traffic patterns and engagement with your cafe profile.
            </p>
          </div>

          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10 border-t border-white/10">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Period Views</span>
              <div className="text-2xl font-serif font-bold">{data?.summary?.profileViews || 0}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Engagement</span>
              <div className="text-2xl font-serif font-bold">
                {data?.summary?.profileViews > 0 
                  ? ((data.summary.favorites / data.summary.profileViews) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Conversion</span>
              <div className="text-2xl font-serif font-bold">High</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Status</span>
              <div className="text-2xl font-serif font-bold text-emerald-400">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="flex justify-center pt-8">
        <Button variant="outline" className="h-12 px-8 rounded-2xl gap-2 font-bold border-brand-border">
          <Download className="w-4 h-4" />
          Export Report (CSV)
        </Button>
      </div>
    </PageContainer>
    </MainLayout>
  );
}
