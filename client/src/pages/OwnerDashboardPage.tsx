import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ClipboardList, 
  MessageSquare, 
  ShieldCheck, 
  BarChart3,
  Star,
  ArrowRight
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { ownerService, OwnerDashboard, OwnerCafeSummary } from '../services/ownerService';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<OwnerDashboard | null>(null);
  const [cafes, setCafes] = useState<OwnerCafeSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      ownerService.getDashboard(),
      ownerService.getOwnedCafes()
    ])
      .then(([dashboardRes, cafesRes]) => {
        setData(dashboardRes.data);
        setCafes(cafesRes.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const stats = [
    { label: 'Claimed Cafes', value: data?.claimedCafes, icon: Building2 },
    { label: 'Pending Claims', value: data?.pendingClaims, icon: ClipboardList },
    { label: 'Published Cafes', value: data?.publishedCafes, icon: ShieldCheck },
    { label: 'Total Reviews', value: data?.totalReviews, icon: MessageSquare },
    { label: 'Pending Changes', value: data?.pendingChangeRequests, icon: ClipboardList },
    { label: 'Average Rating', value: data?.averageRating?.toFixed(1), icon: Star },
  ];

  // Logic to determine where the Analytics link should go
  const analyticsLink = cafes.length === 1 
    ? `/owner/cafes/${cafes[0].id}/analytics` 
    : '/owner/cafes';

  return (
    <MainLayout>
      <PageContainer className="py-12 md:py-16 space-y-10">
        <header className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-coffee">
            {user?.role === 'ADMIN' ? 'Administrative access' : 'Owner workspace'}
          </p>
          <h1 className="text-4xl font-serif font-bold text-brand-charcoal">Owner Dashboard</h1>
          <p className="text-brand-muted max-w-2xl font-medium">
            {data?.isAdministrativeAccess 
              ? 'Viewing ownership data for administrative support.' 
              : 'Welcome back! Manage your cafes, track performance, and respond to your community.'}
          </p>
        </header>

        {error && (
          <div className="rounded-2xl bg-red-50 p-6 text-red-700 border border-red-100 flex items-start gap-3">
            <span className="font-bold">Notice:</span> {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <stat.icon className="w-5 h-5 text-brand-coffee mb-4" />
              <p className="text-2xl font-bold text-brand-charcoal">{loading ? '...' : stat.value ?? '0'}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link to="/owner/cafes" className="rounded-[40px] bg-brand-charcoal text-white p-10 hover:bg-brand-charcoal/90 transition-all group shadow-xl">
            <Building2 className="w-10 h-10 text-brand-accent-warm mb-8 group-hover:scale-110 transition-transform duration-500" />
            <h2 className="text-2xl font-serif font-bold">My Cafes</h2>
            <p className="mt-2 text-white/60 leading-relaxed font-medium">
              Update business details, menu items, photos, and operating hours.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-brand-accent-warm">
              Manage Cafes <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link to="/owner/events" className="rounded-[40px] border border-brand-border bg-white p-8 hover:border-brand-coffee transition-all group shadow-sm hover:shadow-xl">
            <ClipboardList className="w-9 h-9 text-brand-coffee mb-6" />
            <h2 className="text-xl font-serif font-bold text-brand-charcoal">Events, specials & updates</h2>
            <p className="mt-2 text-brand-muted leading-relaxed font-medium">Publish timely cafe information through the review workflow.</p>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-brand-coffee">Manage content <ArrowRight className="w-4 h-4" /></div>
          </Link>
          
          <Link to={analyticsLink} className="rounded-[40px] border border-brand-border bg-white p-10 hover:border-brand-coffee transition-all group shadow-sm hover:shadow-xl">
            <BarChart3 className="w-10 h-10 text-brand-coffee mb-8 group-hover:scale-110 transition-transform duration-500" />
            <h2 className="text-2xl font-serif font-bold text-brand-charcoal">Analytics</h2>
            <p className="mt-2 text-brand-muted leading-relaxed font-medium">
              {cafes.length === 1 
                ? `Monitor performance and trends for ${cafes[0].name}.`
                : 'Monitor performance, views, and engagement metrics across your cafes.'}
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-brand-coffee">
              View Insights <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link to="/owner/claims" className="rounded-[40px] border border-brand-border bg-white p-10 hover:border-brand-coffee transition-all group shadow-sm hover:shadow-xl">
            <ClipboardList className="w-10 h-10 text-brand-coffee mb-8 group-hover:scale-110 transition-transform duration-500" />
            <h2 className="text-2xl font-serif font-bold text-brand-charcoal">Cafe Claims</h2>
            <p className="mt-2 text-brand-muted leading-relaxed font-medium">
              Submit new ownership claims or track the status of pending requests.
            </p>
            <div className="mt-8 flex items-center gap-2 text-sm font-bold text-brand-coffee">
              Track Claims <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
