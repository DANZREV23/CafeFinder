import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { CafeListSection } from '@/components/dashboard/CafeListSection';
import { getDashboardData, DashboardData } from '@/services/dashboardService';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Loader2, Settings, User } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardData = await getDashboardData();
        setData(dashboardData);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboard();
    }
  }, [user]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-coffee-600" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/login?redirect=/dashboard" />;
  }

  return (
    <MainLayout>
      <PageContainer>
        <div className="space-y-8 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stone-900 font-serif">Welcome back, {user.name}!</h1>
              <p className="text-stone-500 mt-1">Here's what's happening with your cafe discoveries.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/dashboard/collections" 
                className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors text-sm font-medium"
              >
                Collections
              </Link>
              <Link 
                to="/profile" 
                className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors text-sm font-medium"
              >
                <User className="w-4 h-4 text-stone-600" />
                <span>Edit Profile</span>
              </Link>
              <Link 
                to="/profile" 
                className="flex items-center gap-2 px-4 py-2 bg-brand-coffee text-white hover:bg-brand-coffee-dark rounded-lg transition-colors text-sm font-semibold shadow-sm"
              >
                <Settings className="w-4 h-4 text-white shrink-0" />
                <span className="text-white">Discovery Preferences</span>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-coffee-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Stats Grid */}
              <DashboardStats stats={data.stats} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content (Left/Center) */}
                <div className="lg:col-span-2 space-y-12">
                  <CafeListSection 
                    title="Recommendations for You" 
                    subtitle="Matched from your coffee taste, saved spots, and amenities"
                    cafes={data.recommendations} 
                    actionLink={{ href: '/profile', label: 'Preferences' }}
                  />
                  
                  <CafeListSection 
                    title="Your Recently Viewed" 
                    cafes={data.recentViews} 
                  />

                  <CafeListSection 
                    title="Recent Favorites" 
                    cafes={data.recentFavorites}
                    viewAllLink="/favorites"
                  />
                </div>

                {/* Sidebar (Right) */}
                <div className="space-y-8">
                  <RecentActivity 
                    reviews={data.recentReviews} 
                    submissions={data.recentSubmissions} 
                  />
                  
                  {/* Notifications Summary Card */}
                  <div className="bg-coffee-900 text-cream-50 p-6 rounded-xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="font-bold text-lg mb-2">Need help?</h3>
                      <p className="text-cream-200 text-sm mb-4">
                        Can't find your favorite cafe? Submit it to our curated database and help the community.
                      </p>
                      <Link 
                        to="/submit-cafe" 
                        className="inline-block bg-white text-coffee-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-cream-100 transition-colors shadow-sm"
                      >
                        Submit a Cafe
                      </Link>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </PageContainer>
    </MainLayout>
  );
};

export default DashboardPage;
